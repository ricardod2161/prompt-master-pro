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
      audioMessage?: {
        url?: string;
        mimetype?: string;
        seconds?: number;
      };
      imageMessage?: {
        url?: string;
        mimetype?: string;
        caption?: string;
      };
    };
    messageTimestamp?: number;
    status?: number | string;
    // For presence events
    presence?: "composing" | "recording" | "paused";
    // Alternative formats from Evolution API
    remoteJid?: string;
    messageId?: string;
    keyId?: string;
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

// Tool definitions for function calling - FLUXO PROFISSIONAL COMPLETO
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
      description: "Calcula o valor total de um pedido com base nos itens e quantidades. Use quando precisar mostrar o resumo do pedido ao cliente.",
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
      name: "confirmar_pedido",
      description: "Cria e confirma um pedido completo no sistema. Use APENAS quando o cliente CONFIRMAR explicitamente que quer finalizar o pedido (dizendo 'sim', 'confirmo', 'pode confirmar', etc.) E você já tiver coletado TODOS os dados necessários: nome do cliente, itens do pedido, modalidade (entrega/retirada/local), endereço (se entrega), forma de pagamento e troco (se dinheiro).",
      parameters: {
        type: "object",
        properties: {
          cliente: {
            type: "object",
            description: "Dados do cliente",
            properties: {
              nome: { type: "string", description: "Nome do cliente" }
            },
            required: ["nome"]
          },
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
          modalidade: {
            type: "string",
            description: "Como o cliente receberá o pedido",
            enum: ["entrega", "retirada", "local"]
          },
          endereco: {
            type: "object",
            description: "Endereço de entrega (obrigatório se modalidade = entrega)",
            properties: {
              rua: { type: "string", description: "Nome da rua" },
              numero: { type: "string", description: "Número da casa/apartamento" },
              bairro: { type: "string", description: "Bairro" },
              referencia: { type: "string", description: "Ponto de referência (opcional)" }
            },
            required: ["rua", "numero", "bairro"]
          },
          pagamento: {
            type: "object",
            description: "Dados do pagamento",
            properties: {
              forma: {
                type: "string",
                description: "Forma de pagamento escolhida",
                enum: ["dinheiro", "pix", "credito", "debito", "voucher"]
              },
              troco_para: {
                type: "number",
                description: "Valor para troco (obrigatório se forma = dinheiro e cliente precisa de troco)"
              }
            },
            required: ["forma"]
          },
          observacoes: {
            type: "string",
            description: "Observações adicionais do pedido (opcional)"
          }
        },
        required: ["cliente", "itens", "modalidade", "pagamento"]
      }
    }
  }
];

