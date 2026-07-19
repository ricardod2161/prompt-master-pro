import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { aiGateBlockedResponse } from "../_shared/ai-wallet.ts";
import { chatWithFallback } from "../_shared/ai-with-fallback.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente especializado em análise de logs de sistemas de gestão de restaurantes e deliveries.

Sua função é:
1. Analisar logs de erro, warning e eventos do sistema
2. Identificar padrões e causas raiz de problemas
3. Sugerir correções específicas e acionáveis
4. Avaliar a saúde geral do sistema

Ao analisar os logs, considere:
- Frequência de erros similares
- Horários de pico com mais problemas
- Correlação entre diferentes tipos de eventos
- Impacto no negócio (pedidos, pagamentos, estoque)

Sempre responda em português brasileiro de forma clara e objetiva.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { logs, analysisType = "general" } = await req.json();

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum log fornecido para análise" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "Configuração de IA não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preparar contexto dos logs para análise
    const logsContext = logs.map((log: any) => ({
      action: log.action,
      category: log.category,
      severity: log.severity,
      description: log.description,
      timestamp: log.created_at,
      metadata: log.metadata,
    }));

    const userPrompt = `Analise os seguintes ${logs.length} logs do sistema:

${JSON.stringify(logsContext, null, 2)}

Tipo de análise solicitada: ${analysisType}

Por favor, forneça:
1. Um resumo executivo da saúde do sistema (OK, Atenção, Crítico)
2. Lista de problemas identificados com severidade
3. Sugestões de correção específicas para cada problema
4. Padrões ou tendências observadas
5. Recomendações preventivas`;

    const tools = [
      {
        type: "function",
        function: {
          name: "analyze_logs_result",
          description: "Resultado estruturado da análise de logs",
          parameters: {
            type: "object",
            properties: {
              health_status: { type: "string", enum: ["ok", "warning", "critical"] },
              health_summary: { type: "string" },
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    severity: { type: "string", enum: ["info", "warning", "error"] },
                    affected_area: { type: "string" },
                    suggested_fix: { type: "string" },
                    occurrences: { type: "number" },
                  },
                  required: ["title", "description", "severity", "suggested_fix"],
                },
              },
              patterns: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } },
              stats: {
                type: "object",
                properties: {
                  total_analyzed: { type: "number" },
                  errors_count: { type: "number" },
                  warnings_count: { type: "number" },
                  info_count: { type: "number" },
                },
              },
            },
            required: ["health_status", "health_summary", "issues", "recommendations", "stats"],
          },
        },
      },
    ];

    let result;
    try {
      result = await chatWithFallback({
        functionName: "analyze-logs",
        systemSlug: "admin",
        preferredModel: "google/gemini-3-flash-preview",
        openaiFallbackModel: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools,
        toolChoice: { type: "function", function: { name: "analyze_logs_result" } },
      });
    } catch (e: any) {
      if (typeof e?.message === "string" && e.message.startsWith("AI_GATE_BLOCKED")) {
        return aiGateBlockedResponse({ ok: false, reason: e.code ?? "SYSTEM_BLOCKED", available: e.available ?? 0 }, corsHeaders);
      }
      console.error("analyze-logs AI error:", e);
      return new Response(
        JSON.stringify({ error: "Erro ao processar análise de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrair resultado da tool call
    const toolCall = result.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const analysisResult = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ success: true, analysis: analysisResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback se não houver tool call
    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          health_status: "ok",
          health_summary: result.text || "Análise concluída",
          issues: [],
          patterns: [],
          recommendations: [],
          stats: {
            total_analyzed: logs.length,
            errors_count: logs.filter((l: any) => l.severity === "error").length,
            warnings_count: logs.filter((l: any) => l.severity === "warning").length,
            info_count: logs.filter((l: any) => l.severity === "info").length,
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    }
  } catch (error) {
    console.error("Error in analyze-logs:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
