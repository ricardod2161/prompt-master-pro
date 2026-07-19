import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";

export interface ConfirmedPayment {
  payment_id: string;
  order_id: string;
  order_number: number;
  created_at: string;
  paid_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_price: number;
  amount_paid: number;
  method: string;
  order_status: string;
  transaction_id: string | null;
}

interface Options {
  start: Date;
  end: Date;
}

export function useConfirmedPayments({ start, end }: Options) {
  const { selectedUnit } = useUnit();

  return useQuery({
    queryKey: ["confirmed-payments", selectedUnit?.id, start.toISOString(), end.toISOString()],
    enabled: !!selectedUnit?.id,
    queryFn: async (): Promise<ConfirmedPayment[]> => {
      // 1. Payments in the period
      const { data: payments, error: payErr } = await supabase
        .from("order_payments")
        .select("id, order_id, method, amount, created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });
      if (payErr) throw payErr;
      if (!payments?.length) return [];

      const orderIds = Array.from(new Set(payments.map((p) => p.order_id)));

      // 2. Orders for those payments — scoped to unit + exclude cancelled
      const { data: orders, error: orderErr } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, total_price, status, created_at, unit_id")
        .in("id", orderIds)
        .eq("unit_id", selectedUnit!.id)
        .neq("status", "cancelled");
      if (orderErr) throw orderErr;

      const orderMap = new Map(orders?.map((o) => [o.id, o]) ?? []);

      // 3. Confirmed pix transactions to enrich transaction_id
      const { data: pixTx } = await supabase
        .from("pix_transactions")
        .select("order_id, transaction_id, status")
        .in("order_id", orderIds)
        .eq("status", "confirmed");
      const pixMap = new Map(pixTx?.map((t) => [t.order_id, t.transaction_id]) ?? []);

      return payments
        .filter((p) => orderMap.has(p.order_id))
        .map((p) => {
          const o = orderMap.get(p.order_id)!;
          return {
            payment_id: p.id,
            order_id: p.order_id,
            order_number: o.order_number,
            created_at: o.created_at,
            paid_at: p.created_at,
            customer_name: o.customer_name,
            customer_phone: o.customer_phone,
            total_price: Number(o.total_price),
            amount_paid: Number(p.amount),
            method: p.method,
            order_status: o.status ?? "",
            transaction_id: pixMap.get(p.order_id) ?? null,
          };
        });
    },
  });
}
