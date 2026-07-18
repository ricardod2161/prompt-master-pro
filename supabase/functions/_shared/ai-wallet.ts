// Helper para débito de créditos na carteira do sistema (ai_systems).
// Cada chamada de IA DEVE indicar o `systemSlug` do sistema originador.
// Isolamento total: nunca consome créditos de outro sistema.
//
// Uso:
//   import { debitAISystem, estimateCostUsd } from "../_shared/ai-wallet.ts";
//   await debitAISystem({
//     systemSlug: "whatsapp",
//     amount: 1,              // créditos a debitar (padrão: 1 por chamada)
//     model: "google/gemini-2.5-pro",
//     tokensInput: usage.prompt_tokens,
//     tokensOutput: usage.completion_tokens,
//     costUsd: estimateCostUsd(model, totalTokens),
//     responseMs: elapsed,
//     unitId, userId,
//   });

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PRICE_PER_1M: Record<string, number> = {
  "google/gemini-2.5-flash": 0.30,
  "google/gemini-2.5-flash-image": 0.30,
  "google/gemini-3-flash-preview": 0.35,
  "google/gemini-2.5-pro": 3.50,
  "google/gemini-3.1-pro-preview": 5.00,
  "openai/gpt-5-mini": 0.50,
  "openai/gpt-5.5": 5.00,
  "gpt-4o-mini": 0.30,
  "gpt-4o": 5.00,
};

export function estimateCostUsd(model: string, totalTokens: number): number {
  const rate = PRICE_PER_1M[model] ?? 1.0;
  return (totalTokens / 1_000_000) * rate;
}

function admin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
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
 * Retorna { ok, reason } sem lançar.
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
