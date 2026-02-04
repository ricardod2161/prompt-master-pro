import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BillOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface BillOrder {
  orderNumber: number;
  createdAt: string;
  total: number;
  items: BillOrderItem[];
}

interface BillData {
  orders: BillOrder[];
  totalAmount: number;
  customerName: string;
  customerPhone: string;
}

interface NotificationRequest {
  orderId: string;
  status: "ready" | "delivering" | "delivered" | "confirmed" | "cancelled" | "bill_close";
  unitId: string;
  billData?: BillData;
}

interface WhatsAppSettings {
  api_url: string;
  api_token: string;
  instance_name: string;
}

interface UnitSettings {
  pix_key: string | null;
  pix_merchant_name: string | null;
  pix_merchant_city: string | null;
}

interface Unit {
  name: string;
  address: string | null;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string | null;
  customer_phone: string | null;
  channel: string;
  total_price: number;
  table_id: string | null;
  delivery_orders?: Array<{
    address: string;
  }> | null;
  tables?: {
    number: number;
  } | null;
}

// Pix EMV code generator functions
function crc16(str: string): string {
  let crc = 0xFFFF;
  
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .substring(0, 25)
    .toUpperCase();
}

// Detecta o tipo de chave Pix corretamente
function detectPixKeyType(key: string): 'cpf' | 'cnpj' | 'phone' | 'email' | 'random' {
  const cleanKey = key.replace(/\D/g, '');
  
  // CPF: exatamente 11 dígitos numéricos (não começa com 0 geralmente)
  if (/^\d{11}$/.test(cleanKey) && !cleanKey.startsWith('0')) {
    return 'cpf';
  }
  
  // CNPJ: 14 dígitos numéricos
  if (/^\d{14}$/.test(cleanKey)) {
    return 'cnpj';
  }
  
  // Telefone: tem +55 explícito OU começa com 0 (indicando DDD)
  if (/^\+?55\d{10,11}$/.test(key.replace(/[\s\-()]/g, '')) || cleanKey.startsWith('0')) {
    return 'phone';
  }
  
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) {
    return 'email';
  }
  
  // Chave aleatória ou outro formato
  return 'random';
}

function formatPixKey(key: string): string {
  const type = detectPixKeyType(key);
  
  switch (type) {
    case 'cpf':
    case 'cnpj':
      // CPF e CNPJ: apenas números, SEM +55
      return key.replace(/\D/g, '');
    case 'phone':
      // Telefone: adiciona +55 se necessário
      const cleanPhone = key.replace(/\D/g, '');
      if (cleanPhone.startsWith('55')) return `+${cleanPhone}`;
      return `+55${cleanPhone}`;
    case 'email':
      return key.toLowerCase();
    default:
      return key;
  }
}

