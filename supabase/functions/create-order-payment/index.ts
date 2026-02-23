import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, unitId } = await req.json();

    if (!orderId || !unitId) {
      return new Response(
        JSON.stringify({ error: "orderId e unitId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch order with items - validate ownership via unit_id match
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id, order_number, total_price, customer_name, customer_phone, unit_id,
        order_items (product_name, quantity, unit_price, total_price)
      `)
      .eq("id", orderId)
      .eq("unit_id", unitId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({ error: "Pedido não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Additional validation: only allow payment for recent, non-cancelled orders
    if (order.total_price <= 0) {
      return new Response(
        JSON.stringify({ error: "Pedido com valor inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unit name for product description
    const { data: unit } = await supabase
      .from("units")
      .select("name")
      .eq("id", unitId)
      .single();

    const unitName = unit?.name || "Restaurante";

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Build line items from order items
    const lineItems = (order.order_items || []).map((item: any) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.product_name,
          description: `Pedido #${order.order_number} - ${unitName}`,
        },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.quantity,
    }));

    if (lineItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Pedido sem itens" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const origin = req.headers.get("origin") || "https://restauranteos.lovable.app";

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/track/${order.id}?paid=true`,
      cancel_url: `${origin}/track/${order.id}`,
      metadata: {
        order_id: order.id,
        order_number: String(order.order_number),
        unit_id: unitId,
      },
    });

    console.log(`[CREATE-ORDER-PAYMENT] Session created for order #${order.order_number}: ${session.id}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-ORDER-PAYMENT] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
