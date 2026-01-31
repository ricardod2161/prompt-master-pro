import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  orderId: string;
  status: "ready" | "delivering" | "delivered";
  unitId: string;
}

interface WhatsAppSettings {
  api_url: string;
  api_token: string;
  instance_name: string;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string | null;
  customer_phone: string | null;
  channel: string;
  total_price: number;
  delivery_order?: {
    address: string;
  } | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, status, unitId }: NotificationRequest = await req.json();

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

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customer_name,
        customer_phone,
        channel,
        total_price,
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
    let message = "";

    switch (status) {
      case "ready":
        if (order.channel === "delivery") {
          message = `🎉 *Olá ${customerName}!*\n\n` +
            `Seu pedido *#${order.order_number}* está *PRONTO* e já está saindo para entrega! 🛵\n\n` +
            `📍 Endereço: ${deliveryAddress || "Conforme informado"}\n\n` +
            `Em breve chegará até você!\n` +
            `Agradecemos a preferência! 💚`;
        } else if (order.channel === "counter") {
          message = `🎉 *Olá ${customerName}!*\n\n` +
            `Seu pedido *#${order.order_number}* está *PRONTO*! ✅\n\n` +
            `Você já pode retirar no balcão.\n` +
            `Agradecemos a preferência! 💚`;
        } else {
          message = `🎉 *Olá ${customerName}!*\n\n` +
            `Seu pedido *#${order.order_number}* está *PRONTO*! ✅\n\n` +
            `Agradecemos a preferência! 💚`;
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
    }

    // Format phone number for WhatsApp
    let phone = order.customer_phone.replace(/\D/g, "");
    if (!phone.startsWith("55")) {
      phone = "55" + phone;
    }
    const remoteJid = `${phone}@s.whatsapp.net`;

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
        number: remoteJid,
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
