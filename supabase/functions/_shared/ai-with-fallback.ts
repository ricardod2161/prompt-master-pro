// Chat completion helper com fallback automático:
// 1. Tenta Lovable AI Gateway (Gemini/GPT via LOVABLE_API_KEY)
// 2. Se falhar com 402/429/5xx/timeout → cai pra OpenAI direto
// 3. Loga cada tentativa em `ai_provider_logs`
//
// Uso:
//   import { chatWithFallback } from "../_shared/ai-with-fallback.ts";
//   const { text } = await chatWithFallback({
//     functionName: "generate-prompt",
//     unitId,
//     messages: [{ role: "user", content: "..." }],
//     preferredModel: "google/gemini-2.5-flash",
//     openaiFallbackModel: "gpt-4o-mini",
//   });

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { debitAISystem } from "./ai-wallet.ts";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

interface ChatOptions {
  functionName: string;
  unitId?: string | null;
  userId?: string | null;
  /** Slug do sistema que originou a chamada (restaurant, whatsapp, marketing, ...).
   *  Obrigatório para debitar a carteira correta. */
  systemSlug?: string;
  messages: ChatMessage[];
  preferredModel?: string;              // ex: "google/gemini-2.5-flash"
  openaiFallbackModel?: string;         // ex: "gpt-4o-mini"
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;                   // default 30s
}

interface ChatResult {
  text: string;
  provider: "lovable" | "openai";
  model: string;
  fallbackUsed: boolean;
  totalTokens?: number;
}

// Preços aproximados por 1M tokens (input+output combinados, USD)
// Fonte: preços públicos dos provedores (2026-01)
const PRICE_PER_1M_TOKENS: Record<string, number> = {
  "google/gemini-2.5-flash": 0.30,
  "google/gemini-3-flash-preview": 0.35,
  "google/gemini-2.5-pro": 3.50,
  "google/gemini-3.1-pro-preview": 5.00,
  "openai/gpt-5-mini": 0.50,
  "openai/gpt-5.5": 5.00,
  "gpt-4o-mini": 0.30,
  "gpt-4o": 5.00,
};

function estimateCostUsd(model: string, totalTokens: number): number {
  const rate = PRICE_PER_1M_TOKENS[model] ?? 1.0;
  return (totalTokens / 1_000_000) * rate;
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

async function logAttempt(entry: {
  functionName: string;
  unitId?: string | null;
  provider: string;
  model?: string;
  status: "success" | "error";
  httpStatus?: number;
  durationMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  fallbackUsed: boolean;
  errorMessage?: string;
}) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;
    await admin.from("ai_provider_logs").insert({
      function_name: entry.functionName,
      unit_id: entry.unitId ?? null,
      provider: entry.provider,
      model: entry.model ?? null,
      status: entry.status,
      http_status: entry.httpStatus ?? null,
      duration_ms: entry.durationMs,
      prompt_tokens: entry.promptTokens ?? null,
      completion_tokens: entry.completionTokens ?? null,
      total_tokens: entry.totalTokens ?? null,
      estimated_cost_usd: entry.estimatedCostUsd ?? null,
      fallback_used: entry.fallbackUsed,
      error_message: entry.errorMessage ?? null,
    });
  } catch (e) {
    console.error("[ai-fallback] failed to log:", e);
  }
}

