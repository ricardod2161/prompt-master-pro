// PONTO ÚNICO DE CHAMADA DE IA (gate + provider + debit + log).
// Toda função de IA do sistema DEVE passar por aqui.
//
// Ordem obrigatória em cada invocação:
//   1) checkAISystem(systemSlug)  — aborta se bloqueado/sem crédito
//   2) chama Lovable AI (fallback OpenAI opcional em 402/429/5xx)
//   3) debitAISystem(...)         — debita a carteira do sistema
//   4) grava linha em ai_provider_logs (com credits_debited e system_slug)
//
// Suporta: content string OU array (multimodal: input_audio/image_url),
// tools + tool_choice (function-calling), e desabilitar fallback quando o
// provedor alternativo não conseguir processar o payload (ex: input_audio).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { debitAISystem, checkAISystem, estimateCostUsd } from "./ai-wallet.ts";

type ChatContent = string | Array<Record<string, unknown>>;
export type ChatMessage = { role: "system" | "user" | "assistant" | "tool"; content: ChatContent; [k: string]: unknown };

interface ChatOptions {
  functionName: string;
  unitId?: string | null;
  userId?: string | null;
  /** Slug do sistema (restaurant, whatsapp, marketing, admin). Obrigatório em produção — sem ele não há gate, débito nem tracking correto. */
  systemSlug?: string;
  messages: ChatMessage[];
  preferredModel?: string;
  openaiFallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Ferramentas (function-calling). Repassadas como estão para o gateway. */
  tools?: unknown;
  toolChoice?: unknown;
  /** Créditos a debitar por chamada (default 1). */
  creditsToDebit?: number;
  /** Se true, não tenta OpenAI ao falhar (útil p/ multimodal input_audio). */
  disableFallback?: boolean;
}

interface ChatResult {
  text: string;
  provider: "lovable" | "openai";
  model: string;
  fallbackUsed: boolean;
  totalTokens?: number;
  /** Mensagem crua do assistente (inclui tool_calls quando houver). */
  message: any;
  /** JSON completo do provedor. */
  raw: any;
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

async function logAttempt(entry: {
  functionName: string;
  systemSlug?: string;
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
  creditsDebited?: number;
  fallbackUsed: boolean;
  errorMessage?: string;
}) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;
    await admin.from("ai_provider_logs").insert({
      function_name: entry.functionName,
      system_slug: entry.systemSlug ?? null,
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
      credits_debited: entry.creditsDebited ?? null,
      fallback_used: entry.fallbackUsed,
      error_message: entry.errorMessage ?? null,
    });
  } catch (e) {
    console.error("[ai-fallback] failed to log:", e);
  }
}

async function callGateway(url: string, apiKey: string, opts: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs: number;
  tools?: unknown;
  toolChoice?: unknown;
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const body: Record<string, unknown> = {
      model: opts.model,
      messages: opts.messages,
    };
    if (opts.temperature !== undefined) body.temperature = opts.temperature;
    if (opts.maxTokens !== undefined) body.max_tokens = opts.maxTokens;
    if (opts.tools !== undefined) body.tools = opts.tools;
    if (opts.toolChoice !== undefined) body.tool_choice = opts.toolChoice;

    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const bodyText = await res.text();
    return { status: res.status, body: bodyText };
  } finally {
    clearTimeout(timer);
  }
}

