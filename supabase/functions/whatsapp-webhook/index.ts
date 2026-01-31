import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp?: number;
  };
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  delivery_price: number | null;
  category: { name: string } | null;
}

// Tool definitions for function calling
const tools = [
  {
    type: "function",
    function: {
      name: "listar_cardapio",
      description: "Lista o cardápio completo do restaurante com todos os produtos disponíveis, organizados por categoria. Use quando o cliente pedir para ver o cardápio, menu, o que tem disponível, etc.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "buscar_produto",
      description: "Busca um produto específico pelo nome. Use quando o cliente perguntar sobre um item específico, preço de algo, ou se tem determinado produto.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome ou parte do nome do produto a buscar" }
        },
        required: ["nome"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calcular_total",
      description: "Calcula o valor total de um pedido com base nos itens e quantidades. Use quando o cliente quiser saber quanto vai dar o pedido.",
      parameters: {
        type: "object",
        properties: {
          itens: {
            type: "array",
            description: "Lista de itens do pedido",
            items: {
              type: "object",
              properties: {
                nome: { type: "string", description: "Nome do produto" },
                quantidade: { type: "number", description: "Quantidade do item" }
              },
              required: ["nome", "quantidade"]
            }
          }
        },
        required: ["itens"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "criar_pedido",
      description: "Cria um pedido no sistema. Use apenas quando o cliente confirmar que quer fazer o pedido, após informar todos os itens, endereço e forma de pagamento.",
      parameters: {
        type: "object",
        properties: {
          itens: {
            type: "array",
            description: "Lista de itens do pedido",
            items: {
              type: "object",
              properties: {
                nome: { type: "string", description: "Nome do produto" },
                quantidade: { type: "number", description: "Quantidade" }
              },
              required: ["nome", "quantidade"]
            }
          },
          endereco: { type: "string", description: "Endereço de entrega completo" },
          forma_pagamento: { 
            type: "string", 
            description: "Forma de pagamento escolhida",
            enum: ["dinheiro", "cartao_credito", "cartao_debito", "pix"]
          },
          observacoes: { type: "string", description: "Observações do pedido" }
        },
        required: ["itens", "endereco", "forma_pagamento"]
      }
    }
  }
];

// Parse action from content when AI returns JSON instead of using tool_calls
function parseActionFromContent(content: string): { action: string; input: Record<string, unknown> } | null {
  if (!content) return null;
  
  try {
    // Match JSON containing action/action_input pattern
    const jsonMatch = content.match(/\{[\s\S]*?"action"[\s\S]*?"action_input"[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.action && parsed.action_input !== undefined) {
        let input = parsed.action_input;
        // action_input can be a string (JSON) or already an object
        if (typeof input === "string") {
          try {
            input = JSON.parse(input);
          } catch {
            // If it's not valid JSON, use as-is
            input = { value: input };
          }
        }
        console.log(`Detected action in content: ${parsed.action}`, input);
        return { action: parsed.action, input: input || {} };
      }
    }
  } catch (error) {
    console.error("Error parsing action from content:", error);
  }
  return null;
}

// Sanitize response to remove any JSON or technical content
function sanitizeResponse(response: string): string {
  if (!response) return "";
  
  // Remove JSON blocks
  let sanitized = response.replace(/```json[\s\S]*?```/g, "");
  sanitized = sanitized.replace(/```[\s\S]*?```/g, "");
  
  // Remove action/action_input JSON patterns
  sanitized = sanitized.replace(/\{[\s\S]*?"action"[\s\S]*?"action_input"[\s\S]*?\}/g, "");
  
  // Remove other common technical patterns
  sanitized = sanitized.replace(/\{[\s\S]*?"function_call"[\s\S]*?\}/g, "");
  sanitized = sanitized.replace(/\{[\s\S]*?"tool_calls?"[\s\S]*?\}/g, "");
  
  // Clean up multiple newlines and whitespace
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n");
  sanitized = sanitized.trim();
  
  return sanitized;
}

// Tool execution functions
async function executeTool(
  supabase: any,
  unitId: string,
  toolName: string,
  args: Record<string, unknown>,
  customerPhone: string,
  customerName: string
): Promise<string> {
  console.log(`Executing tool: ${toolName} with args:`, JSON.stringify(args));

  switch (toolName) {
    case "listar_cardapio":
      return await listarCardapio(supabase, unitId);
    case "buscar_produto":
      return await buscarProduto(supabase, unitId, args.nome as string);
    case "calcular_total":
      return await calcularTotal(supabase, unitId, args.itens as Array<{nome: string, quantidade: number}>);
    case "criar_pedido":
      return await criarPedido(
        supabase, 
        unitId, 
        args.itens as Array<{nome: string, quantidade: number}>,
        args.endereco as string,
        args.forma_pagamento as string,
        args.observacoes as string | undefined,
        customerPhone,
        customerName
      );
    default:
      return `Ferramenta "${toolName}" não encontrada.`;
  }
}

async function listarCardapio(
  supabase: any,
  unitId: string
): Promise<string> {
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      delivery_price,
      category:categories(name)
    `)
    .eq("unit_id", unitId)
    .eq("available", true)
    .order("name");

  if (error) {
    console.error("Error fetching menu:", error);
    return "Erro ao buscar o cardápio. Por favor, tente novamente.";
  }

  if (!products || products.length === 0) {
    return "No momento não temos produtos disponíveis no cardápio.";
  }

  // Group by category
  const byCategory: Record<string, Product[]> = {};
  for (const product of products as Product[]) {
    const categoryName = product.category?.name || "Outros";
    if (!byCategory[categoryName]) {
      byCategory[categoryName] = [];
    }
    byCategory[categoryName].push(product);
  }

  let menu = "CARDÁPIO DISPONÍVEL:\n\n";
  for (const [category, items] of Object.entries(byCategory)) {
    menu += `📋 ${category.toUpperCase()}\n`;
    for (const item of items) {
      const price = item.delivery_price || item.price;
      menu += `• ${item.name} - R$ ${price.toFixed(2)}`;
      if (item.description) {
        menu += `\n  ${item.description}`;
      }
      menu += "\n";
    }
    menu += "\n";
  }

  return menu;
}

async function buscarProduto(
  supabase: any,
  unitId: string,
  nome: string
): Promise<string> {
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      name,
      description,
      price,
      delivery_price,
      category:categories(name)
    `)
    .eq("unit_id", unitId)
    .eq("available", true)
    .ilike("name", `%${nome}%`);

  if (error) {
    console.error("Error searching product:", error);
    return "Erro ao buscar o produto. Por favor, tente novamente.";
  }

  if (!products || products.length === 0) {
    return `Não encontrei nenhum produto com "${nome}" no nosso cardápio.`;
  }

  let result = `Encontrei ${products.length} produto(s):\n\n`;
  for (const product of products as Product[]) {
    const price = product.delivery_price || product.price;
    result += `🍽️ ${product.name}\n`;
    result += `💰 R$ ${price.toFixed(2)}\n`;
    if (product.description) {
      result += `📝 ${product.description}\n`;
    }
    if (product.category?.name) {
      result += `📋 Categoria: ${product.category.name}\n`;
    }
    result += "\n";
  }

  return result;
}

async function calcularTotal(
  supabase: any,
  unitId: string,
  itens: Array<{nome: string, quantidade: number}>
): Promise<string> {
  if (!itens || itens.length === 0) {
    return "Nenhum item informado para calcular.";
  }

  let total = 0;
  const detalhes: string[] = [];
  const itensNaoEncontrados: string[] = [];

  for (const item of itens) {
    const { data: products } = await supabase
      .from("products")
      .select("name, price, delivery_price")
      .eq("unit_id", unitId)
      .eq("available", true)
      .ilike("name", `%${item.nome}%`)
      .limit(1);

    if (products && products.length > 0) {
      const product = products[0] as { name: string; price: number; delivery_price: number | null };
      const preco = product.delivery_price || product.price;
      const subtotal = preco * item.quantidade;
      total += subtotal;
      detalhes.push(`${item.quantidade}x ${product.name} = R$ ${subtotal.toFixed(2)}`);
    } else {
      itensNaoEncontrados.push(item.nome);
    }
  }

  let resultado = "📋 RESUMO DO PEDIDO:\n\n";
  if (detalhes.length > 0) {
    resultado += detalhes.join("\n") + "\n\n";
    resultado += `💰 TOTAL: R$ ${total.toFixed(2)}`;
  }
  
  if (itensNaoEncontrados.length > 0) {
    resultado += `\n\n⚠️ Itens não encontrados: ${itensNaoEncontrados.join(", ")}`;
  }

  return resultado;
}

async function criarPedido(
  supabase: any,
  unitId: string,
  itens: Array<{nome: string, quantidade: number}>,
  endereco: string,
  formaPagamento: string,
  observacoes: string | undefined,
  customerPhone: string,
  customerName: string
): Promise<string> {
  if (!itens || itens.length === 0) {
    return "Não foi possível criar o pedido: nenhum item informado.";
  }

  if (!endereco) {
    return "Preciso do endereço de entrega para finalizar o pedido.";
  }

  // Map payment method
  const paymentMap: Record<string, string> = {
    "dinheiro": "cash",
    "cartao_credito": "credit",
    "cartao_debito": "debit",
    "pix": "pix"
  };
  const paymentMethod = paymentMap[formaPagamento] || "cash";

  // Find products and calculate total
  const orderItems: Array<{product_id: string, product_name: string, unit_price: number, quantity: number, total_price: number}> = [];
  let totalPrice = 0;

  for (const item of itens) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, delivery_price")
      .eq("unit_id", unitId)
      .eq("available", true)
      .ilike("name", `%${item.nome}%`)
      .limit(1);

    if (products && products.length > 0) {
      const product = products[0] as { id: string; name: string; price: number; delivery_price: number | null };
      const preco = product.delivery_price || product.price;
      const subtotal = preco * item.quantidade;
      totalPrice += subtotal;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: preco,
        quantity: item.quantidade,
        total_price: subtotal
      });
    }
  }

  if (orderItems.length === 0) {
    return "Não encontrei nenhum dos produtos informados no cardápio.";
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      unit_id: unitId,
      channel: "whatsapp",
      status: "pending",
      total_price: totalPrice,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: observacoes || null
    })
    .select("id, order_number")
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError);
    return "Erro ao registrar o pedido. Por favor, tente novamente ou entre em contato por telefone.";
  }

  // Create order items
  const itemsToInsert = orderItems.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    unit_price: item.unit_price,
    quantity: item.quantity,
    total_price: item.total_price
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsToInsert);

  if (itemsError) {
    console.error("Error creating order items:", itemsError);
  }

  // Create delivery order
  const { error: deliveryError } = await supabase
    .from("delivery_orders")
    .insert({
      order_id: order.id,
      address: endereco
    });

  if (deliveryError) {
    console.error("Error creating delivery order:", deliveryError);
  }

  // Create payment record
  const { error: paymentError } = await supabase
    .from("order_payments")
    .insert({
      order_id: order.id,
      method: paymentMethod,
      amount: totalPrice
    });

  if (paymentError) {
    console.error("Error creating payment:", paymentError);
  }

  let resultado = `✅ PEDIDO CONFIRMADO!\n\n`;
  resultado += `📦 Número do pedido: #${order.order_number}\n\n`;
  resultado += `📋 Itens:\n`;
  for (const item of orderItems) {
    resultado += `• ${item.quantity}x ${item.product_name} - R$ ${item.total_price.toFixed(2)}\n`;
  }
  resultado += `\n💰 Total: R$ ${totalPrice.toFixed(2)}\n`;
  resultado += `🏠 Entrega: ${endereco}\n`;
  resultado += `💳 Pagamento: ${formaPagamento.replace("_", " ")}\n`;
  if (observacoes) {
    resultado += `📝 Obs: ${observacoes}\n`;
  }
  resultado += `\n⏱️ Tempo estimado: 30-45 minutos\n`;
  resultado += `\nAgradecemos pela preferência! 🙏`;

  return resultado;
}