function generatePixCode(
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount: number,
  transactionId: string
): string {
  const formattedKey = formatPixKey(pixKey);
  
  let merchantAccount = formatField('00', 'br.gov.bcb.pix');
  merchantAccount += formatField('01', formattedKey);
  
  let payload = '';
  payload += formatField('00', '01');
  payload += formatField('26', merchantAccount);
  payload += formatField('52', '0000');
  payload += formatField('53', '986');
  
  if (amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }
  
  payload += formatField('58', 'BR');
  payload += formatField('59', normalizeString(merchantName));
  payload += formatField('60', normalizeString(merchantCity));
  
  if (transactionId) {
    const additionalData = formatField('05', transactionId.substring(0, 25).toUpperCase());
    payload += formatField('62', additionalData);
  }
  
  payload += '6304';
  const crc = crc16(payload);
  payload += crc;
  
  return payload;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, status, unitId, billData }: NotificationRequest = await req.json();

    // Validate required fields
    if (!orderId || !status || !unitId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Campos obrigatórios: orderId, status, unitId",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get WhatsApp settings for the unit
    const { data: settings, error: settingsError } = await supabase
      .from("whatsapp_settings")
      .select("api_url, api_token, instance_name")
      .eq("unit_id", unitId)
      .maybeSingle();

    if (settingsError || !settings?.api_url || !settings?.api_token || !settings?.instance_name) {
      console.log("WhatsApp not configured for unit:", unitId);
      return new Response(
        JSON.stringify({
          success: false,
          error: "WhatsApp não configurado para esta unidade",
          skipped: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get unit settings (pix_key) and unit info
    const [unitSettingsResult, unitInfoResult] = await Promise.all([
      supabase
        .from("unit_settings")
        .select("pix_key, pix_merchant_name, pix_merchant_city")
        .eq("unit_id", unitId)
        .maybeSingle(),
      supabase
        .from("units")
        .select("name, address")
        .eq("id", unitId)
        .maybeSingle(),
    ]);

    const unitSettings = unitSettingsResult.data as UnitSettings | null;
    const unitInfo = unitInfoResult.data as Unit | null;

    // Get order details with table info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customer_name,
        customer_phone,
        channel,
        total_price,
        table_id,
        tables(number),
        delivery_orders(address)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Pedido não encontrado",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if we have customer phone
    if (!order.customer_phone) {
      console.log("Order has no customer phone:", orderId);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Pedido sem telefone do cliente",
          skipped: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build notification message based on status
    const customerName = order.customer_name || "Cliente";
    const deliveryAddress = Array.isArray(order.delivery_orders) && order.delivery_orders.length > 0
      ? order.delivery_orders[0].address
      : null;
    const tableNumber = Array.isArray(order.tables) && order.tables.length > 0 
      ? order.tables[0].number 
      : null;
    
    // Generate tracking URL
    const trackingUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--') || ''}/track/${order.id}`;
    
    // Generate Pix code if available
    let pixCode: string | null = null;
    if (unitSettings?.pix_key && order.total_price > 0) {
      try {
        console.log("PIX DEBUG - Chave original:", unitSettings.pix_key);
        console.log("PIX DEBUG - Tipo detectado:", detectPixKeyType(unitSettings.pix_key));
        console.log("PIX DEBUG - Chave formatada:", formatPixKey(unitSettings.pix_key));
        
        pixCode = generatePixCode(
          unitSettings.pix_key,
          unitSettings.pix_merchant_name || unitInfo?.name || "RESTAURANTE",
          unitSettings.pix_merchant_city || "BRASIL",
          order.total_price,
          `PED${order.order_number}`
        );
        
        console.log("PIX DEBUG - Código gerado:", pixCode);
      } catch (e) {
        console.error("Error generating Pix code:", e);
      }
    }
    
    // Format currency
    const formattedTotal = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(order.total_price);
    
    let message = "";

    switch (status) {
      case "bill_close":
        // Consolidated bill closing message
        if (billData) {
          const { orders: billOrders, totalAmount, customerName: billCustomerName, customerPhone: billPhone } = billData;
          
          // Override phone with billData phone
          order.customer_phone = billPhone;
          
          // Format currency for total
          const formattedBillTotal = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(totalAmount);
          
          // Generate Pix code for total amount
          let billPixCode: string | null = null;
          if (unitSettings?.pix_key && totalAmount > 0) {
            try {
              billPixCode = generatePixCode(
                unitSettings.pix_key,
                unitSettings.pix_merchant_name || unitInfo?.name || "RESTAURANTE",
                unitSettings.pix_merchant_city || "BRASIL",
                totalAmount,
                `CONTA${tableNumber || ""}`
              );
            } catch (e) {
              console.error("Error generating bill Pix code:", e);
            }
          }
          
          message = `🧾 *Conta Fechada - Mesa ${tableNumber || ""}*\n\n` +
            `Olá ${billCustomerName}! Aqui está o resumo da sua conta:\n\n`;
          
          // Add each order
          for (const billOrder of billOrders) {
            const orderTime = new Date(billOrder.createdAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const orderSubtotal = new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(billOrder.total);
            
            message += `📋 *Pedido #${billOrder.orderNumber}* (${orderTime})\n`;
            for (const item of billOrder.items) {
              const itemTotal = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(item.totalPrice);
              message += `• ${item.quantity}x ${item.name} - ${itemTotal}\n`;
            }
            message += `Subtotal: ${orderSubtotal}\n\n`;
          }
          
          message += `━━━━━━━━━━━━━━━━\n` +
            `💰 *TOTAL: ${formattedBillTotal}*\n` +
            `━━━━━━━━━━━━━━━━\n`;
          
          if (billPixCode) {
            message += `\n📱 *Pague via Pix:*\n` +
              `Copie o código abaixo e cole no seu app de banco:\n\n` +
              `\`\`\`${billPixCode}\`\`\`\n`;
          }
          
          message += `\nAgradecemos a preferência! 💚`;
        } else {
          message = `🧾 *Conta Fechada*\n\nObrigado pela preferência!`;
        }
        break;

      case "confirmed":
        // Order confirmation message with Pix payment option
        if (order.channel === "table" && tableNumber) {
          message = `✅ *Pedido Confirmado!*\n\n` +
            `Olá ${customerName}! Seu pedido *#${order.order_number}* na *Mesa ${tableNumber}* foi recebido!\n\n` +
            `💰 *Valor Total: ${formattedTotal}*\n`;
          
          if (pixCode) {
            message += `\n📱 *Pague via Pix:*\n` +
              `Copie o código abaixo e cole no seu app de banco:\n\n` +
              `\`\`\`${pixCode}\`\`\`\n`;
          }
          
          message += `\n⏱️ Tempo estimado: 15-20 min\n\n` +
            `Agradecemos a preferência! 💚`;
        } else if (order.channel === "delivery") {
          message = `✅ *Pedido Confirmado!*\n\n` +
            `Olá ${customerName}! Seu pedido *#${order.order_number}* foi recebido!\n\n` +
            `💰 *Valor Total: ${formattedTotal}*\n` +
            `📍 *Endereço:* ${deliveryAddress || "Conforme informado"}\n\n` +
            `⏱️ Tempo estimado: 30-45 min\n\n` +
            `Agradecemos a preferência! 💚`;
        } else {
          message = `✅ *Pedido Confirmado!*\n\n` +
            `Olá ${customerName}! Seu pedido *#${order.order_number}* foi recebido!\n\n` +
            `💰 *Valor Total: ${formattedTotal}*\n\n` +
            `⏱️ Tempo estimado: 15-20 min\n\n` +
            `Agradecemos a preferência! 💚`;
        }
        break;

      case "ready":
        if (order.channel === "table" && tableNumber) {
          // Mensagem especial para pedidos de mesa
          message = `🎉 *Olá ${customerName}!*\n\n` +
            `Seu pedido *#${order.order_number}* na *Mesa ${tableNumber}* está *PRONTO*! ✅\n\n` +
            `🍽️ Já estamos levando até você!\n\n` +
            `💰 *Valor Total: ${formattedTotal}*\n`;
          
          if (pixCode) {
            message += `\n📱 *Pague via Pix:*\n` +
              `Copie o código abaixo e cole no seu app de banco:\n\n` +
              `\`\`\`${pixCode}\`\`\`\n`;
          }
          
          message += `\nAgradecemos a preferência! 💚`;
        } else if (order.channel === "delivery") {
          message = `🎉 *Olá ${customerName}!*\n\n` +
            `Seu pedido *#${order.order_number}* está *PRONTO* e já está saindo para entrega! 🛵\n\n` +
            `📍 *Endereço:* ${deliveryAddress || "Conforme informado"}\n\n` +
            `💰 *Valor Total: ${formattedTotal}*\n`;
          
          if (pixCode) {
            message += `\n📱 *Pague via Pix:*\n` +
              `Copie o código abaixo e cole no seu app de banco:\n\n` +
              `\`\`\`${pixCode}\`\`\`\n`;
          }
          
          message += `\nEm breve chegará até você!\n` +
            `Agradecemos a preferência! 💚`;
        } else if (order.channel === "counter") {
          message = `🎉 *Olá ${customerName}!*\n\n` +
            `Seu pedido *#${order.order_number}* está *PRONTO*! ✅\n\n` +
            `💰 *Valor Total: ${formattedTotal}*\n`;
          
          if (pixCode) {
            message += `\n📱 *Pague via Pix:*\n` +
              `Copie o código abaixo e cole no seu app de banco:\n\n` +
              `\`\`\`${pixCode}\`\`\`\n`;
          }
          
          message += `\nVocê já pode retirar no balcão.\n` +
            `Agradecemos a preferência! 💚`;
        } else {
          message = `🎉 *Olá ${customerName}!*\n\n` +
            `Seu pedido *#${order.order_number}* está *PRONTO*! ✅\n\n` +
            `💰 *Valor Total: ${formattedTotal}*\n`;
          
          if (pixCode) {
            message += `\n📱 *Pague via Pix:*\n` +
              `Copie o código abaixo e cole no seu app de banco:\n\n` +
              `\`\`\`${pixCode}\`\`\`\n`;
          }
          
          message += `\nAgradecemos a preferência! 💚`;
        }
        break;

      case "delivering":
        message = `🛵 *Olá ${customerName}!*\n\n` +
          `Seu pedido *#${order.order_number}* saiu para entrega!\n\n` +
          `📍 Endereço: ${deliveryAddress || "Conforme informado"}\n\n` +
          `Fique atento, nosso entregador está a caminho! 🏃`;
        break;

      case "delivered":
        message = `✅ *Pedido Entregue!*\n\n` +
          `Olá ${customerName}, seu pedido *#${order.order_number}* foi entregue com sucesso!\n\n` +
          `💚 Obrigado pela preferência!\n` +
          `Esperamos que aproveite! 😋`;
        break;

      case "cancelled":
        message = `❌ *Pedido Cancelado*\n\n` +
          `Olá ${customerName}, informamos que seu pedido *#${order.order_number}* foi cancelado.\n\n` +
          `Se você não solicitou o cancelamento ou tem alguma dúvida, por favor entre em contato conosco.\n\n` +
          `Pedimos desculpas pelo inconveniente. 🙏`;
        break;
    }

    // Format phone number for WhatsApp (apenas dígitos, sem sufixo @s.whatsapp.net)
    let phone = order.customer_phone.replace(/\D/g, "");
    if (!phone.startsWith("55")) {
      phone = "55" + phone;
    }

    // Send message via Evolution API
    const cleanApiUrl = settings.api_url.replace(/\/+$/, "");
    const sendEndpoint = `${cleanApiUrl}/message/sendText/${settings.instance_name}`;

    console.log("Sending notification to:", phone);
    console.log("Endpoint:", sendEndpoint);

    const response = await fetch(sendEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: settings.api_token,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });

    const responseText = await response.text();
    console.log("Evolution API response:", response.status, responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Falha ao enviar mensagem",
          details: responseText,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificação enviada com sucesso",
        phone: phone,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Notification error:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro ao enviar notificação";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
