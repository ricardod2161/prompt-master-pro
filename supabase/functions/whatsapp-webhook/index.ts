import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

// Get emoji for category
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'bebidas': '🍹',
    'drinks': '🍹',
    'sucos': '🧃',
    'pratos': '🍽️',
    'pratos feitos': '🍽️',
    'lanches': '🍔',
    'hambúrguer': '🍔',
    'hamburgueres': '🍔',
    'pizzas': '🍕',
    'pizza': '🍕',
    'sobremesas': '🍰',
    'doces': '🍰',
    'açaí': '🍇',
    'acai': '🍇',
    'porções': '🍟',
    'porcoes': '🍟',
    'combos': '🎁',
    'promoções': '🎉',
    'promocoes': '🎉',
    'entradas': '🥗',
    'saladas': '🥗',
    'massas': '🍝',
    'carnes': '🥩',
    'frutos do mar': '🦐',
    'peixes': '🐟',
    'aves': '🍗',
    'sopas': '🍜',
    'cafés': '☕',
    'cafe': '☕',
    'petit gateau': '🍫',
    'sorvetes': '🍦',
    'milkshake': '🥤',
    'cervejas': '🍺',
    'vinhos': '🍷',
    'destilados': '🥃',
    'outros': '📋',
  };
  
  const key = category.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  for (const [mapKey, emoji] of Object.entries(emojiMap)) {
    const normalizedMapKey = mapKey
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (key.includes(normalizedMapKey) || normalizedMapKey.includes(key)) {
      return emoji;
    }
  }
  
  return '📋';
}

// Detect if user wants human escalation
function detectHumanEscalation(message: string): boolean {
  const escalationKeywords = [
    // Pedido direto de humano
    'falar com humano',
    'atendente humano',
    'pessoa real',
    'atendente real',
    'falar com alguem',
    'falar com pessoa',
    'atendimento humano',
    'atendente por favor',
    'quero um atendente',
    'chama o atendente',
    'passa pro atendente',
    'transfere pro atendente',
    'atendente',
    'humano',
    // Pedido de dono/proprietário/chefe
    'dono',
    'proprietario',
    'chefe',
    'falar com dono',
    'quero o dono',
    'chama o dono',
    'cade o dono',
    'onde esta o dono',
    'dono do restaurante',
    'dono da loja',
    'falar com o chefe',
    'quero falar com chefe',
    'quero falar com o dono',
    'passa pro dono',
    'transfere pro dono',
    // Reclamações e insatisfação
    'reclamacao',
    'fazer reclamacao',
    'quero reclamar',
    'gerente',
    'supervisor',
    'responsavel',
    'nao estou satisfeito',
    'insatisfeito',
    'absurdo',
    'descaso',
    'pessimo',
    'horrivel',
    'voces sao ruins',
    'pior atendimento',
    'nao resolve',
    'nao esta ajudando',
    'nao entende',
    'esse robo',
    'esse bot',
    'maquina',
    'cansei',
    'desisto',
    'vou reclamar',
    'ouvidoria',
    'procon',
  ];
  
  const lowerMessage = message.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  return escalationKeywords.some(keyword => {
    const normalizedKeyword = keyword
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return lowerMessage.includes(normalizedKeyword);
  });
}

// Escalate conversation to human
async function escalateToHuman(
  supabase: any,
  conversationId: string,
  unitId: string,
  customerPhone: string,
  customerName: string,
  reason: string
): Promise<string> {
  // Disable bot for this conversation
  await supabase
    .from('whatsapp_conversations')
    .update({ is_bot_active: false })
    .eq('id', conversationId);
  
  // Create notification for team
  await supabase.from('notifications').insert({
    unit_id: unitId,
    title: '🆘 Atendimento Humano Solicitado',
    message: `Cliente ${customerName} (${customerPhone}) solicitou atendimento humano. Motivo: ${reason.substring(0, 100)}`,
    type: 'warning',
    category: 'whatsapp',
    read: false,
  });
  
  console.log(`[ESCALATION] Conversation ${conversationId} escalated to human. Reason: ${reason.substring(0, 50)}`);
  
  return `Entendi sua solicitação! 🙏

Vou transferir você para um *atendente humano* agora mesmo.

Por favor, aguarde um momento que logo alguém da nossa equipe vai te atender.

⏱️ Tempo médio de espera: 2-5 minutos`;
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

// WhatsApp context for sending messages directly from tools
interface WhatsAppContext {
  apiUrl: string;
  apiToken: string;
  instanceName: string;
  phone: string;
  conversationId: string;
}

// Tool execution result - can queue multiple messages
interface ToolResult {
  text: string; // Text for AI context
  multipleMessages?: string[]; // If present, these should be sent as separate messages
}

// Tool execution functions
async function executeTool(
  supabase: any,
  unitId: string,
  toolName: string,
  args: Record<string, unknown>,
  customerPhone: string,
  customerName: string,
  whatsappContext?: WhatsAppContext
): Promise<ToolResult> {
  console.log(`Executing tool: ${toolName} with args:`, JSON.stringify(args));

  switch (toolName) {
    case "listar_cardapio": {
      const menuResult = await listarCardapio(supabase, unitId);
      // Return multiple messages for separate sending, plus a strict instruction for AI
      return {
        text: `[CARDÁPIO JÁ ENVIADO AO CLIENTE. NÃO repita os itens do cardápio na sua resposta. O cardápio completo já foi enviado em mensagens separadas. Apenas pergunte o que o cliente gostaria de pedir, sem listar produtos novamente.]`,
        multipleMessages: menuResult.messages
      };
    }
    case "buscar_produto":
      return { text: await buscarProduto(supabase, unitId, args.nome as string) };
    case "calcular_total":
      return { text: await calcularTotal(supabase, unitId, args.itens as Array<{nome: string, quantidade: number}>) };
    case "confirmar_pedido":
      return {
        text: await confirmarPedido(
          supabase,
          unitId,
          args as unknown as ConfirmarPedidoArgs,
          customerPhone
        )
      };
    // Legacy support
    case "criar_pedido":
      return {
        text: await criarPedidoLegacy(
          supabase, 
          unitId, 
          args.itens as Array<{nome: string, quantidade: number}>,
          args.endereco as string,
          args.forma_pagamento as string,
          args.observacoes as string | undefined,
          customerPhone,
          customerName
        )
      };
    default:
      return { text: `Ferramenta "${toolName}" não encontrada.` };
  }
}

// Returns multiple messages for elegant menu display - FORMATAÇÃO EXATA DA IMAGEM
async function listarCardapio(supabase: any, unitId: string): Promise<{ type: 'multiple'; messages: string[] }> {
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
    return { type: 'multiple', messages: ["Erro ao buscar o cardápio. Por favor, tente novamente."] };
  }

  if (!products || products.length === 0) {
    return { type: 'multiple', messages: ["No momento não temos produtos disponíveis no cardápio."] };
  }

  // Linha horizontal padrão (40 caracteres) - EXATA DA IMAGEM
  const LINE = "────────────────────────────────────────";

  // Group by category
  const byCategory: Record<string, Product[]> = {};
  for (const product of products as Product[]) {
    const categoryName = product.category?.name || "Outros";
    if (!byCategory[categoryName]) {
      byCategory[categoryName] = [];
    }
    byCategory[categoryName].push(product);
  }

  const categoryEntries = Object.entries(byCategory);
  const messages: string[] = [];
  
  // PRIMEIRA MENSAGEM: Welcome + Primeira Categoria juntos (como na imagem)
  if (categoryEntries.length > 0) {
    const [firstCategory, firstItems] = categoryEntries[0];
    const firstEmoji = getCategoryEmoji(firstCategory);
    
    let firstMsg = `✨ *BEM-VINDO AO NOSSO CARDÁPIO* ✨\n${LINE}\n\n`;
    firstMsg += `${firstEmoji} *${firstCategory.toUpperCase()}*\n${LINE}\n\n`;
    
    for (const item of firstItems) {
      firstMsg += `🔶 ${item.name} - R$ ${item.price.toFixed(2).replace(".", ",")}\n`;
    }
    
    messages.push(firstMsg.trim());
  }
  
  // MENSAGENS SUBSEQUENTES: Cada categoria adicional (começa com LINE no topo)
  for (let i = 1; i < categoryEntries.length; i++) {
    const [category, items] = categoryEntries[i];
    const emoji = getCategoryEmoji(category);
    
    // Começa com linha no topo, depois emoji + categoria + linha
    let categoryMsg = `${LINE}\n${emoji} *${category.toUpperCase()}*\n${LINE}\n\n`;
    
    for (const item of items) {
      categoryMsg += `🔶 ${item.name} - R$ ${item.price.toFixed(2).replace(".", ",")}\n`;
    }
    
    messages.push(categoryMsg.trim());
  }
  
  // MENSAGEM FINAL: Pergunta com linha no topo
  messages.push(`${LINE}\n💬 O que você gostaria de pedir?`);
  
  return { type: 'multiple', messages };
}