function shouldFallback(httpStatus: number): boolean {
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
    tools,
    toolChoice,
    creditsToDebit = 1,
    disableFallback = false,
  } = opts;

  // ── 1) GATE ───────────────────────────────────────────
  if (systemSlug) {
    const gate = await checkAISystem(systemSlug, creditsToDebit);
    if (!gate.ok) {
      const err = new Error(`AI_GATE_BLOCKED:${gate.reason ?? "UNKNOWN"}`);
      (err as any).code = gate.reason;
      (err as any).available = gate.available ?? 0;
      // log da tentativa bloqueada
      await logAttempt({
        functionName,
        systemSlug,
        unitId,
        provider: "lovable",
        model: preferredModel,
        status: "error",
        durationMs: 0,
        fallbackUsed: false,
        creditsDebited: 0,
        errorMessage: `GATE_BLOCKED:${gate.reason ?? "UNKNOWN"}`,
      });
      throw err;
    }
  }

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

  // ── 2) LOVABLE ────────────────────────────────────────
  const t0 = Date.now();
  let lovableError: string | undefined;
  let lovableStatus = 0;

  try {
    const { status, body } = await callGateway(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      lovableKey,
      { model: preferredModel, messages, temperature, maxTokens, timeoutMs, tools, toolChoice },
    );
    lovableStatus = status;

    if (status >= 200 && status < 300) {
      const parsed = JSON.parse(body);
      const message = parsed.choices?.[0]?.message ?? {};
      const text = typeof message.content === "string" ? message.content : "";
      const usage = parsed.usage ?? {};
      const totalTokens = usage.total_tokens ?? 0;
      const cost = await estimateCostUsd(preferredModel, totalTokens);
      const durationMs = Date.now() - t0;

      // ── 3) DEBIT ───────────────────────────────────────
      if (systemSlug) {
        await debitAISystem({
          systemSlug, amount: creditsToDebit, model: preferredModel,
          tokensInput: usage.prompt_tokens, tokensOutput: usage.completion_tokens,
          costUsd: cost, responseMs: durationMs,
          unitId, userId, metadata: { function: functionName, fallback: false },
        });
      }

      // ── 4) LOG ─────────────────────────────────────────
      await logAttempt({
        functionName, systemSlug, unitId,
        provider: "lovable", model: preferredModel,
        status: "success", httpStatus: status, durationMs,
        promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens,
        totalTokens, estimatedCostUsd: cost,
        creditsDebited: systemSlug ? creditsToDebit : 0,
        fallbackUsed: false,
      });

      return { text, provider: "lovable", model: preferredModel, fallbackUsed: false, totalTokens, message, raw: parsed };
    }

    lovableError = `HTTP ${status}: ${body.slice(0, 500)}`;

    if (!shouldFallback(status) || disableFallback) {
      await logAttempt({
        functionName, systemSlug, unitId,
        provider: "lovable", model: preferredModel,
        status: "error", httpStatus: status,
        durationMs: Date.now() - t0,
        creditsDebited: 0, fallbackUsed: false,
        errorMessage: lovableError,
      });
      throw new Error(`Lovable AI error: ${lovableError}`);
    }
  } catch (e) {
    if (!lovableError) lovableError = e instanceof Error ? e.message : String(e);
  }

  // log da falha antes do fallback (se estivermos indo pro fallback)
  await logAttempt({
    functionName, systemSlug, unitId,
    provider: "lovable", model: preferredModel,
    status: "error", httpStatus: lovableStatus || undefined,
    durationMs: Date.now() - t0,
    creditsDebited: 0, fallbackUsed: false,
    errorMessage: lovableError,
  });

  if (disableFallback) {
    throw new Error(lovableError ?? "Lovable AI failed");
  }

  // ── 2b) OPENAI FALLBACK ───────────────────────────────
  console.warn(`[ai-fallback] Lovable failed (${lovableError}), trying OpenAI ${openaiFallbackModel}`);
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error(`Lovable failed and OPENAI_API_KEY not configured. Lovable err: ${lovableError}`);

  const t1 = Date.now();
  try {
    const { status, body } = await callGateway(
      "https://api.openai.com/v1/chat/completions",
      openaiKey,
      { model: openaiFallbackModel, messages, temperature, maxTokens, timeoutMs, tools, toolChoice },
    );

    if (status >= 200 && status < 300) {
      const parsed = JSON.parse(body);
      const message = parsed.choices?.[0]?.message ?? {};
      const text = typeof message.content === "string" ? message.content : "";
      const usage = parsed.usage ?? {};
      const totalTokens = usage.total_tokens ?? 0;
      const cost = await estimateCostUsd(openaiFallbackModel, totalTokens);
      const durationMs = Date.now() - t1;

      if (systemSlug) {
        await debitAISystem({
          systemSlug, amount: creditsToDebit, model: openaiFallbackModel,
          tokensInput: usage.prompt_tokens, tokensOutput: usage.completion_tokens,
          costUsd: cost, responseMs: durationMs,
          unitId, userId, metadata: { function: functionName, fallback: true },
        });
      }

      await logAttempt({
        functionName, systemSlug, unitId,
        provider: "openai", model: openaiFallbackModel,
        status: "success", httpStatus: status, durationMs,
        promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens,
        totalTokens, estimatedCostUsd: cost,
        creditsDebited: systemSlug ? creditsToDebit : 0,
        fallbackUsed: true,
      });

      return { text, provider: "openai", model: openaiFallbackModel, fallbackUsed: true, totalTokens, message, raw: parsed };
    }

    const errMsg = `OpenAI HTTP ${status}: ${body.slice(0, 500)}`;
    await logAttempt({
      functionName, systemSlug, unitId,
      provider: "openai", model: openaiFallbackModel,
      status: "error", httpStatus: status,
      durationMs: Date.now() - t1,
      creditsDebited: 0, fallbackUsed: true,
      errorMessage: errMsg,
    });
    throw new Error(errMsg);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await logAttempt({
      functionName, systemSlug, unitId,
      provider: "openai", model: openaiFallbackModel,
      status: "error",
      durationMs: Date.now() - t1,
      creditsDebited: 0, fallbackUsed: true,
      errorMessage: errMsg,
    });
    throw new Error(`Both providers failed. Lovable: ${lovableError}. OpenAI: ${errMsg}`);
  }
}
