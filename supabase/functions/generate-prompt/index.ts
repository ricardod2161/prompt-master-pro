import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_PROMPT = `Você é um especialista em criar prompts de sistema para bots de atendimento via WhatsApp em restaurantes e estabelecimentos de alimentação.

O usuário vai descrever o tipo de negócio dele. Você deve gerar um prompt de sistema COMPLETO e PROFISSIONAL para o bot de atendimento WhatsApp.

O prompt gerado DEVE incluir:

1. **Identidade do bot**: Quem ele é, de qual estabelecimento, tom de voz adequado ao tipo de negócio
2. **Comportamento**: Cordial, profissional, objetivo. Usar emojis moderadamente
3. **Fluxo de atendimento**: Como lidar com pedidos (perguntar itens, quantidades, confirmar)
4. **Cardápio**: Instruir o bot a apresentar o cardápio quando solicitado
5. **Informações operacionais**: Horário de funcionamento, formas de pagamento, delivery
6. **Limites**: O que o bot NÃO deve fazer (inventar itens, dar descontos sem autorização)
7. **Escalação**: Quando transferir para atendimento humano (reclamações, problemas complexos)
8. **Finalização**: Sempre confirmar pedido completo antes de finalizar
9. **Linguagem**: Português brasileiro, informal mas respeitoso

REGRAS:
- Retorne APENAS o prompt de sistema, sem explicações adicionais
- O prompt deve ser detalhado mas não excessivamente longo (entre 800-1500 caracteres)
- Adapte o tom ao tipo de negócio (uma hamburgueria é mais descontraída, um restaurante fino é mais formal)
- Inclua instruções sobre como lidar com pedidos de delivery vs retirada
- NÃO inclua itens de cardápio específicos (o bot terá acesso ao cardápio real)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessDescription, restaurantName } = await req.json();

    if (!businessDescription || businessDescription.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Descreva seu negócio com pelo menos 5 caracteres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração de IA não encontrada." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: META_PROMPT },
          { role: "user", content: `Nome do estabelecimento: ${(restaurantName || "").trim() || "Não informado"}\nMeu negócio: ${businessDescription.trim()}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao gerar prompt com IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const generatedPrompt = aiResponse.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      return new Response(
        JSON.stringify({ error: "Não foi possível gerar o prompt. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, prompt: generatedPrompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-prompt:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