// Normalize product name for flexible matching
function normalizeProductName(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\b(de|do|da|dos|das|com|e|o|a|os|as|um|uma|uns|umas)\b/g, '') // remove prepositions/articles
    .replace(/s\b/g, '') // remove trailing 's' (plural) from words
    .replace(/\s+/g, ' ')
    .trim();
}

// Find best matching product using flexible search
function findBestProductMatch(
  products: Array<{ id?: string; name: string; price: number; delivery_price: number | null; description?: string | null; category?: { name: string } | null }>,
  searchName: string
): typeof products[0] | null {
  const normalizedSearch = normalizeProductName(searchName);
  const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
  
  // Strategy 1: Exact normalized match
  let match = products.find(p => normalizeProductName(p.name) === normalizedSearch);
  if (match) return match;
  
  // Strategy 2: Normalized name contains search or vice-versa
  match = products.find(p => {
    const normalizedName = normalizeProductName(p.name);
    return normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName);
  });
  if (match) return match;
  
  // Strategy 3: All significant words match
  if (searchWords.length > 0) {
    match = products.find(p => {
      const normalizedName = normalizeProductName(p.name);
      return searchWords.every(word => normalizedName.includes(word));
    });
    if (match) return match;
  }
  
  // Strategy 4: Most words match (at least 60%)
  let bestMatch: typeof products[0] | null = null;
  let bestScore = 0;
  
  for (const product of products) {
    const normalizedName = normalizeProductName(product.name);
    const nameWords = normalizedName.split(' ').filter(w => w.length > 2);
    
    let matchedWords = 0;
    for (const searchWord of searchWords) {
      if (nameWords.some(nameWord => nameWord.includes(searchWord) || searchWord.includes(nameWord))) {
        matchedWords++;
      }
    }
    
    const score = searchWords.length > 0 ? matchedWords / searchWords.length : 0;
    if (score > bestScore && score >= 0.6) {
      bestScore = score;
      bestMatch = product;
    }
  }
  
  return bestMatch;
}

async function buscarProduto(supabase: any, unitId: string, nome: string): Promise<string> {
  // Get all available products for flexible matching
  const { data: allProducts, error } = await supabase
    .from("products")
    .select(`
      name,
      description,
      price,
      delivery_price,
      category:categories(name)
    `)
    .eq("unit_id", unitId)
    .eq("available", true);

  if (error) {
    console.error("Error searching product:", error);
    return "Erro ao buscar o produto. Por favor, tente novamente.";
  }

  if (!allProducts || allProducts.length === 0) {
    return `Não encontrei nenhum produto com "${nome}" no nosso cardápio.`;
  }

  // Try direct ilike match first
  const directMatches = (allProducts as Product[]).filter(p =>
    p.name.toLowerCase().includes(nome.toLowerCase()) ||
    nome.toLowerCase().includes(p.name.toLowerCase())
  );

  if (directMatches.length > 0) {
    let result = `Encontrei ${directMatches.length} produto(s):\n\n`;
    for (const product of directMatches) {
      const price = product.price;
      result += `🍽️ *${product.name}*\n`;
      result += `💰 R$ ${price.toFixed(2).replace(".", ",")}\n`;
      if (product.description) {
        result += `📝 ${product.description}\n`;
      }
      result += "\n";
    }
    return result;
  }

  // Fallback: flexible normalized matching
  const bestMatch = findBestProductMatch(allProducts as Product[], nome);
  
  if (bestMatch) {
    const price = bestMatch.price;
    let result = `Encontrei um produto similar:\n\n`;
    result += `🍽️ *${bestMatch.name}*\n`;
    result += `💰 R$ ${price.toFixed(2).replace(".", ",")}\n`;
    if (bestMatch.description) {
      result += `📝 ${bestMatch.description}\n`;
    }
    return result;
  }

  return `Não encontrei nenhum produto com "${nome}" no nosso cardápio. Use a ferramenta listar_cardapio para ver os produtos disponíveis.`;
}

