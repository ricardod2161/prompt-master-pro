// Helper para débito de créditos na carteira do sistema (ai_systems).
// Cada chamada de IA DEVE indicar o `systemSlug` do sistema originador.
// Isolamento total: nunca consome créditos de outro sistema.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Fallback local (usado apenas se a tabela ai_model_pricing estiver indisponível).
// Fonte de verdade: public.ai_model_pricing (editável pelo admin).
const FALLBACK_PRICE_PER_1M: Record<string, number> = {
  "google/gemini-2.5-flash": 0.30,
  "google/gemini-2.5-flash-image": 0.30,
  "google/gemini-3-flash-preview": 0.35,
  "google/gemini-2.5-pro": 3.50,
  "google/gemini-3-pro-image-preview": 5.00,
  "google/gemini-3.1-pro-preview": 5.00,
  "openai/gpt-5": 5.00,
  "openai/gpt-5-mini": 0.50,
  "openai/gpt-5.5": 5.00,
  "gpt-4o-mini": 0.30,
  "gpt-4o": 5.00,
};

// Cache em memória (TTL 5min) — evita 1 SELECT por chamada de IA.
let _priceCache: Map<string, number> | null = null;
let _priceCacheAt = 0;
const PRICE_TTL_MS = 5 * 60 * 1000;

function admin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

async function loadPricing(): Promise<Map<string, number>> {
  const now = Date.now();
  if (_priceCache && now - _priceCacheAt < PRICE_TTL_MS) return _priceCache;
  const db = admin();
  const map = new Map<string, number>(Object.entries(FALLBACK_PRICE_PER_1M));
  if (db) {
    try {
      const { data } = await db.from("ai_model_pricing").select("model, price_per_1m_tokens");
      if (Array.isArray(data)) {
        for (const row of data as Array<{ model: string; price_per_1m_tokens: number }>) {
          map.set(row.model, Number(row.price_per_1m_tokens));
        }
      }
    } catch (e) {
      console.warn("[ai-wallet] pricing table read failed, using fallback:", e);
    }
  }
  _priceCache = map;
  _priceCacheAt = now;
  return map;
}

export async function estimateCostUsd(model: string, totalTokens: number): Promise<number> {
  if (!totalTokens) return 0;
  const map = await loadPricing();
  const rate = map.get(model) ?? FALLBACK_PRICE_PER_1M[model] ?? 1.0;
  return (totalTokens / 1_000_000) * rate;
}

export interface DebitOpts {
  systemSlug: string;
  amount?: number;
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  costUsd?: number;
  responseMs?: number;
  unitId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Debita créditos da carteira do sistema. Nunca lança — se falhar, apenas loga.
 * Retorna true em sucesso.
 */
export async function debitAISystem(opts: DebitOpts): Promise<boolean> {
  const db = admin();
  if (!db) return false;
  const amount = opts.amount ?? 1;
  try {
    const { error } = await db.rpc("ai_debit_credits", {
      _system_slug: opts.systemSlug,
      _amount: amount,
      _model: opts.model ?? null,
      _tokens_in: opts.tokensInput ?? 0,
      _tokens_out: opts.tokensOutput ?? 0,
      _cost_usd: opts.costUsd ?? 0,
      _response_ms: opts.responseMs ?? null,
      _user_id: opts.userId ?? null,
      _unit_id: opts.unitId ?? null,
      _metadata: opts.metadata ?? {},
    });
    if (error) {
      console.warn(`[ai-wallet] debit failed for ${opts.systemSlug}:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[ai-wallet] debit exception:", e);
    return false;
  }
}

/**
 * Verifica se o sistema está ativo e tem saldo suficiente.
 * Retorna { ok, reason } sem lançar. Usar ANTES de qualquer chamada ao provedor.
 */
export async function checkAISystem(
  systemSlug: string,
  minCredits = 1,
): Promise<{ ok: boolean; reason?: string; available?: number }> {
  const db = admin();
  if (!db) return { ok: true }; // fail-open se não tivermos backend
  try {
    const { data: sys } = await db
      .from("ai_systems")
      .select("id,status")
      .eq("slug", systemSlug)
      .maybeSingle();
    if (!sys) return { ok: false, reason: "SYSTEM_NOT_FOUND" };
    if (sys.status !== "active") return { ok: false, reason: `SYSTEM_${sys.status.toUpperCase()}` };

    const { data: wallet } = await db
      .from("ai_system_wallets")
      .select("available_credits")
      .eq("system_id", sys.id)
      .maybeSingle();
    const available = Number(wallet?.available_credits ?? 0);
    if (available < minCredits) {
      return { ok: false, reason: "INSUFFICIENT_CREDITS", available };
    }
    return { ok: true, available };
  } catch (e) {
    console.error("[ai-wallet] check exception:", e);
    return { ok: true }; // fail-open
  }
}

/** Resposta HTTP padronizada para uso nas edge functions ao falhar no gate. */
export function aiGateBlockedResponse(
  check: { ok: boolean; reason?: string; available?: number },
  corsHeaders: Record<string, string>,
): Response {
  const status = check.reason === "INSUFFICIENT_CREDITS" ? 402 : 403;
  const message =
    check.reason === "INSUFFICIENT_CREDITS"
      ? "Créditos de IA esgotados para este sistema."
      : check.reason === "SYSTEM_BLOCKED"
        ? "Este sistema de IA está bloqueado."
        : check.reason === "SYSTEM_SUSPENDED"
          ? "Este sistema de IA está suspenso."
          : check.reason === "SYSTEM_NOT_FOUND"
            ? "Sistema de IA não cadastrado."
            : "Chamada de IA bloqueada.";
  return new Response(
    JSON.stringify({ error: message, code: check.reason, available: check.available ?? 0 }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