// Process AI response with tool calling loop
async function processWithAI(
  supabase: any,
  unitId: string,
  messages: Array<{role: string, content: string}>,
  customerPhone: string,
  customerName: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const MAX_ITERATIONS = 5;
  let iterations = 0;
  const currentMessages: any[] = [...messages];

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`AI iteration ${iterations}/${MAX_ITERATIONS}`);

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: currentMessages,
          tools,
          tool_choice: "auto",
          max_tokens: 1500,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("RATE_LIMIT");
      }
      if (aiResponse.status === 402) {
        throw new Error("PAYMENT_REQUIRED");
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];
    
    if (!choice) {
      throw new Error("No response from AI");
    }

    const message = choice.message;
    
    // Check if AI wants to call tools via standard tool_calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log(`AI requested ${message.tool_calls.length} tool(s)`);
      
      // Add assistant message with tool calls
      currentMessages.push({
        role: "assistant",
        content: message.content || "",
        tool_calls: message.tool_calls
      });

      // Execute each tool and add results
      for (const toolCall of message.tool_calls as ToolCall[]) {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        const result = await executeTool(
          supabase, 
          unitId, 
          toolCall.function.name, 
          args,
          customerPhone,
          customerName
        );

        currentMessages.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id
        });
      }
      
      // Continue loop to get final response
      continue;
    }

    // Check if AI returned action/action_input JSON in content (fallback)
    const parsedAction = parseActionFromContent(message.content || "");
    if (parsedAction) {
      console.log(`Detected action in content: ${parsedAction.action}`);
      
      // Execute the tool
      const result = await executeTool(
        supabase,
        unitId,
        parsedAction.action,
        parsedAction.input,
        customerPhone,
        customerName
      );

      // Add context and request a new response
      currentMessages.push({
        role: "assistant",
        content: `[Executando ${parsedAction.action}...]`
      });
      currentMessages.push({
        role: "user", 
        content: `Resultado da consulta:\n\n${result}\n\nAgora responda ao cliente de forma natural e amigável baseado nesse resultado. Não use JSON, apenas texto natural em português.`
      });
      
      // Continue to get natural response
      continue;
    }

    // No tool calls and no action in content - return the final message
    const finalResponse = sanitizeResponse(message.content || "");
    
    if (!finalResponse) {
      return "Desculpe, não consegui gerar uma resposta. Por favor, tente reformular sua pergunta.";
    }
    
    return finalResponse;
  }

  return "Desculpe, tive dificuldade em processar sua solicitação. Por favor, tente novamente de forma mais simples.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: EvolutionWebhookPayload = await req.json();
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    // Only process incoming messages (not from us)
    if (payload.event !== "messages.upsert" || payload.data.key.fromMe) {
      return new Response(JSON.stringify({ status: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instanceName = payload.instance;
    const phone = payload.data.key.remoteJid.replace("@s.whatsapp.net", "");
    const customerName = payload.data.pushName || "Cliente";
    const messageText =
      payload.data.message?.conversation ||
      payload.data.message?.extendedTextMessage?.text ||
      "";

    if (!messageText) {
      return new Response(JSON.stringify({ status: "no_text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find WhatsApp settings by instance name
    const { data: settings, error: settingsError } = await supabase
      .from("whatsapp_settings")
      .select("*")
      .eq("instance_name", instanceName)
      .single();

    if (settingsError || !settings) {
      console.error("Settings not found for instance:", instanceName);
      return new Response(JSON.stringify({ error: "Settings not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if bot is enabled globally
    if (!settings.bot_enabled) {
      console.log("Bot is disabled globally");
      return new Response(JSON.stringify({ status: "bot_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find or create conversation
    let { data: conversation, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("unit_id", settings.unit_id)
      .eq("phone", phone)
      .single();

    if (convError && convError.code === "PGRST116") {
      // Conversation doesn't exist, create it
      const { data: newConv, error: createError } = await supabase
        .from("whatsapp_conversations")
        .insert({
          unit_id: settings.unit_id,
          phone,
          customer_name: customerName,
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          is_bot_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError);
        throw createError;
      }
      conversation = newConv;

      // Send welcome message if configured
      if (settings.welcome_message) {
        await sendWhatsAppMessage(
          settings.api_url,
          settings.api_token,
          instanceName,
          phone,
          settings.welcome_message
        );
      }
    } else if (convError) {
      throw convError;
    } else {
      // Update existing conversation
      await supabase
        .from("whatsapp_conversations")
        .update({
          customer_name: customerName,
          last_message: messageText,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);
    }

    // Check if bot is active for this conversation
    if (!conversation?.is_bot_active) {
      console.log("Bot is disabled for this conversation");
      return new Response(JSON.stringify({ status: "bot_disabled_conversation" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store user message
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: messageText,
    });

    // Get recent conversation history for context
    const { data: recentMessages } = await supabase
      .from("whatsapp_messages")
      .select("role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(15);

    // Build messages array for AI with enhanced system prompt
    const systemPrompt = settings.system_prompt || getDefaultSystemPrompt();

    const messages = [
      { role: "system", content: systemPrompt },
      ...(recentMessages || []).reverse().map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    // Process with AI (including tool calling loop)
    let assistantMessage: string;
    
    try {
      assistantMessage = await processWithAI(
        supabase,
        settings.unit_id,
        messages,
        phone,
        customerName
      );
    } catch (error) {
      console.error("AI processing error:", error);
      
      if (error instanceof Error) {
        if (error.message === "RATE_LIMIT") {
          assistantMessage = "No momento estamos com muitas solicitações. Por favor, aguarde alguns segundos e tente novamente. 🙏";
        } else if (error.message === "PAYMENT_REQUIRED") {
          assistantMessage = "No momento estamos com um problema técnico temporário. Por favor, tente novamente em alguns minutos.";
        } else {
          assistantMessage = "Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente ou entre em contato por telefone.";
        }
      } else {
        assistantMessage = "Desculpe, ocorreu um erro. Por favor, tente novamente.";
      }
    }

    // Final sanitization before sending
    assistantMessage = sanitizeResponse(assistantMessage);

    // Store assistant message
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content: assistantMessage,
    });

    // Send response via Evolution API
    await sendWhatsAppMessage(
      settings.api_url,
      settings.api_token,
      instanceName,
      phone,
      assistantMessage
    );

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Response sent",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getDefaultSystemPrompt(): string {
  return `Você é um assistente virtual de atendimento ao cliente de um restaurante.

REGRAS IMPORTANTES:
1. NUNCA responda com JSON, código ou dados técnicos
2. SEMPRE responda em português brasileiro natural e amigável
3. Seja cordial, prestativo e objetivo
4. Use emojis com moderação para deixar a conversa mais amigável

SUAS CAPACIDADES:
- Mostrar o cardápio completo do restaurante
- Buscar produtos específicos e seus preços
- Calcular o valor total de um pedido
- Registrar pedidos no sistema

FLUXO DE PEDIDO:
1. Ajude o cliente a escolher os produtos
2. Confirme os itens e quantidades
3. Peça o endereço de entrega
4. Confirme a forma de pagamento (dinheiro, cartão crédito/débito ou pix)
5. Finalize o pedido

EXEMPLOS DE RESPOSTAS CORRETAS:
- "Claro! Vou mostrar nosso cardápio completo 📋"
- "O X-Bacon custa R$ 38,90 e vem com hambúrguer 180g, bacon crocante e queijo cheddar!"
- "Perfeito! Seu pedido ficou em R$ 52,80. Qual o endereço de entrega?"

Seja profissional e crie uma ótima experiência para o cliente!`;
}

async function sendWhatsAppMessage(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  phone: string,
  message: string
): Promise<void> {
  const response = await fetch(
    `${apiUrl}/message/sendText/${instanceName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiToken,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error sending WhatsApp message:", response.status, errorText);
    throw new Error(`Failed to send WhatsApp message: ${response.status}`);
  }

  console.log("WhatsApp message sent successfully to:", phone);
}
