import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { table_id, amount, customer_name, customer_phone, payment_method, split_type, split_details } = body ?? {};

    if (!table_id || !UUID_RE.test(table_id)) return json({ error: "tableId inválido" }, 400);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0 || amt > 100000) return json({ error: "Valor inválido" }, 400);
    const phone = String(customer_phone ?? "").replace(/\D/g, "");
    if (phone.length < 10 || phone.length > 15) return json({ error: "Telefone inválido" }, 400);
    const name = String(customer_name ?? "Cliente").trim().substring(0, 100).replace(/[<>]/g, "");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: table, error: tErr } = await admin
      .from("tables")
      .select("id, unit_id")
      .eq("id", table_id)
      .maybeSingle();
    if (tErr || !table) return json({ error: "Mesa não encontrada" }, 404);

    // Rate limit: max 15 payments per phone per hour
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await admin
      .from("bill_payments")
      .select("id", { count: "exact", head: true })
      .eq("customer_phone", phone)
      .gte("created_at", since);
    if ((count ?? 0) >= 15) return json({ error: "Muitos pagamentos recentes. Aguarde." }, 429);

    const allowedMethods = new Set(["pix", "cash", "credit", "debit"]);
    const pm = allowedMethods.has(String(payment_method)) ? String(payment_method) : "pix";
    const allowedSplit = new Set(["equal", "by_order", "custom"]);
    const st = allowedSplit.has(String(split_type)) ? String(split_type) : "equal";

    const { data, error } = await admin
      .from("bill_payments")
      .insert({
        table_id,
        unit_id: table.unit_id,
        amount: amt,
        customer_name: name,
        customer_phone: phone,
        payment_method: pm,
        split_type: st,
        split_details: split_details ?? {},
      })
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);

    return json({ payment: data });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