async function callLovable(opts: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs: number;
}) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
        ...(opts.maxTokens !== undefined ? { max_tokens: opts.maxTokens } : {}),
      }),
    });
    const body = await res.text();
    return { status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI(opts: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs: number;
}) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
        ...(opts.maxTokens !== undefined ? { max_tokens: opts.maxTokens } : {}),
      }),
    });
    const body = await res.text();
    return { status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

function shouldFallback(httpStatus: number): boolean {
  // 402 (créditos), 429 (rate limit), 5xx (indisponível) → fallback
  return httpStatus === 402 || httpStatus === 429 || httpStatus >= 500;
}

export async function chatWithFallback(opts: ChatOptions): Promise<ChatResult> {
  const {
    functionName,
    unitId,
    userId,
    systemSlug,
    messages,
    preferredModel = "google/gemini-2.5-flash",
    openaiFallbackModel = "gpt-4o-mini",
    temperature,
    maxTokens,
    timeoutMs = 30_000,
  } = opts;

  // ── Tentativa 1: Lovable AI ───────────────────────────
  const t0 = Date.now();
  let lovableError: string | undefined;
  let lovableStatus = 0;

  try {
    const { status, body } = await callLovable({
      model: preferredModel,
      messages,
      temperature,
      maxTokens,
      timeoutMs,
    });
    lovableStatus = status;

    if (status >= 200 && status < 300) {
      const parsed = JSON.parse(body);
      const text = parsed.choices?.[0]?.message?.content ?? "";
      const usage = parsed.usage ?? {};
      const totalTokens = usage.total_tokens ?? 0;
      const cost = estimateCostUsd(preferredModel, totalTokens);

      await logAttempt({
        functionName,
        unitId,
        provider: "lovable",
        model: preferredModel,
        status: "success",
        httpStatus: status,
        durationMs: Date.now() - t0,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens,
        estimatedCostUsd: cost,
        fallbackUsed: false,
      });

      if (systemSlug) {
        await debitAISystem({
          systemSlug, amount: 1, model: preferredModel,
          tokensInput: usage.prompt_tokens, tokensOutput: usage.completion_tokens,
          costUsd: cost, responseMs: Date.now() - t0,
          unitId, userId, metadata: { function: functionName, fallback: false },
        });
      }

      return { text, provider: "lovable", model: preferredModel, fallbackUsed: false, totalTokens };
    }

    lovableError = `HTTP ${status}: ${body.slice(0, 500)}`;

    if (!shouldFallback(status)) {
      // Erro terminal (400 bad request etc.) — não vale a pena fallback
      await logAttempt({
        functionName,
        unitId,
        provider: "lovable",
        model: preferredModel,
        status: "error",
        httpStatus: status,
        durationMs: Date.now() - t0,
        fallbackUsed: false,
        errorMessage: lovableError,
      });
      throw new Error(`Lovable AI error: ${lovableError}`);
    }
  } catch (e) {
    lovableError = e instanceof Error ? e.message : String(e);
    if (lovableStatus === 0) lovableStatus = 0; // timeout/network
  }

  // Log da falha do Lovable antes do fallback
  await logAttempt({
    functionName,
    unitId,
    provider: "lovable",
    model: preferredModel,
    status: "error",
    httpStatus: lovableStatus || undefined,
    durationMs: Date.now() - t0,
    fallbackUsed: false,
    errorMessage: lovableError,
  });

  // ── Tentativa 2: OpenAI fallback ──────────────────────
  console.warn(`[ai-fallback] Lovable failed (${lovableError}), trying OpenAI ${openaiFallbackModel}`);

  const t1 = Date.now();
  try {
    const { status, body } = await callOpenAI({
      model: openaiFallbackModel,
      messages,
      temperature,
      maxTokens,
      timeoutMs,
    });

    if (status >= 200 && status < 300) {
      const parsed = JSON.parse(body);
      const text = parsed.choices?.[0]?.message?.content ?? "";
      const usage = parsed.usage ?? {};
      const totalTokens = usage.total_tokens ?? 0;
      const cost = estimateCostUsd(openaiFallbackModel, totalTokens);

      await logAttempt({
        functionName,
        unitId,
        provider: "openai",
        model: openaiFallbackModel,
        status: "success",
        httpStatus: status,
        durationMs: Date.now() - t1,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens,
        estimatedCostUsd: cost,
        fallbackUsed: true,
      });

      if (systemSlug) {
        await debitAISystem({
          systemSlug, amount: 1, model: openaiFallbackModel,
          tokensInput: usage.prompt_tokens, tokensOutput: usage.completion_tokens,
          costUsd: cost, responseMs: Date.now() - t1,
          unitId, userId, metadata: { function: functionName, fallback: true },
        });
      }

      return { text, provider: "openai", model: openaiFallbackModel, fallbackUsed: true, totalTokens };
    }

    const errMsg = `OpenAI HTTP ${status}: ${body.slice(0, 500)}`;
    await logAttempt({
      functionName,
      unitId,
      provider: "openai",
      model: openaiFallbackModel,
      status: "error",
      httpStatus: status,
      durationMs: Date.now() - t1,
      fallbackUsed: true,
      errorMessage: errMsg,
    });
    throw new Error(errMsg);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await logAttempt({
      functionName,
      unitId,
      provider: "openai",
      model: openaiFallbackModel,
      status: "error",
      durationMs: Date.now() - t1,
      fallbackUsed: true,
      errorMessage: errMsg,
    });
    throw new Error(`Both providers failed. Lovable: ${lovableError}. OpenAI: ${errMsg}`);
  }
}