async function calcularTotal(
  supabase: any,
  unitId: string,
  itens: Array<{nome: string, quantidade: number}>
): Promise<string> {
  if (!itens || itens.length === 0) {
    return "Nenhum item informado para calcular.";
  }

  // Get all available products once for flexible matching
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, name, price, delivery_price")
    .eq("unit_id", unitId)
    .eq("available", true);

  let total = 0;
  const detalhes: string[] = [];
  const itensNaoEncontrados: string[] = [];

  for (const item of itens) {
    // Try direct match first, then fuzzy
    let product = allProducts?.find((p: any) =>
      p.name.toLowerCase().includes(item.nome.toLowerCase()) ||
      item.nome.toLowerCase().includes(p.name.toLowerCase())
    );

    if (!product && allProducts) {
      product = findBestProductMatch(
        allProducts as Array<{ id: string; name: string; price: number; delivery_price: number | null }>,
        item.nome
      );
    }

    if (product) {
      const typedProduct = product as { name: string; price: number; delivery_price: number | null };
      const preco = typedProduct.price;
      const subtotal = preco * item.quantidade;
      total += subtotal;
      detalhes.push(`• ${item.quantidade}x ${typedProduct.name} - R$ ${subtotal.toFixed(2).replace(".", ",")}`);
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

  // Channel is ALWAYS "whatsapp" for orders coming from WhatsApp webhook
  const channel = "whatsapp";

  // Find products and calculate total
  const orderItems: Array<{
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }> = [];
  let totalPrice = 0;

  // Get all available products for flexible matching
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, name, price, delivery_price")
    .eq("unit_id", unitId)
    .eq("available", true);

  const itensNaoEncontrados: string[] = [];

  for (const item of itens) {
    // First try direct ilike search
    const directMatch = allProducts?.find((p: any) => 
      p.name.toLowerCase().includes(item.nome.toLowerCase()) ||
      item.nome.toLowerCase().includes(p.name.toLowerCase())
    );

    let product = directMatch;
    
    // If no direct match, use flexible matching
    if (!product && allProducts) {
      product = findBestProductMatch(
        allProducts as Array<{ id: string; name: string; price: number; delivery_price: number | null }>,
        item.nome
      );
    }

    if (product) {
      const typedProduct = product as { id: string; name: string; price: number; delivery_price: number | null };
      const preco = typedProduct.price;
      const subtotal = preco * item.quantidade;
      totalPrice += subtotal;
      orderItems.push({
        product_id: typedProduct.id,
        product_name: typedProduct.name,
        unit_price: preco,
        quantity: item.quantidade,
        total_price: subtotal
      });
      console.log(`[ORDER] Matched "${item.nome}" → "${typedProduct.name}"`);
    } else {
      itensNaoEncontrados.push(item.nome);
      console.log(`[ORDER] No match found for "${item.nome}"`);
    }
  }

  if (orderItems.length === 0) {
    return `❌ Não encontrei nenhum dos produtos informados no cardápio. Itens não encontrados: ${itensNaoEncontrados.join(", ")}. Por favor, verifique os nomes exatos no cardápio.`;
  }

  // Warn about items not found but continue with found items
  let avisoItensNaoEncontrados = "";
  if (itensNaoEncontrados.length > 0) {
    avisoItensNaoEncontrados = `\n\n⚠️ *Atenção:* Não encontrei: ${itensNaoEncontrados.join(", ")}. O pedido foi feito apenas com os itens encontrados.`;
  }

  // Build notes with additional info
  const notesArray: string[] = [];
  // Add delivery mode info to notes
  if (modalidade === "entrega") {
    notesArray.push("🚚 Modalidade: Entrega");
  } else if (modalidade === "retirada") {
    notesArray.push("🏃 Modalidade: Retirada no local");
  } else if (modalidade === "local") {
    notesArray.push("🍽️ Modalidade: Consumo no local");
  }
  if (observacoes) notesArray.push(observacoes);
  if (pagamento.forma === "dinheiro" && pagamento.troco_para) {
    notesArray.push(`💵 Troco para: R$ ${pagamento.troco_para.toFixed(2).replace(".", ",")}`);
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

  // Generate Pix code if payment method is pix
  let pixPaymentCode: string | null = null;
  if (pagamento.forma === "pix") {
    try {
      const { data: unitSettings } = await supabase
        .from("unit_settings")
        .select("pix_key, pix_merchant_name, pix_merchant_city")
        .eq("unit_id", unitId)
        .maybeSingle();

      const { data: unitInfo } = await supabase
        .from("units")
        .select("name")
        .eq("id", unitId)
        .maybeSingle();

      if (unitSettings?.pix_key) {
        // Inline Pix generation (same logic as send-order-notification)
        const formatFieldLocal = (id: string, value: string): string => {
          const length = value.length.toString().padStart(2, '0');
          return `${id}${length}${value}`;
        };
        const normalizeStr = (str: string): string => {
          const cleaned = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().trim();
          if (cleaned.length <= 25) return cleaned;
          const truncated = cleaned.substring(0, 25);
          const lastSpace = truncated.lastIndexOf(' ');
          return lastSpace > 10 ? truncated.substring(0, lastSpace) : truncated;
        };
        const crc16Local = (str: string): string => {
          let crc = 0xFFFF;
          for (let i = 0; i < str.length; i++) {
            crc ^= str.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
              if (crc & 0x8000) { crc = ((crc << 1) ^ 0x1021) & 0xFFFF; }
              else { crc = (crc << 1) & 0xFFFF; }
            }
          }
          return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
        };

        const cleanKey = unitSettings.pix_key.replace(/\D/g, '');
        let formattedKey = unitSettings.pix_key;
        if (/^\d{11}$/.test(cleanKey)) formattedKey = cleanKey; // CPF
        else if (/^\d{14}$/.test(cleanKey)) formattedKey = cleanKey; // CNPJ
        else if (/^\+?55\d{10,11}$/.test(unitSettings.pix_key.replace(/[\s\-()]/g, ''))) {
          const cp = unitSettings.pix_key.replace(/\D/g, '');
          formattedKey = cp.startsWith('55') ? `+${cp}` : `+55${cp}`;
        } else if (/@/.test(unitSettings.pix_key)) formattedKey = unitSettings.pix_key.toLowerCase();

        let ma = formatFieldLocal('00', 'br.gov.bcb.pix') + formatFieldLocal('01', formattedKey);
        let payload = formatFieldLocal('00', '01') + formatFieldLocal('01', '12') + formatFieldLocal('26', ma) + formatFieldLocal('52', '0000') + formatFieldLocal('53', '986') + formatFieldLocal('54', totalPrice.toFixed(2)) + formatFieldLocal('58', 'BR') + formatFieldLocal('59', normalizeStr(unitSettings.pix_merchant_name || unitInfo?.name || 'RESTAURANTE')) + formatFieldLocal('60', normalizeStr(unitSettings.pix_merchant_city || 'BRASIL'));
        const txId = `PED${order.order_number}`;
        payload += formatFieldLocal('62', formatFieldLocal('05', txId.substring(0, 25).toUpperCase()));
        payload += '6304';
        payload += crc16Local(payload);
        pixPaymentCode = payload;
      }
    } catch (e) {
      console.error("Error generating Pix code in confirmarPedido:", e);
    }
  }

  // Generate Stripe payment link
  let stripePaymentUrl: string | null = null;
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const response = await fetch(`${supabaseUrl}/functions/v1/create-order-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
        },
        body: JSON.stringify({ orderId: order.id, unitId }),
      });
      if (response.ok) {
        const data = await response.json();
        stripePaymentUrl = data.url;
        console.log(`[ORDER] Stripe payment link generated: ${stripePaymentUrl}`);
      }
    }
  } catch (e) {
    console.error("Error generating Stripe payment link:", e);
  }

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

  // Add Pix code if payment is pix
  if (pixPaymentCode && pagamento.forma === "pix") {
    resultado += `\n━━━━━━━━━━━━━━━━\n`;
    resultado += `📱 *Pague via Pix:*\n`;
    resultado += `Copie o código abaixo e cole no seu app de banco:\n\n`;
    resultado += `\`\`\`${pixPaymentCode}\`\`\`\n`;
  }

  // Add Stripe payment link
  if (stripePaymentUrl) {
    resultado += `\n💳 *Pagar online (cartão):*\n${stripePaymentUrl}\n`;
  }

  // Add tracking link
  const trackingUrl = `https://restauranteos.lovable.app/track/${order.id}`;
  resultado += `\n📍 *Acompanhe seu pedido:*\n${trackingUrl}\n`;

  resultado += `\n🙏 *Agradecemos a preferência!*`;
  
  // Add warning about items not found if any
  resultado += avisoItensNaoEncontrados;

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

// Transcribe audio using Gemini Pro (best ogg/opus support) with multiple fallbacks
async function transcribeAudio(audioBase64: string, mimetype: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured for transcription");
    return "";
  }

  console.log(`Transcribing audio (mimetype: ${mimetype}, size: ${audioBase64.length} chars)`);

  // Strategy 1: Use Gemini 2.5 Pro with data URL (best for ogg/opus from WhatsApp)
  try {
    console.log("Attempting transcription with Gemini 2.5 Pro...");
    
    const dataUrl = `data:${mimetype};base64,${audioBase64}`;
    
    const geminiProResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Transcreva este áudio de voz em português brasileiro. Retorne APENAS o texto transcrito, sem explicações ou formatação."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: dataUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      }
    );

    if (geminiProResponse.ok) {
      const data = await geminiProResponse.json();
      const transcription = data.choices?.[0]?.message?.content?.trim() || "";
      if (transcription && transcription.length > 2 && !transcription.toLowerCase().includes("não consigo")) {
        console.log(`Gemini Pro transcription successful: "${transcription.substring(0, 80)}..."`);
        return transcription;
      }
      console.log("Gemini Pro returned empty or invalid transcription");
    } else {
      const errorText = await geminiProResponse.text();
      console.log("Gemini Pro failed:", geminiProResponse.status, errorText.substring(0, 300));
    }
  } catch (error) {
    console.error("Gemini Pro error:", error);
  }

  // Strategy 2: Try Gemini Flash with input_audio and mp3 format hint
  try {
    console.log("Attempting transcription with Gemini Flash...");
    
    const geminiFlashResponse = await fetch(
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
                  text: "Transcreva este áudio. Retorne APENAS o texto."
                },
                {
                  type: "input_audio",
                  input_audio: {
                    data: audioBase64,
                    format: "mp3"
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      }
    );

    if (geminiFlashResponse.ok) {
      const data = await geminiFlashResponse.json();
      const transcription = data.choices?.[0]?.message?.content?.trim() || "";
      if (transcription && transcription.length > 2 && !transcription.toLowerCase().includes("não consigo")) {
        console.log(`Gemini Flash transcription successful: "${transcription.substring(0, 80)}..."`);
        return transcription;
      }
    } else {
      const errorText = await geminiFlashResponse.text();
      console.log("Gemini Flash failed:", geminiFlashResponse.status, errorText.substring(0, 200));
    }
  } catch (error) {
    console.error("Gemini Flash error:", error);
  }

  // Strategy 3: Try GPT-5 with mp3 format hint
  try {
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
              content: "Você é um transcritor de áudio. Transcreva em português brasileiro. Retorne APENAS o texto."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Transcreva:"
                },
                {
                  type: "input_audio",
                  input_audio: {
                    data: audioBase64,
                    format: "mp3"
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
      const data = await gptResponse.json();
      const transcription = data.choices?.[0]?.message?.content?.trim() || "";
      if (transcription && transcription.length > 2) {
        console.log(`GPT-5 transcription successful: "${transcription.substring(0, 80)}..."`);
        return transcription;
      }
    } else {
      const errorText = await gptResponse.text();
      console.log("GPT-5 failed:", gptResponse.status, errorText.substring(0, 200));
    }
  } catch (error) {
    console.error("GPT-5 error:", error);
  }

  console.log("All transcription methods failed");
  return "";
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

// Send typing/presence indicator to WhatsApp client
// Uses Evolution API sendPresence endpoint with correct format
async function sendPresence(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  phone: string,
  presence: "composing" | "recording" | "paused"
): Promise<void> {
  try {
    console.log(`[PRESENCE] Sending ${presence} to ${phone}...`);
    
    const response = await fetch(
      `${apiUrl}/chat/sendPresence/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiToken,
        },
        body: JSON.stringify({
          number: phone,
          options: {
            delay: 1200,
            presence: presence,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PRESENCE] Error: ${response.status}`, errorText);
    } else {
      console.log(`[PRESENCE] ${presence} sent successfully to ${phone}`);
    }
  } catch (error) {
    console.error("[PRESENCE] Error sending presence:", error);
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
interface ProcessWithAIResult {
  response: string;
  menuMessages?: string[];
}

async function processWithAI(
  supabase: any,
  unitId: string,
  messages: Array<{role: string, content: string}>,
  customerPhone: string,
  customerName: string
): Promise<ProcessWithAIResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const MAX_ITERATIONS = 6;
  let iterations = 0;
  const currentMessages: any[] = [...messages];
  let pendingMenuMessages: string[] | undefined;

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
        const toolResult = await executeTool(
          supabase, 
          unitId, 
          toolCall.function.name, 
          args,
          customerPhone,
          customerName
        );

        // Check if tool returned multiple messages (e.g., menu)
        if (toolResult.multipleMessages) {
          pendingMenuMessages = toolResult.multipleMessages;
          console.log(`Tool returned ${toolResult.multipleMessages.length} messages to send separately`);
        }

        currentMessages.push({
          role: "tool",
          content: toolResult.text,
          tool_call_id: toolCall.id
        });
      }
      
      continue;
    }

    // Check if AI returned action/action_input JSON in content (fallback)
    const parsedAction = parseActionFromContent(message.content || "");
    if (parsedAction) {
      console.log(`Detected action in content: ${parsedAction.action}`);
      
      const toolResult = await executeTool(
        supabase,
        unitId,
        parsedAction.action,
        parsedAction.input,
        customerPhone,
        customerName
      );

      // Check if tool returned multiple messages
      if (toolResult.multipleMessages) {
        pendingMenuMessages = toolResult.multipleMessages;
      }

      currentMessages.push({
        role: "assistant",
        content: `[Processando...]`
      });
      currentMessages.push({
        role: "user", 
        content: `Resultado:\n\n${toolResult.text}\n\nAgora responda ao cliente de forma natural, amigável e profissional. Continue o fluxo do pedido conforme as instruções.`
      });
      
      continue;
    }

    // No tool calls - return the final message
    const finalResponse = sanitizeResponse(message.content || "");
    
    if (!finalResponse) {
      return { 
        response: "Desculpe, não consegui gerar uma resposta. Como posso ajudar?",
        menuMessages: pendingMenuMessages
      };
    }
    
    return { response: finalResponse, menuMessages: pendingMenuMessages };
  }

  return { 
    response: "Desculpe, tive dificuldade em processar sua solicitação. Por favor, tente novamente.",
    menuMessages: pendingMenuMessages
  };
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
      // Store user message even when bot is disabled
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

    // Check for human escalation BEFORE AI processing
    if (detectHumanEscalation(messageText)) {
      console.log(`[ESCALATION] Human escalation detected for ${phone}`);
      
      const escalationMessage = await escalateToHuman(
        supabase,
        conversation.id,
        settings.unit_id,
        phone,
        customerName,
        messageText
      );
      
      // Send escalation message
      const sentMessageId = await sendWhatsAppMessage(
        settings.api_url,
        settings.api_token,
        instanceName,
        phone,
        escalationMessage
      );
      
      // Store the escalation message
      await supabase.from("whatsapp_messages").insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: escalationMessage,
        message_id: sentMessageId,
        status: "sent",
      });
      
      return new Response(JSON.stringify({ 
        status: "escalated_to_human",
        reason: messageText.substring(0, 100)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send initial typing indicator to client
    console.log(`[PRESENCE] Starting composing indicator for ${phone}`);
    await sendPresence(settings.api_url, settings.api_token, instanceName, phone, "composing");
    
    // Update typing status in database
    await updateTypingStatus(supabase, conversation.id, true, false);

    // Start interval to keep presence active during AI processing (expires after a few seconds)
    const presenceInterval = setInterval(async () => {
      console.log(`[PRESENCE] Refreshing composing for ${phone}`);
      await sendPresence(settings.api_url, settings.api_token, instanceName, phone, "composing");
    }, 8000); // Refresh every 8 seconds

    // Get recent conversation history for context
    const { data: recentMessages } = await supabase
      .from("whatsapp_messages")
      .select("role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Build messages array for AI with professional system prompt
    const basePrompt = settings.system_prompt || getDefaultSystemPrompt();

    // Always inject audio capability instructions (works for both custom and default prompts)
    const audioInstructions = `

IMPORTANTE - CAPACIDADE DE ÁUDIO/VOZ:
- Você TEM capacidade de responder em áudio/voz quando apropriado
- O sistema converte automaticamente suas respostas de texto em áudio quando necessário
- NUNCA diga que "não consegue enviar áudio", "sou um assistente de texto" ou "não consigo enviar mensagens de voz"
- Se o cliente pedir para responder em áudio, responda normalmente - o sistema cuidará da conversão
- Você pode e deve responder em áudio quando o cliente solicitar

REGRAS PARA RESPOSTAS EM ÁUDIO (quando o cliente enviou áudio ou pediu resposta em voz):
- Escreva valores monetários por EXTENSO: "trinta e quatro reais e noventa centavos" ao invés de "R$ 34,90"
- NÃO use emojis, asteriscos, underlines ou qualquer formatação markdown
- NÃO use símbolos como R$, %, #, etc - escreva tudo por extenso
- Use tom conversacional e natural, como se estivesse falando pessoalmente
- Mantenha respostas curtas e diretas, como uma conversa real
- Use "reais" para a moeda brasileira, NUNCA "dólares"
- Números devem ser escritos por extenso quando possível (ex: "dois" ao invés de "2")
`;

    const formattingRules = `

REGRAS OBRIGATÓRIAS DE FORMATAÇÃO (aplicam-se SEMPRE, independente do prompt personalizado):

REGRA 1 - UMA PERGUNTA POR VEZ:
- NUNCA faça mais de uma pergunta na mesma mensagem
- Primeiro pergunte o nome, espere resposta. Depois a modalidade, espere. Depois pagamento.
- Se o cliente já forneceu dados espontaneamente, pule para a próxima etapa.

REGRA 2 - FORMATAÇÃO DE LISTAS E OPÇÕES:
- NUNCA use listas numeradas (1. 2. 3.)
- Use um emoji relevante como marcador para cada item
- Cada item/opção deve estar em sua PRÓPRIA LINHA (use quebra de linha)
- Use *negrito* do WhatsApp para destacar opções
- NUNCA agrupe opções na mesma linha separadas por vírgula

EXEMPLOS OBRIGATÓRIOS DE FORMATAÇÃO:

ERRADO: "1. Nome 2. Modalidade: *Entrega*, *Retirada*. 3. Pagamento."
ERRADO: "As opções são: *Dinheiro*, *PIX*, *Cartão*"
ERRADO: "**1. Entrega** | **2. Retirada** | **3. Comer no Local**"

CERTO (pagamento):
"Qual a forma de pagamento?

💵 *Dinheiro*
📱 *PIX*
💳 *Cartão* (Débito/Crédito)"

CERTO (modalidade):
"Como deseja receber?

🏠 *Entrega*
🏪 *Retirada*
🍽️ *Comer no Local*"

CERTO (itens do pedido):
"🍕 1x Pizza Grande - R$ 45,00
🥤 2x Refrigerante - R$ 10,00"
`;

    const systemPrompt = basePrompt + formattingRules + audioInstructions;

    const filteredMessages = (recentMessages || [])
      .reverse()
      .filter((m: any) => {
        if (m.role === 'assistant') {
          const lower = (m.content || '').toLowerCase();
          if (
            lower.includes('assistente de texto') ||
            lower.includes('apenas por texto') ||
            lower.includes('não consigo enviar mensagens de voz') ||
            lower.includes('nao consigo enviar mensagens de voz') ||
            lower.includes('não consigo te enviar') ||
            lower.includes('nao consigo te enviar')
          ) {
            return false;
          }
        }
        return true;
      })
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...filteredMessages,
    ];

    // Process with AI
    let assistantMessage: string;
    let menuMessages: string[] | undefined;
    
    try {
      const aiResult = await processWithAI(
        supabase,
        settings.unit_id,
        aiMessages,
        phone,
        customerName
      );
      assistantMessage = aiResult.response;
      menuMessages = aiResult.menuMessages;
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
    } finally {
      // Always clear the presence interval
      clearInterval(presenceInterval);
    }

    // Clear typing status in database
    await updateTypingStatus(supabase, conversation.id, false, false);

    // Send paused presence to clear the typing indicator on client
    console.log(`[PRESENCE] Clearing composing indicator for ${phone}`);
    await sendPresence(settings.api_url, settings.api_token, instanceName, phone, "paused");

    // Send menu messages separately if available
    if (menuMessages && menuMessages.length > 0) {
      console.log(`[MENU] Sending ${menuMessages.length} menu messages separately`);
      
      const menuMessageId = await sendMultipleWhatsAppMessages(
        settings.api_url,
        settings.api_token,
        instanceName,
        phone,
        menuMessages
      );
      
      // Store all menu messages as one entry with combined content
      await supabase.from("whatsapp_messages").insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: menuMessages.join("\n\n"),
        message_id: menuMessageId,
        status: "sent",
      });
    }

    // Final sanitization
    assistantMessage = sanitizeResponse(assistantMessage);

    // If menu was already sent via separate messages, suppress AI response entirely
    let sentMessageId = "";
    if (menuMessages && menuMessages.length > 0) {
      console.log("[MENU] Menu sent separately, suppressing AI duplicate response");
    } else {
      // Decide: send as audio or text based on settings
      const ttsMode = settings.tts_mode || 'auto';
      const ttsVoiceId = settings.tts_voice_id || 'FGY2WhTYpPnrIDTdsKH5';
      const userMessageText = messageText || "";
      
      if (shouldSendAsAudio(assistantMessage, ttsMode, userMessageText)) {
        // Try to send as audio via ElevenLabs TTS
        try {
          console.log("[TTS] Converting response to audio via ElevenLabs...");
          const audioBase64 = await textToSpeech(assistantMessage, ttsVoiceId, settings.elevenlabs_api_key || undefined);
          
          sentMessageId = await sendWhatsAppAudio(
            settings.api_url,
            settings.api_token,
            instanceName,
            phone,
            audioBase64
          );

          // Store as audio message
          await supabase.from("whatsapp_messages").insert({
            conversation_id: conversation.id,
            role: "assistant",
            content: assistantMessage,
            message_id: sentMessageId,
            status: "sent",
            media_type: "audio",
            transcription: assistantMessage,
          });

          console.log("[TTS] Audio response sent successfully");
        } catch (ttsError) {
          // Fallback to text if TTS fails
          console.error("[TTS] Failed, falling back to text:", ttsError);
          sentMessageId = await sendWhatsAppMessage(
            settings.api_url,
            settings.api_token,
            instanceName,
            phone,
            assistantMessage
          );

          await supabase.from("whatsapp_messages").insert({
            conversation_id: conversation.id,
            role: "assistant",
            content: assistantMessage,
            message_id: sentMessageId,
            status: "sent",
          });
        }
      } else {
        // Complex/formatted message - send as text
        sentMessageId = await sendWhatsAppMessage(
          settings.api_url,
          settings.api_token,
          instanceName,
          phone,
          assistantMessage
        );

        await supabase.from("whatsapp_messages").insert({
          conversation_id: conversation.id,
          role: "assistant",
          content: assistantMessage,
          message_id: sentMessageId,
          status: "sent",
        });
      }
    }

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

🔄 VARIAÇÕES (use alternativas para não parecer robótico):
- Confirmações: "Perfeito!", "Anotado!", "Entendi!", "Certo!", "Beleza!"
- Compreensão: "Entendo!", "Compreendo!", "Claro!", "Com certeza!"
- Agradecimentos: "Obrigado!", "Valeu!", "Agradeço!"
- Transições: "Agora...", "Então...", "Legal, então..."
- NUNCA repita a mesma expressão duas vezes seguidas

💚 EMPATIA (demonstre que entende o cliente):
- Se cliente está com pressa: "Entendo a pressa! Vou ser rápido."
- Se cliente está confuso: "Sem problema! Deixa eu explicar melhor."
- Se cliente muda de ideia: "Claro, sem problema! Podemos ajustar."
- Se cliente reclama: "Entendo sua frustração. Vou resolver isso."
- SEMPRE valide o sentimento antes de responder

🔴🔴🔴 REGRA CRÍTICA #1 - NOMES DE PRODUTOS 🔴🔴🔴
- SEMPRE use os nomes EXATOS que aparecem no cardápio
- NUNCA invente, modifique ou adicione palavras aos nomes dos produtos
- Se não lembrar o nome exato, use buscar_produto ANTES de confirmar
- Exemplos de ERROS que você NÃO pode cometer:
  ❌ "Suco Natural de Laranja" → ✅ "Suco Natural Laranja"
  ❌ "Prato Comercial misto" → ✅ "Prato Feito"
  ❌ "X-Bacon Especial" → ✅ "X-Bacon"
- ANTES de usar confirmar_pedido, VERIFIQUE se os nomes estão iguais ao cardápio

🔴🔴🔴 REGRA CRÍTICA #2 - FLUXO DO TROCO 🔴🔴🔴
Quando perguntar "para quanto?" ou "vai precisar de troco?" e o cliente responder APENAS UM NÚMERO:
- O número significa o VALOR PARA PAGAMENTO (ex: "50" = R$50)
- NÃO é uma confirmação do pedido!
- PRÓXIMO PASSO OBRIGATÓRIO: Mostrar o RESUMO COMPLETO (ETAPA 9)
- NUNCA pule direto para confirmar_pedido após receber o número do troco

Exemplo de fluxo CORRETO:
Bot: "O total é R$ 34,90. Vai precisar de troco? Para quanto?"
Cliente: "50"
Bot: "Perfeito! Troco para R$ 50,00. Deixa eu confirmar:

📋 *RESUMO DO PEDIDO*
[mostrar resumo completo aqui]

✅ Posso confirmar?"

Cliente: "sim"
[APENAS AGORA usar confirmar_pedido]

🔴🔴🔴 REGRA CRÍTICA #3 - NUNCA CONFIRMAR SEM RESUMO 🔴🔴🔴
⚠️ ANTES de usar a ferramenta confirmar_pedido:
1. SEMPRE mostre o resumo COMPLETO do pedido
2. ESPERE uma resposta EXPLÍCITA de confirmação
3. Respostas que SÃO confirmação: "sim", "confirmo", "pode fazer", "isso", "confirma"
4. Respostas que NÃO são confirmação: números sozinhos (50, 100), "ok", "tá"
5. Se o cliente responder só um número, é VALOR DE TROCO, não confirmação!

⚠️ OUTRAS REGRAS IMPORTANTES:
1. NUNCA responda com JSON, código ou dados técnicos
2. NUNCA pule etapas do fluxo - siga a ordem
3. NUNCA finalize pedido sem TODOS os dados E confirmação explícita
4. SEMPRE confirme os itens antes de pedir endereço/modalidade
5. SEMPRE pergunte sobre troco se pagamento for dinheiro
6. Se o cliente não responder algo, pergunte novamente educadamente

🔴🔴🔴 REGRA CRÍTICA #4 - UMA PERGUNTA POR VEZ 🔴🔴🔴
⚠️ NUNCA faça mais de uma pergunta na mesma mensagem!
- Cada etapa deve ser uma mensagem separada com UMA ÚNICA pergunta.
- ERRADO: "Qual seu nome? Como deseja receber? Qual a forma de pagamento?" (3 perguntas juntas)
- CERTO: Primeiro pergunte o nome. Espere a resposta. Depois pergunte a modalidade. Espere. Depois o pagamento.
- Se o cliente já forneceu dados espontaneamente (ex: já disse o nome antes), pule para a próxima etapa normalmente.
- Cada mensagem deve ter NO MÁXIMO uma pergunta ao cliente.

🔴🔴🔴 REGRA CRÍTICA #5 - FORMATAÇÃO DE LISTAS E OPÇÕES 🔴🔴🔴
- NUNCA use listas numeradas (1. 2. 3.)
- Use um emoji relevante como marcador para cada item
- Cada item/opção deve estar em sua PRÓPRIA LINHA (quebra de linha \\n)
- Use *negrito* do WhatsApp para destacar opções
- NUNCA agrupe opções na mesma linha separadas por vírgula
- ERRADO: "1. Seu nome. 2. Modalidade: *Entrega*, *Retirada*. 3. Pagamento."
- ERRADO: "As opções são: *Dinheiro*, *PIX*, *Cartão*"
- CERTO:
  "Qual a forma de pagamento?

  💵 *Dinheiro*
  📱 *PIX*
  💳 *Cartão* (Débito/Crédito)"
- Quando listar itens do pedido, use emojis por item:
  "🍕 1x Pizza Grande - R$ 45,00
  🥤 2x Refrigerante - R$ 10,00"
- Para modalidades:
  "Como deseja receber?

  🏠 *Entrega*
  🏪 *Retirada*
  🍽️ *Comer no Local*"

🎤 MENSAGENS DE ÁUDIO - IMPORTANTE:
- Você TEM capacidade de responder em áudio/voz. O sistema converte suas respostas em áudio automaticamente.
- Se o cliente pedir áudio, responda normalmente com texto curto e conversacional - o sistema enviará como áudio.
- NUNCA diga que "não consegue enviar áudio", "sou assistente de texto" ou "não consigo enviar mensagens de voz".
- Se receber "[Áudio transcrito]: texto", trate o texto como uma mensagem normal
- Se receber "[O cliente enviou um áudio que não pôde ser transcrito]":
  → Responda: "Recebi seu áudio! 🎤 Infelizmente não consegui entender. Poderia repetir por texto?"
- NUNCA diga que "não consegue processar áudio"
- SEMPRE seja gentil e peça para repetir quando não entender

🖼️ MENSAGENS COM IMAGEM:
- Quando receber uma imagem, você verá a análise entre colchetes
- Se for comprovante de pagamento Pix: confirme o recebimento e agradeça
- Se for foto de endereço/mapa: confirme a localização
- Se for outra coisa: descreva brevemente o que entendeu e continue

📋 FLUXO OBRIGATÓRIO DO PEDIDO:

ETAPA 1 - SAUDAÇÃO:
Se for uma nova conversa, cumprimente e pergunte o nome do cliente.
Exemplo: "Olá! Bem-vindo ao nosso restaurante! 👋 Com quem tenho o prazer de falar?"

ETAPA 2 - CARDÁPIO:
Após saber o nome, ofereça ajuda e o cardápio.
Exemplo: "Prazer em te atender, [Nome]! 😊 Posso mostrar nosso cardápio ou você já sabe o que gostaria?"

ETAPA 3 - ESCOLHA DOS ITENS:
Ajude o cliente a escolher, responda dúvidas sobre produtos.
Use a ferramenta listar_cardapio ou buscar_produto quando necessário.
MEMORIZE os nomes EXATOS dos produtos que aparecem!
IMPORTANTE: Quando usar listar_cardapio, o cardápio já será enviado automaticamente ao cliente em mensagens formatadas separadas.
NÃO repita o cardápio na sua resposta. Apenas pergunte o que o cliente gostaria de pedir, sem listar produtos novamente.

ETAPA 4 - CONFIRMAÇÃO DOS ITENS:
Liste todos os itens escolhidos com preços e total.
USE OS NOMES EXATOS DO CARDÁPIO!
Exemplo: "Seu pedido até agora:
• 2x X-Bacon - R$ 77,80
• 1x Suco Natural Laranja - R$ 12,00
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
💳 Cartão de Crédito/Débito
📱 Pix
🎫 Vale Refeição"

ETAPA 8 - TROCO (apenas se DINHEIRO):
"O total é R$ [TOTAL]. Vai precisar de troco? Se sim, para quanto vai pagar?"
⚠️ LEMBRE-SE: A resposta será um NÚMERO (valor do pagamento), NÃO uma confirmação!

ETAPA 9 - RESUMO E CONFIRMAÇÃO:
OBRIGATÓRIO mostrar o resumo COMPLETO e pedir confirmação EXPLÍCITA:
"📋 *RESUMO DO SEU PEDIDO*

👤 *Cliente:* [Nome]
📍 *Modalidade:* [Entrega/Retirada/Local]
🏠 *Endereço:* [Se entrega]

📦 *Itens:*
• [Lista com NOMES EXATOS do cardápio]

💰 *Total:* R$ [Total]
💳 *Pagamento:* [Forma]
💵 *Troco para:* R$ [Se dinheiro]
💰 *Troco:* R$ [Valor do troco calculado]

✅ *Posso confirmar o pedido?*"

ETAPA 10 - FINALIZAÇÃO:
SOMENTE quando o cliente confirmar EXPLICITAMENTE (sim, confirmo, pode fazer, etc):
- Use a ferramenta confirmar_pedido
- USE OS NOMES EXATOS DOS PRODUTOS do cardápio, não invente!
- Inclua TODOS os dados coletados

🚫 NUNCA FAÇA:
- Criar pedido sem confirmação explícita ("sim", "confirmo", etc)
- Interpretar número como confirmação (50, 100 = valor de troco)
- Pular o resumo antes de confirmar
- Inventar ou modificar nomes de produtos
- Responder com JSON ou código
- Dizer que não pode processar áudio

✅ EXEMPLOS DE RESPOSTAS CORRETAS:
- "Perfeito! Vou mostrar nosso cardápio 📋"
- "Anotado! O X-Bacon custa R$ 38,90 e vem com hambúrguer, bacon e queijo!"
- "Entendi! Qual o seu endereço para entrega?"
- "Certo! O total ficou R$ 89,80. Vai precisar de troco? Para quanto vai pagar?"
- Cliente: "100" → "Perfeito! Troco para R$ 100,00. [MOSTRAR RESUMO] Confirma o pedido?"
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

// Send multiple messages with delay for natural conversation flow
async function sendMultipleWhatsAppMessages(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  phone: string,
  messages: string[]
): Promise<string> {
  let lastMessageId = "";
  
  for (let i = 0; i < messages.length; i++) {
    // Send typing indicator between messages
    if (i > 0) {
      await sendPresence(apiUrl, apiToken, instanceName, phone, "composing");
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    lastMessageId = await sendWhatsAppMessage(
      apiUrl, apiToken, instanceName, phone, messages[i]
    );
    
    // Small delay between messages for natural feel
    if (i < messages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }
  
  return lastMessageId;
}

// Determine if a message should be sent as audio based on tts_mode and user's explicit request
function shouldSendAsAudio(message: string, ttsMode: string, userMessageText: string): boolean {
  // Check mode first
  if (ttsMode === 'disabled') return false;
  
  if (ttsMode === 'auto') {
    // Only send audio if user explicitly asked for it in their message
    const normalizedText = userMessageText.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove accents
    
    const audioRequestPatterns = [
      "manda em audio", "envia em audio", "responde em audio",
      "manda por voz", "envia por voz", "responde por voz",
      "manda audio", "envia audio", "quero audio",
      "quero ouvir", "fala pra mim", "pode falar",
      "manda um audio", "envia um audio",
      "por audio", "em audio", "por voz", "em voz",
      "me fala", "fala ai"
    ];
    
    const userRequestedAudio = audioRequestPatterns.some(pattern => normalizedText.includes(pattern));
    if (!userRequestedAudio) return false;
    
    console.log("[TTS] User explicitly requested audio response");
  }
  
  // Content checks (both 'always' and 'auto' when user requested)
  if (!message || message.length < 5) return false;
  if (message.length > 1500) return false;
  
  const formatIndicators = [
    (message.match(/\n/g) || []).length > 8,
    (message.match(/[📋🛒💰🏍️🏠📍💳🧾✅❌📦]/g) || []).length > 3,
    message.includes("────"),
    message.includes("*RESUMO*") || message.includes("*PEDIDO*"),
    message.includes("*CARDÁPIO*") || message.includes("*MENU*"),
    (message.match(/R\$ ?\d/g) || []).length > 2,
    (message.match(/^\s*[-•●]\s/gm) || []).length > 3,
  ];
  
  const complexityScore = formatIndicators.filter(Boolean).length;
  return complexityScore < 2;
}

// Prepare text for natural speech synthesis in Brazilian Portuguese
function prepareTextForSpeech(text: string): string {
  let prepared = text;
  
  // Convert R$ X,YY to spoken format
  prepared = prepared.replace(/R\$\s*(\d+)[,.](\d{2})/g, (_, reais, centavos) => {
    const centavosNum = parseInt(centavos);
    if (centavosNum === 0) return `${reais} reais`;
    return `${reais} reais e ${centavos} centavos`;
  });
  // R$ without cents
  prepared = prepared.replace(/R\$\s*(\d+)/g, '$1 reais');
  
  // Spell out formatted CPF (XXX.XXX.XXX-XX) digit by digit
  prepared = prepared.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/g, (_, a, b, c, d) => {
    return (a + b + c + d).split('').join(', ');
  });
  // Spell out formatted CNPJ (XX.XXX.XXX/XXXX-XX) digit by digit
  prepared = prepared.replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})-(\d{2})/g, (_, a, b, c, d, e) => {
    return (a + b + c + d + e).split('').join(', ');
  });
  // Spell out long digit sequences (11+ digits: CPF, CNPJ, phone, Pix keys) digit by digit
  prepared = prepared.replace(/\+?(\d{11,})/g, (match) => {
    const digits = match.replace(/\D/g, '');
    return digits.split('').join(', ');
  });
  
  // Remove emojis
  prepared = prepared.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '');
  
  // Remove markdown formatting
  prepared = prepared.replace(/\*\*(.*?)\*\*/g, '$1'); // **bold**
  prepared = prepared.replace(/\*(.*?)\*/g, '$1');     // *italic*
  prepared = prepared.replace(/_(.*?)_/g, '$1');       // _underline_
  prepared = prepared.replace(/~(.*?)~/g, '$1');       // ~strikethrough~
  prepared = prepared.replace(/```[\s\S]*?```/g, '');  // code blocks
  prepared = prepared.replace(/`(.*?)`/g, '$1');       // inline code
  
  // Remove special characters that confuse TTS
  prepared = prepared.replace(/[#•\-]{2,}/g, ' ');
  prepared = prepared.replace(/─+/g, ' ');
  prepared = prepared.replace(/[│┃┆]/g, ' ');
  
  // Clean up whitespace
  prepared = prepared.replace(/\n{2,}/g, '. ');
  prepared = prepared.replace(/\n/g, ', ');
  prepared = prepared.replace(/\s{2,}/g, ' ');
  prepared = prepared.trim();
  
  return prepared;
}

// Convert text to speech using ElevenLabs API
async function textToSpeech(text: string, voiceId?: string, clientApiKey?: string): Promise<string> {
  const apiKey = clientApiKey || Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }
  
  const selectedVoiceId = voiceId || "FGY2WhTYpPnrIDTdsKH5"; // Laura default
  
  // Pre-process text for natural Brazilian Portuguese speech
  const preparedText = prepareTextForSpeech(text);
  console.log("[TTS] Prepared text for speech:", preparedText.substring(0, 100) + "...");
  
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_22050_32`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: preparedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          speed: 1.0,
        },
      }),
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[TTS] ElevenLabs error:", response.status, errorText);
    throw new Error(`ElevenLabs TTS failed: ${response.status}`);
  }
  
  const audioBuffer = await response.arrayBuffer();
  return base64Encode(audioBuffer);
}

// Send audio message via Evolution API
async function sendWhatsAppAudio(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  phone: string,
  audioBase64: string
): Promise<string> {
  const response = await fetch(
    `${apiUrl}/message/sendWhatsAppAudio/${instanceName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiToken,
      },
      body: JSON.stringify({
        number: phone,
        audio: audioBase64,
        encoding: "base64",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[TTS] Error sending WhatsApp audio:", response.status, errorText);
    throw new Error(`Failed to send WhatsApp audio: ${response.status}`);
  }

  const data = await response.json();
  console.log("[TTS] WhatsApp audio sent successfully to:", phone);
  return data.key?.id || "";
}