// Parse action from content when AI returns JSON instead of using tool_calls
function parseActionFromContent(content: string): { action: string; input: Record<string, unknown> } | null {
  if (!content) return null;
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*?"action"[\s\S]*?"action_input"[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.action && parsed.action_input !== undefined) {
        let input = parsed.action_input;
        if (typeof input === "string") {
          try {
            input = JSON.parse(input);
          } catch {
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
  
  let sanitized = response.replace(/```json[\s\S]*?```/g, "");
  sanitized = sanitized.replace(/```[\s\S]*?```/g, "");
  sanitized = sanitized.replace(/\{[\s\S]*?"action"[\s\S]*?"action_input"[\s\S]*?\}/g, "");
  sanitized = sanitized.replace(/\{[\s\S]*?"function_call"[\s\S]*?\}/g, "");
  sanitized = sanitized.replace(/\{[\s\S]*?"tool_calls?"[\s\S]*?\}/g, "");
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
    case "confirmar_pedido":
      return await confirmarPedido(
        supabase,
        unitId,
        args as unknown as ConfirmarPedidoArgs,
        customerPhone
      );
    // Legacy support
    case "criar_pedido":
      return await criarPedidoLegacy(
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

async function listarCardapio(supabase: any, unitId: string): Promise<string> {
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

  const byCategory: Record<string, Product[]> = {};
  for (const product of products as Product[]) {
    const categoryName = product.category?.name || "Outros";
    if (!byCategory[categoryName]) {
      byCategory[categoryName] = [];
    }
    byCategory[categoryName].push(product);
  }

  let menu = "📋 *CARDÁPIO*\n\n";
  for (const [category, items] of Object.entries(byCategory)) {
    menu += `*${category.toUpperCase()}*\n`;
    for (const item of items) {
      const price = item.delivery_price || item.price;
      menu += `• ${item.name} - R$ ${price.toFixed(2).replace(".", ",")}`;
      if (item.description) {
        menu += `\n  _${item.description}_`;
      }
      menu += "\n";
    }
    menu += "\n";
  }

  return menu;
}

async function buscarProduto(supabase: any, unitId: string, nome: string): Promise<string> {
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
    result += `🍽️ *${product.name}*\n`;
    result += `💰 R$ ${price.toFixed(2).replace(".", ",")}\n`;
    if (product.description) {
      result += `📝 ${product.description}\n`;
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
      detalhes.push(`• ${item.quantidade}x ${product.name} - R$ ${subtotal.toFixed(2).replace(".", ",")}`);
    } else {
      itensNaoEncontrados.push(item.nome);
    }
  }

  let resultado = "📋 *RESUMO DO PEDIDO*\n\n";
  if (detalhes.length > 0) {
    resultado += detalhes.join("\n") + "\n\n";
    resultado += `💰 *TOTAL: R$ ${total.toFixed(2).replace(".", ",")}*`;
  }
  
  if (itensNaoEncontrados.length > 0) {
    resultado += `\n\n⚠️ Itens não encontrados: ${itensNaoEncontrados.join(", ")}`;
  }

  return resultado;
}

interface ConfirmarPedidoArgs {
  cliente: { nome: string };
  itens: Array<{ nome: string; quantidade: number }>;
  modalidade: "entrega" | "retirada" | "local";
  endereco?: {
    rua: string;
    numero: string;
    bairro: string;
    referencia?: string;
  };
  pagamento: {
    forma: "dinheiro" | "pix" | "credito" | "debito" | "voucher";
    troco_para?: number;
  };
  observacoes?: string;
}

async function confirmarPedido(
  supabase: any,
  unitId: string,
  args: ConfirmarPedidoArgs,
  customerPhone: string
): Promise<string> {
  const { cliente, itens, modalidade, endereco, pagamento, observacoes } = args;

  // Validations
  if (!itens || itens.length === 0) {
    return "❌ Não foi possível criar o pedido: nenhum item informado.";
  }

  if (!cliente?.nome) {
    return "❌ Preciso do nome do cliente para finalizar o pedido.";
  }

  if (modalidade === "entrega" && (!endereco?.rua || !endereco?.numero || !endereco?.bairro)) {
    return "❌ Para entrega, preciso do endereço completo (rua, número e bairro).";
  }

  // Map payment method to DB enum
  const paymentMap: Record<string, string> = {
    "dinheiro": "cash",
    "pix": "pix",
    "credito": "credit",
    "debito": "debit",
    "voucher": "voucher"
  };
  const paymentMethod = paymentMap[pagamento.forma] || "cash";

  // Map modalidade to channel
  const channelMap: Record<string, string> = {
    "entrega": "delivery",
    "retirada": "counter",
    "local": "table"
  };
  const channel = channelMap[modalidade] || "whatsapp";

  // Find products and calculate total
  const orderItems: Array<{
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }> = [];
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
      const preco = modalidade === "entrega" ? (product.delivery_price || product.price) : product.price;
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
    return "❌ Não encontrei nenhum dos produtos informados no cardápio.";
  }

  // Build notes with additional info
  const notesArray: string[] = [];
  if (observacoes) notesArray.push(observacoes);
  if (pagamento.forma === "dinheiro" && pagamento.troco_para) {
    notesArray.push(`💵 Troco para: R$ ${pagamento.troco_para.toFixed(2).replace(".", ",")}`);
  }
  if (modalidade === "retirada") {
    notesArray.push("🏃 Cliente vai retirar no local");
  }
  if (modalidade === "local") {
    notesArray.push("🍽️ Cliente vai consumir no local");
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      unit_id: unitId,
      channel: channel,
      status: "pending",
      total_price: totalPrice,
      customer_name: cliente.nome,
      customer_phone: customerPhone,
      notes: notesArray.length > 0 ? notesArray.join(" | ") : null
    })
    .select("id, order_number")
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError);
    return "❌ Erro ao registrar o pedido. Por favor, tente novamente ou entre em contato por telefone.";
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

  await supabase.from("order_items").insert(itemsToInsert);

  // Create delivery order if modalidade is entrega
  if (modalidade === "entrega" && endereco) {
    const fullAddress = `${endereco.rua}, ${endereco.numero} - ${endereco.bairro}${endereco.referencia ? ` (${endereco.referencia})` : ""}`;
    
    await supabase.from("delivery_orders").insert({
      order_id: order.id,
      address: fullAddress
    });
  }

  // Create payment record
  await supabase.from("order_payments").insert({
    order_id: order.id,
    method: paymentMethod,
    amount: totalPrice
  });

  // Build confirmation message
  const formasPagamentoLabel: Record<string, string> = {
    "dinheiro": "💵 Dinheiro",
    "pix": "📱 Pix",
    "credito": "💳 Cartão de Crédito",
    "debito": "💳 Cartão de Débito",
    "voucher": "🎫 Vale Refeição"
  };

  const modalidadeLabel: Record<string, string> = {
    "entrega": "🛵 Entrega",
    "retirada": "🏃 Retirada no local",
    "local": "🍽️ Consumir no local"
  };

  let resultado = `✅ *PEDIDO CONFIRMADO!*\n\n`;
  resultado += `📦 *Número:* #${order.order_number}\n`;
  resultado += `👤 *Cliente:* ${cliente.nome}\n\n`;
  resultado += `📋 *Itens:*\n`;
  
  for (const item of orderItems) {
    resultado += `• ${item.quantity}x ${item.product_name} - R$ ${item.total_price.toFixed(2).replace(".", ",")}\n`;
  }
  
  resultado += `\n💰 *Total:* R$ ${totalPrice.toFixed(2).replace(".", ",")}\n\n`;
  resultado += `📍 *Modalidade:* ${modalidadeLabel[modalidade]}\n`;
  
  if (modalidade === "entrega" && endereco) {
    resultado += `🏠 *Endereço:* ${endereco.rua}, ${endereco.numero} - ${endereco.bairro}\n`;
    if (endereco.referencia) {
      resultado += `📍 *Referência:* ${endereco.referencia}\n`;
    }
  }
  
  resultado += `💳 *Pagamento:* ${formasPagamentoLabel[pagamento.forma]}\n`;
  
  if (pagamento.forma === "dinheiro" && pagamento.troco_para) {
    const troco = pagamento.troco_para - totalPrice;
    resultado += `💵 *Troco para:* R$ ${pagamento.troco_para.toFixed(2).replace(".", ",")}\n`;
    resultado += `💰 *Troco:* R$ ${troco.toFixed(2).replace(".", ",")}\n`;
  }
  
  if (observacoes) {
    resultado += `\n📝 *Obs:* ${observacoes}\n`;
  }
  
  resultado += `\n⏱️ *Tempo estimado:* ${modalidade === "entrega" ? "30-45 minutos" : "15-25 minutos"}\n`;
  resultado += `\n🙏 *Agradecemos a preferência!*`;

  return resultado;
}

// Legacy criar_pedido for backward compatibility
async function criarPedidoLegacy(
  supabase: any,
  unitId: string,
  itens: Array<{nome: string, quantidade: number}>,
  endereco: string,
  formaPagamento: string,
  observacoes: string | undefined,
  customerPhone: string,
  customerName: string
): Promise<string> {
  // Convert to new format and call confirmarPedido
  const args: ConfirmarPedidoArgs = {
    cliente: { nome: customerName },
    itens,
    modalidade: endereco ? "entrega" : "retirada",
    endereco: endereco ? {
      rua: endereco,
      numero: "",
      bairro: ""
    } : undefined,
    pagamento: {
      forma: formaPagamento as "dinheiro" | "pix" | "credito" | "debito" | "voucher"
    },
    observacoes
  };
  
  return confirmarPedido(supabase, unitId, args, customerPhone);
}

// Download media from Evolution API
async function downloadMedia(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  messageId: string
): Promise<{ base64: string; mimetype: string } | null> {
  try {
    const response = await fetch(
      `${apiUrl}/chat/getBase64FromMediaMessage/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiToken,
        },
        body: JSON.stringify({
          message: { key: { id: messageId } },
          convertToMp4: false,
        }),
      }
    );

    if (!response.ok) {
      console.error("Error downloading media:", response.status);
      return null;
    }

    const data = await response.json();
    return {
      base64: data.base64,
      mimetype: data.mimetype,
    };
  } catch (error) {
    console.error("Error downloading media:", error);
    return null;
  }
}

// Transcribe audio using GPT-5 multimodal with Gemini fallback
async function transcribeAudio(audioBase64: string, mimetype: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured for transcription");
    return "";
  }

  // Determine audio format
  const getAudioFormat = (mime: string): string => {
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("opus")) return "ogg";
    if (mime.includes("mp4")) return "mp4";
    if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
    if (mime.includes("wav")) return "wav";
    if (mime.includes("webm")) return "webm";
    return "ogg"; // WhatsApp default
  };

  const audioFormat = getAudioFormat(mimetype);
  console.log(`Transcribing audio (format: ${audioFormat}, size: ${audioBase64.length} chars)`);

  try {
    // Try with GPT-5 first (better audio understanding)
    console.log("Attempting transcription with GPT-5...");
    
    const gptResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5",
          messages: [
            {
              role: "system",
              content: "Você é um transcritor profissional de áudio em português brasileiro. Transcreva o áudio com precisão. Retorne APENAS o texto transcrito, sem explicações, prefixos ou formatação adicional."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Transcreva este áudio:"
                },
                {
                  type: "input_audio",
                  input_audio: {
                    data: audioBase64,
                    format: audioFormat
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      }
    );

    if (gptResponse.ok) {
      const gptData = await gptResponse.json();
      const transcription = gptData.choices?.[0]?.message?.content?.trim() || "";
      if (transcription && transcription.length > 0) {
        console.log(`GPT-5 transcription successful: "${transcription.substring(0, 50)}..."`);
        return transcription;
      }
    } else {
      const errorText = await gptResponse.text();
      console.log("GPT-5 transcription failed:", gptResponse.status, errorText.substring(0, 200));
    }

    // Fallback to Gemini
    console.log("Falling back to Gemini for transcription...");
    
    const geminiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Transcreva este áudio em português brasileiro. Retorne APENAS o texto transcrito."
                },
                {
                  type: "input_audio",
                  input_audio: {
                    data: audioBase64,
                    format: audioFormat
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      }
    );

    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      const transcription = geminiData.choices?.[0]?.message?.content?.trim() || "";
      if (transcription && transcription.length > 0) {
        console.log(`Gemini transcription successful: "${transcription.substring(0, 50)}..."`);
        return transcription;
      }
    } else {
      const errorText = await geminiResponse.text();
      console.log("Gemini transcription failed:", geminiResponse.status, errorText.substring(0, 200));
    }

    console.log("All transcription methods failed");
    return "";
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    return "";
  }
}

// Analyze image using Gemini
async function analyzeImage(imageBase64: string, mimetype: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  try {
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Descreva brevemente esta imagem em 1-2 frases em português. Se for um comprovante de pagamento (Pix, transferência), identifique. Se for um endereço/localização, identifique. Se for outra coisa, descreva o conteúdo principal.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimetype};base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 200,
        }),
      }
    );

    if (!response.ok) {
      console.error("Image analysis error:", response.status);
      return "";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "";
  }
}

// Send typing/presence indicator
async function sendPresence(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  phone: string,
  presence: "composing" | "recording" | "paused"
): Promise<void> {
  try {
    await fetch(`${apiUrl}/chat/presence/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiToken,
      },
      body: JSON.stringify({
        number: phone,
        presence,
      }),
    });
  } catch (error) {
    console.error("Error sending presence:", error);
  }
}

