import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderData {
  id: string;
  order_number: number;
  status: OrderStatus;
  total_price: number;
  customer_name: string | null;
  channel: string;
  created_at: string;
  table_id: string | null;
  unit_id: string;
  items: OrderItem[];
  table_number?: number | null;
}

interface UnitSettings {
  pix_key: string | null;
  pix_merchant_name: string | null;
  pix_merchant_city: string | null;
  currency: string | null;
}

interface UnitInfo {
  id: string;
  name: string;
  address: string | null;
}

export function useOrderTracking(token: string) {
  const queryClient = useQueryClient();
  const [realtimeStatus, setRealtimeStatus] = useState<OrderStatus | null>(null);

  const orderQuery = useQuery({
    queryKey: ["order-tracking", token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await supabase.functions.invoke("public-tracking", {
        body: { token },
      });
      if (error) throw error;
      return (data ?? null) as {
        order: OrderData | null;
        unitSettings: UnitSettings | null;
        unitInfo: UnitInfo | null;
        pix: { pix_code: string | null; amount: number | null; expires_at: string | null } | null;
      } | null;
    },
    enabled: !!token,
    staleTime: 1000 * 60,
  });

  const order = orderQuery.data?.order ?? null;

  useEffect(() => {
    if (!order?.id) return;
    const orderId = order.id;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          const newStatus = payload.new.status as OrderStatus;
          setRealtimeStatus(newStatus);
          queryClient.invalidateQueries({ queryKey: ["order-tracking", token] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, token, queryClient]);

  const currentStatus = realtimeStatus || order?.status || "pending";

  const getProgressPercentage = (status: OrderStatus): number => {
    switch (status) {
      case "pending": return 0;
      case "preparing": return 50;
      case "ready":
      case "delivered": return 100;
      case "cancelled": return 0;
      default: return 0;
    }
  };
  const getStatusLabel = (status: OrderStatus): string => {
    switch (status) {
      case "pending": return "Pendente";
      case "preparing": return "Preparando";
      case "ready": return "Pronto";
      case "delivered": return "Entregue";
      case "cancelled": return "Cancelado";
      default: return status;
    }
  };

  return {
    order,
    isLoading: orderQuery.isLoading,
    error: orderQuery.error,
    currentStatus,
    progressPercentage: getProgressPercentage(currentStatus),
    statusLabel: getStatusLabel(currentStatus),
    unitSettings: orderQuery.data?.unitSettings ?? null,
    unitInfo: orderQuery.data?.unitInfo ?? null,
    pix: orderQuery.data?.pix ?? null,
    refetch: orderQuery.refetch,
  };
}
