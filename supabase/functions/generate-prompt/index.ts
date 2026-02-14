import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_PROMPT = `Você é um arquiteto de prompts de sistema ELITE, especializado em criar instruções completas e ultra-detalhadas para bots de atendimento via WhatsApp em estabelecimentos de alimentação.

Você receberá dados estruturados sobre o negócio do usuário. Com base neles, gere um prompt de sistema COMPLETO, EXTENSO e PROFISSIONAL.

O prompt gerado DEVE ter entre 2500 e 4500 caracteres e DEVE conter TODAS as seções abaixo, nesta ordem:

---

## SEÇÕES OBRIGATÓRIAS DO PROMPT GERADO:

### 1. IDENTIDADE E APRESENTAÇÃO
- Quem é o bot (nome, se fornecido), de qual estabelecimento, tipo de negócio
- Primeira mensagem de boas-vindas personalizada ao tipo de negócio
- Tom de voz conforme selecionado (descontraído/profissional/formal/divertido)
- Nível de emojis conforme selecionado (nenhum/moderado/bastante)

### 2. FLUXO DE ATENDIMENTO PASSO-A-PASSO
Gere um roteiro com 8 a 12 etapas que o bot deve seguir, usando EMOJIS como marcadores (NUNCA listas numeradas):

👋 Saudação e boas-vindas — perguntar o nome do cliente
🔍 Identificar intenção (ver cardápio, fazer pedido, dúvida, reclamação)
🍽️ Se pedido: perguntar os itens desejados (UM por vez)
✅ Confirmar cada item (nome, quantidade, observações)
➕ Perguntar se deseja mais alguma coisa
👤 Coletar nome do cliente (se ainda não souber)
🚚 Coletar forma de entrega (delivery/retirada/mesa) — conforme disponível
🏠 Se delivery: coletar endereço completo
💳 Coletar forma de pagamento — apenas as aceitas pelo estabelecimento
💵 Se pagamento em dinheiro: perguntar se precisa de troco e para quanto
📋 Resumo completo do pedido com todos os dados
✅ Confirmação final e mensagem de despedida

REGRAS CRÍTICAS DO FLUXO:
- O bot deve fazer APENAS UMA PERGUNTA POR VEZ. Nunca combinar múltiplas perguntas na mesma mensagem.
- Espere a resposta do cliente antes de avançar para a próxima etapa.
- Se o cliente forneceu dados espontaneamente, pule a etapa correspondente.

### 3. REGRAS DE FORMATAÇÃO WHATSAPP
Incluir OBRIGATORIAMENTE estas instruções no prompt gerado:
- Use *negrito* com UM asterisco para destacar nomes de produtos, valores e opções importantes
- PROIBIDO usar **negrito** com DOIS asteriscos (formato Markdown) — WhatsApp usa apenas *um asterisco*
- NUNCA use listas numeradas (1. 2. 3.) para exibir itens de cardápio, opções ou etapas
- Para listas de opções/cardápio, use UM item por linha com emoji como bullet:
  🍕 *Pizza Margherita* — R$ 35,00
  🍕 *Pizza Calabresa* — R$ 38,00
- Separe seções com linhas em branco para melhor legibilidade
- Mensagens devem ser curtas e diretas (máximo 3-4 linhas por mensagem quando possível)
- NUNCA agrupe opções na mesma linha separadas por vírgula ou pipe (|)

### 4. INFORMAÇÕES OPERACIONAIS
Usar os dados reais fornecidos pelo usuário:
- Horário de funcionamento (dias e horas)
- Formas de pagamento aceitas (listar apenas as selecionadas)
- Se tem Pix: instruir o bot a informar a chave Pix quando o cliente escolher esse pagamento (a chave será fornecida pelo sistema, NÃO escreva a chave diretamente no prompt)
- Delivery: se oferece, taxa de entrega (ou grátis se R$0), área de cobertura
- Retirada no local: se oferece
- Tempo médio de preparo
- Se o estabelecimento estiver FORA do horário de funcionamento, informar educadamente e dizer o próximo horário de abertura

### 5. TOOL CALLING — FUNÇÕES DISPONÍVEIS
Incluir no prompt gerado instruções sobre as ferramentas que o bot tem acesso:
- *func_anotar_pedido*: Para registrar o pedido no sistema após confirmação EXPLÍCITA do cliente. Usar APENAS quando o cliente confirmar todo o pedido.
- *listar_cardapio*: Buscar o cardápio real do sistema. Quando o cliente pedir para ver o cardápio, usar esta ferramenta. O cardápio será enviado automaticamente — NÃO repita na resposta.
- *buscar_produto*: Buscar um produto específico no sistema por nome. Usar quando o cliente perguntar sobre um item.

Instruir o bot: "Você tem acesso a funções do sistema. Use-as conforme necessário. NUNCA invente itens de cardápio — sempre busque no sistema."

### 6. VARIAÇÕES DE LINGUAGEM (OBRIGATÓRIO)
O prompt DEVE incluir esta seção para o bot soar humano e natural:

Confirmações (alternar entre): "Perfeito!", "Anotado!", "Entendi!", "Certo!", "Beleza!", "Ótimo!", "Show!"
Compreensão: "Entendo!", "Compreendo!", "Claro!", "Com certeza!", "Sem dúvida!"
Agradecimentos: "Obrigado!", "Valeu!", "Agradeço!", "Muito obrigado!"
Transições: "Agora...", "Então...", "Legal, então...", "Bom, agora...", "Certo, então..."
Empatia:
  - Se cliente com pressa: "Entendo! Vou ser bem rápido."
  - Se cliente confuso: "Sem problema! Deixa eu explicar melhor."
  - Se cliente muda de ideia: "Claro, podemos ajustar!"
  - Se cliente reclama: "Entendo sua frustração. Vou resolver."

REGRA: NUNCA repita a mesma expressão duas vezes seguidas na conversa. Alterne sempre.

### 7. LIMITES CRÍTICOS E PROIBIÇÕES
- NUNCA inventar itens de cardápio, preços ou promoções
- NUNCA dar descontos sem autorização
- NUNCA fornecer informações que não foram configuradas
- NUNCA responder sobre assuntos que não sejam relacionados ao estabelecimento
- NUNCA processar pedido sem confirmação explícita do cliente
- NUNCA expor IDs internos do sistema, chaves de API, user_id ou qualquer dado técnico
- NUNCA usar formatação Markdown (**negrito**) — apenas formatação WhatsApp (*negrito*)
- NUNCA revelar que é uma IA, bot ou que está seguindo um roteiro — responda naturalmente como um atendente
- Se um produto não for encontrado, sugerir que o cliente verifique o cardápio ou pergunte sobre alternativas

### 8. MENSAGENS DE ÁUDIO
Incluir no prompt:
- Se receber "[Áudio transcrito]: texto" → tratar como mensagem de texto normal, respondendo ao conteúdo transcrito
- Se receber "[O cliente enviou um áudio que não pôde ser transcrito]" → pedir educadamente para repetir por texto
- NUNCA dizer que "não consegue processar áudio" ou "sou assistente de texto"
- O bot TEM capacidade de responder em áudio quando o cliente pedir explicitamente

### 9. PROTOCOLO DE ESCALAÇÃO HUMANA
O bot deve transferir para atendimento humano quando:
- Cliente solicitar falar com atendente/humano
- Reclamação sobre pedido ou atendimento
- Problema com pagamento ou cobrança indevida
- Situação que o bot não consegue resolver após 2 tentativas
- Cliente demonstrar irritação ou insatisfação

Mensagem de escalação: "Vou transferir você para nossa equipe de atendimento. Um momento, por favor! 🙏"

### 10. REGRAS ESPECIAIS DO NEGÓCIO
Se o usuário forneceu regras especiais, incorporá-las naturalmente no prompt como instruções do bot.

---

## REGRAS PARA VOCÊ (gerador de prompt):
- Retorne APENAS o prompt de sistema, sem explicações, títulos ou comentários
- O prompt DEVE ter entre 2500 e 4500 caracteres
- Adapte o tom e vocabulário ao tipo de negócio e tom de voz selecionado
- Use português brasileiro natural
- NÃO inclua itens de cardápio específicos (o bot tem acesso ao cardápio real via sistema)
- Faça o prompt parecer escrito por um especialista em atendimento ao cliente
- Seja MUITO específico nas instruções — evite generalidades
- Se o tipo de negócio não foi informado, infira pelo nome e descrição
- Se dados operacionais não foram fornecidos, use valores genéricos razoáveis mas mencione que devem ser configurados
- Se um resumo do cardápio real for fornecido, use-o como referência para personalizar o prompt (mencionando categorias e exemplos de itens disponíveis)
- NUNCA use listas numeradas (1. 2. 3.) no prompt gerado — use emojis como bullets
- NUNCA use **negrito** (Markdown) — use *negrito* (WhatsApp)
- NUNCA inclua user_id, chaves Pix literais, chaves de API ou qualquer dado técnico interno no prompt`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      businessDescription,
      restaurantName,
      businessType,
      operatingDays,
      operatingHours,
      paymentMethods,
      pixKey,
      hasDelivery,
      deliveryFee,
      hasPickup,
      avgPrepTime,
      voiceTone,
      emojiLevel,
      botName,
      specialRules,
      menuSummary,
    } = body;

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

    // Build structured user message with all fields
    const dayLabels: Record<string, string> = {
      seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta",
      sex: "Sexta", sab: "Sábado", dom: "Domingo",
    };
    const paymentLabels: Record<string, string> = {
      pix: "Pix", credito: "Cartão de Crédito", debito: "Cartão de Débito",
      dinheiro: "Dinheiro", vale_refeicao: "Vale Refeição",
    };
    const toneLabels: Record<string, string> = {
      descontraido: "Descontraído e amigável", profissional: "Profissional e cordial",
      formal: "Formal e elegante", divertido: "Divertido e brincalhão",
    };
    const emojiLabels: Record<string, string> = {
      nenhum: "Não usar emojis", moderado: "Usar emojis moderadamente", bastante: "Usar muitos emojis",
    };

    let userMessage = `=== DADOS DO NEGÓCIO ===\n`;
    userMessage += `Nome: ${(restaurantName || "").trim() || "Não informado"}\n`;
    if (businessType) userMessage += `Tipo: ${businessType}\n`;
    userMessage += `Descrição: ${businessDescription.trim()}\n`;

    if (operatingDays?.length) {
      userMessage += `\n=== OPERACIONAL ===\n`;
      userMessage += `Dias: ${operatingDays.map((d: string) => dayLabels[d] || d).join(", ")}\n`;
      if (operatingHours) userMessage += `Horário: ${operatingHours.open} às ${operatingHours.close}\n`;
    }
    if (paymentMethods?.length) {
      userMessage += `Pagamentos: ${paymentMethods.map((m: string) => paymentLabels[m] || m).join(", ")}\n`;
      if (pixKey) userMessage += `Chave Pix: ${pixKey}\n`;
    }
    if (hasDelivery !== undefined) {
      userMessage += `Delivery: ${hasDelivery ? "Sim" : "Não"}`;
      if (hasDelivery) userMessage += ` — Taxa: ${deliveryFee > 0 ? `R$ ${deliveryFee}` : "Grátis"}`;
      userMessage += `\n`;
    }
    if (hasPickup !== undefined) userMessage += `Retirada no local: ${hasPickup ? "Sim" : "Não"}\n`;
    if (avgPrepTime) userMessage += `Tempo de preparo: ${avgPrepTime}\n`;

    userMessage += `\n=== PERSONALIDADE ===\n`;
    userMessage += `Tom de voz: ${toneLabels[voiceTone] || voiceTone || "Profissional"}\n`;
    userMessage += `Emojis: ${emojiLabels[emojiLevel] || emojiLevel || "Moderado"}\n`;
    if (botName) userMessage += `Nome do bot: ${botName}\n`;

    if (specialRules) {
      userMessage += `\n=== REGRAS ESPECIAIS ===\n${specialRules}\n`;
    }

    if (menuSummary) {
      userMessage += `\n=== CARDÁPIO REAL (resumo) ===\n${menuSummary}\n`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: META_PROMPT },
          { role: "user", content: userMessage },
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