// Update or insert typing status
async function updateTypingStatus(
  supabase: any,
  conversationId: string,
  isTyping: boolean,
  isRecording: boolean
): Promise<void> {
  try {
    await supabase
      .from("whatsapp_typing_status")
      .upsert({
        conversation_id: conversationId,
        is_typing: isTyping,
        is_recording: isRecording,
      }, {
        onConflict: "conversation_id",
      });
  } catch (error) {
    console.error("Error updating typing status:", error);
  }
}

// Update message status
async function updateMessageStatus(
  supabase: any,
  messageId: string,
  status: "delivered" | "read"
): Promise<void> {
  try {
    await supabase
      .from("whatsapp_messages")
      .update({ status })
      .eq("message_id", messageId);
  } catch (error) {
    console.error("Error updating message status:", error);
  }
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

  const MAX_ITERATIONS = 6;
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
          max_tokens: 2000,
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
      
      currentMessages.push({
        role: "assistant",
        content: message.content || "",
        tool_calls: message.tool_calls
      });

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
      
      continue;
    }

    // Check if AI returned action/action_input JSON in content (fallback)
    const parsedAction = parseActionFromContent(message.content || "");
    if (parsedAction) {
      console.log(`Detected action in content: ${parsedAction.action}`);
      
      const result = await executeTool(
        supabase,
        unitId,
        parsedAction.action,
        parsedAction.input,
        customerPhone,
        customerName
      );

      currentMessages.push({
        role: "assistant",
        content: `[Processando...]`
      });
      currentMessages.push({
        role: "user", 
        content: `Resultado:\n\n${result}\n\nAgora responda ao cliente de forma natural, amigável e profissional. Continue o fluxo do pedido conforme as instruções.`
      });
      
      continue;
    }

    // No tool calls - return the final message
    const finalResponse = sanitizeResponse(message.content || "");
    
    if (!finalResponse) {
      return "Desculpe, não consegui gerar uma resposta. Como posso ajudar?";
    }
    
    return finalResponse;
  }

  return "Desculpe, tive dificuldade em processar sua solicitação. Por favor, tente novamente.";
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

    // Handle message status updates (delivered/read)
    if (payload.event === "messages.update") {
      // Support multiple Evolution API payload formats
      const messageId = (payload.data as any).messageId || 
                        (payload.data as any).keyId || 
                        payload.data.key?.id;
      const statusRaw = payload.data.status;
      
      console.log(`Message status update - ID: ${messageId}, Status: ${statusRaw}`);
      
      if (!messageId) {
        console.log("No message ID found in status update payload");
        return new Response(JSON.stringify({ status: "no_message_id" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Map status (supports both string and numeric formats)
      let status: "delivered" | "read" | null = null;
      if (statusRaw === "DELIVERY_ACK" || statusRaw === 2 || statusRaw === "delivered") {
        status = "delivered";
      } else if (statusRaw === "READ" || statusRaw === 3 || statusRaw === "read") {
        status = "read";
      }
      
      if (status) {
        await updateMessageStatus(supabase, messageId, status);
        console.log(`Message ${messageId} status updated to: ${status}`);
      } else {
        console.log(`Unknown status value: ${statusRaw}`);
      }
      
      return new Response(JSON.stringify({ status: "status_updated", newStatus: status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle presence updates (typing/recording)
    if (payload.event === "presence.update") {
      // Support multiple Evolution API payload formats
      const remoteJid = (payload.data as any).remoteJid || 
                        (payload.data as any).key?.remoteJid ||
                        (payload.data as any).participant;
      
      if (!remoteJid) {
        console.log("No remoteJid found in presence update");
        return new Response(JSON.stringify({ status: "no_remote_jid" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
      const presence = payload.data.presence || (payload.data as any).action;
      const instanceName = payload.instance;
      
      console.log(`Presence update - Phone: ${phone}, Presence: ${presence}`);
      
      // Find the conversation
      const { data: settings } = await supabase
        .from("whatsapp_settings")
        .select("unit_id")
        .eq("instance_name", instanceName)
        .single();
      
      if (settings) {
        const { data: conversation } = await supabase
          .from("whatsapp_conversations")
          .select("id")
          .eq("unit_id", settings.unit_id)
          .eq("phone", phone)
          .single();
        
        if (conversation) {
          const isTyping = presence === "composing" || presence === "typing";
          const isRecording = presence === "recording";
          
          await updateTypingStatus(supabase, conversation.id, isTyping, isRecording);
          console.log(`Typing status updated for ${phone}: typing=${isTyping}, recording=${isRecording}`);
        }
      }
      
      return new Response(JSON.stringify({ status: "presence_updated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only process incoming messages (not from us)
    if (payload.event !== "messages.upsert" || payload.data.key.fromMe) {
      return new Response(JSON.stringify({ status: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instanceName = payload.instance;
    const phone = payload.data.key.remoteJid.replace("@s.whatsapp.net", "");
    const messageKey = payload.data.key.id;
    const customerName = payload.data.pushName || "Cliente";
    
    // Determine message type and extract content
    let messageText = "";
    let mediaType: "text" | "audio" | "image" | "document" = "text";
    let mediaUrl: string | null = null;
    let mediaDuration: number | null = null;
    let mediaCaption: string | null = null;
    let transcription: string | null = null;
    let imageAnalysis: string | null = null;

    // Check for different message types
    if (payload.data.message?.audioMessage) {
      mediaType = "audio";
      mediaDuration = payload.data.message.audioMessage.seconds || 0;
    } else if (payload.data.message?.imageMessage) {
      mediaType = "image";
      mediaCaption = payload.data.message.imageMessage.caption || null;
    } else {
      messageText =
        payload.data.message?.conversation ||
        payload.data.message?.extendedTextMessage?.text ||
        "";
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

    if (!settings.bot_enabled) {
      console.log("Bot is disabled globally");
      return new Response(JSON.stringify({ status: "bot_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle audio message - download and transcribe
    if (mediaType === "audio") {
      console.log("Processing audio message...");
      const media = await downloadMedia(settings.api_url, settings.api_token, instanceName, messageKey);
      if (media) {
        mediaUrl = `data:${media.mimetype};base64,${media.base64.substring(0, 100)}...`; // Store reference
        transcription = await transcribeAudio(media.base64, media.mimetype);
        if (transcription) {
          messageText = `[Áudio transcrito]: ${transcription}`;
        } else {
          messageText = "[O cliente enviou um áudio que não pôde ser transcrito]";
        }
      } else {
        messageText = "[O cliente enviou um áudio]";
      }
    }

    // Handle image message - download and analyze
    if (mediaType === "image") {
      console.log("Processing image message...");
      const media = await downloadMedia(settings.api_url, settings.api_token, instanceName, messageKey);
      if (media) {
        mediaUrl = `data:${media.mimetype};base64,${media.base64.substring(0, 100)}...`;
        imageAnalysis = await analyzeImage(media.base64, media.mimetype);
        if (imageAnalysis) {
          messageText = `[Imagem recebida - análise: ${imageAnalysis}]${mediaCaption ? ` Legenda: "${mediaCaption}"` : ""}`;
        } else {
          messageText = `[O cliente enviou uma imagem]${mediaCaption ? ` com legenda: "${mediaCaption}"` : ""}`;
        }
      } else {
        messageText = `[O cliente enviou uma imagem]${mediaCaption ? ` com legenda: "${mediaCaption}"` : ""}`;
      }
    }

    if (!messageText) {
      return new Response(JSON.stringify({ status: "no_text" }), {
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
      await supabase
        .from("whatsapp_conversations")
        .update({
          customer_name: customerName,
          last_message: messageText,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);
    }

    if (!conversation?.is_bot_active) {
      console.log("Bot is disabled for this conversation");
      return new Response(JSON.stringify({ status: "bot_disabled_conversation" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store user message with media info
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: messageText,
      message_id: messageKey,
      media_type: mediaType,
      media_url: mediaUrl,
      media_duration: mediaDuration,
      media_caption: mediaCaption,
      transcription: transcription,
    });

    // Send typing indicator to client
    await sendPresence(settings.api_url, settings.api_token, instanceName, phone, "composing");
    
    // Update typing status in database
    await updateTypingStatus(supabase, conversation.id, true, false);

    // Get recent conversation history for context
    const { data: recentMessages } = await supabase
      .from("whatsapp_messages")
      .select("role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Build messages array for AI with professional system prompt
    const systemPrompt = settings.system_prompt || getDefaultSystemPrompt();

    const messages = [
      { role: "system", content: systemPrompt },
      ...(recentMessages || []).reverse().map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    // Process with AI
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

    // Clear typing status
    await updateTypingStatus(supabase, conversation.id, false, false);

    // Final sanitization
    assistantMessage = sanitizeResponse(assistantMessage);

    // Send response via Evolution API and get message ID
    const sentMessageId = await sendWhatsAppMessage(
      settings.api_url,
      settings.api_token,
      instanceName,
      phone,
      assistantMessage
    );

    // Store assistant message with message ID for status tracking
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content: assistantMessage,
      message_id: sentMessageId,
      status: "sent",
    });

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
  return `Você é o ATENDENTE VIRTUAL de um restaurante. Seu objetivo é conduzir o cliente desde a saudação até a confirmação final do pedido de forma profissional, cordial e eficiente.

🎯 PERSONALIDADE:
- Profissional, cordial e prestativo
- Use emojis com moderação (1-2 por mensagem)
- Respostas curtas e objetivas (máx 3 parágrafos)
- Sempre confirme cada etapa antes de avançar
- Trate o cliente pelo nome quando souber

⚠️ REGRAS CRÍTICAS - NUNCA QUEBRE:
1. NUNCA responda com JSON, código ou dados técnicos
2. NUNCA pule etapas do fluxo - siga a ordem
3. NUNCA finalize pedido sem TODOS os dados E confirmação explícita do cliente
4. SEMPRE confirme os itens antes de pedir endereço/modalidade
5. SEMPRE pergunte sobre troco se pagamento for dinheiro
6. Se o cliente não responder algo, pergunte novamente educadamente

🎤 MENSAGENS DE ÁUDIO - IMPORTANTE:
- Se receber "[Áudio transcrito]: texto", trate o texto como uma mensagem normal do cliente
- Se receber "[O cliente enviou um áudio que não pôde ser transcrito]":
  → Responda: "Recebi seu áudio! 🎤 Infelizmente não consegui entender completamente. Poderia repetir por texto, por favor?"
- NUNCA diga que "não consegue processar áudio" ou "não tenho capacidade de ouvir"
- SEMPRE seja gentil e peça para repetir quando não entender

🖼️ MENSAGENS COM IMAGEM:
- Quando receber uma imagem, você verá a análise entre colchetes
- Se for comprovante de pagamento Pix: confirme o recebimento e agradeça
- Se for foto de endereço/mapa: confirme a localização
- Se for outra coisa: descreva brevemente o que entendeu e continue o atendimento

📋 FLUXO OBRIGATÓRIO DO PEDIDO:

ETAPA 1 - SAUDAÇÃO:
Se for uma nova conversa, cumprimente e pergunte o nome do cliente.
Exemplo: "Olá! Bem-vindo! 👋 Com quem eu falo?"

ETAPA 2 - CARDÁPIO:
Após saber o nome, ofereça ajuda e o cardápio.
Exemplo: "Prazer, [Nome]! Posso mostrar nosso cardápio ou você já sabe o que deseja?"

ETAPA 3 - ESCOLHA DOS ITENS:
Ajude o cliente a escolher, responda dúvidas sobre produtos.
Use a ferramenta listar_cardapio ou buscar_produto quando necessário.

ETAPA 4 - CONFIRMAÇÃO DOS ITENS:
Liste todos os itens escolhidos com preços e total.
Exemplo: "Seu pedido até agora:
• 2x X-Bacon - R$ 77,80
• 1x Suco de Laranja - R$ 12,00
*Total: R$ 89,80*
Deseja adicionar mais alguma coisa?"

ETAPA 5 - MODALIDADE:
Pergunte como o cliente deseja receber:
"Como prefere receber o pedido?
🛵 *Entrega* no seu endereço
🏃 *Retirada* no nosso local
🍽️ *Comer aqui* no restaurante"

ETAPA 6 - ENDEREÇO (apenas se escolher ENTREGA):
Colete o endereço completo:
"Para a entrega, preciso do endereço:
• Qual a *rua*?
• Qual o *número*?
• Qual o *bairro*?
• Tem algum *ponto de referência*?"

ETAPA 7 - FORMA DE PAGAMENTO:
Pergunte como vai pagar:
"Agora, qual a forma de pagamento?
💵 Dinheiro
💳 Cartão de Crédito
💳 Cartão de Débito
📱 Pix
🎫 Vale Refeição"

ETAPA 8 - TROCO (apenas se DINHEIRO):
"O total é R$ [TOTAL]. Vai precisar de troco? Se sim, para quanto?"

ETAPA 9 - RESUMO E CONFIRMAÇÃO:
Mostre o resumo COMPLETO e peça confirmação EXPLÍCITA:
"📋 *RESUMO DO SEU PEDIDO*

👤 *Cliente:* [Nome]
📍 *Modalidade:* [Entrega/Retirada/Local]
🏠 *Endereço:* [Se entrega]

📦 *Itens:*
• [Lista de itens]

💰 *Total:* R$ [Total]
💳 *Pagamento:* [Forma]
💵 *Troco para:* R$ [Se dinheiro]

✅ *Confirma o pedido?*"

ETAPA 10 - FINALIZAÇÃO:
SOMENTE quando o cliente confirmar (sim, confirmo, pode fazer, etc), use a ferramenta confirmar_pedido com TODOS os dados coletados.

🚫 NUNCA FAÇA:
- Criar pedido sem confirmação explícita
- Pular etapas do fluxo
- Responder com JSON ou código
- Inventar preços ou produtos
- Dizer que não pode processar áudio

✅ EXEMPLOS DE RESPOSTAS CORRETAS:
- "Claro! Vou mostrar nosso cardápio 📋"
- "O X-Bacon custa R$ 38,90 e vem com hambúrguer, bacon e queijo!"
- "Perfeito! Qual o seu endereço para entrega?"
- "Vai precisar de troco? O total ficou R$ 89,80"
- "Recebi seu áudio! 🎤 Poderia repetir por texto?"

Seja profissional e proporcione uma ótima experiência ao cliente! 🙌`;
}

async function sendWhatsAppMessage(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  phone: string,
  message: string
): Promise<string> {
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

  const data = await response.json();
  console.log("WhatsApp message sent successfully to:", phone);
  
  // Return the message ID for status tracking
  return data.key?.id || "";
}
