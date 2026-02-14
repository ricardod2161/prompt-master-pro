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

  // Fetch order data by tracking_token
  const orderQuery = useQuery({
    queryKey: ["order-tracking", token],
    queryFn: async () => {
      if (!token) return null;

      const { data: order, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          total_price,
          customer_name,
          channel,
          created_at,
          table_id,
          unit_id,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          ),
          tables (number)
        `)
        .eq("tracking_token", token)
        .maybeSingle();

      if (error) throw error;
      if (!order) return null;

      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_price: order.total_price,
        customer_name: order.customer_name,
        channel: order.channel,
        created_at: order.created_at,
        table_id: order.table_id,
        unit_id: order.unit_id,
        items: order.order_items || [],
        table_number: order.tables?.number || null,
      } as OrderData;
    },
    enabled: !!token,
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch unit settings (pix_key)
  const unitSettingsQuery = useQuery({
    queryKey: ["unit-settings-tracking", orderQuery.data?.unit_id],
    queryFn: async () => {
      if (!orderQuery.data?.unit_id) return null;

      const { data, error } = await supabase
        .from("unit_settings")
        .select("pix_key, pix_merchant_name, pix_merchant_city, currency")
        .eq("unit_id", orderQuery.data.unit_id)
        .maybeSingle();

      if (error) throw error;
      return data as UnitSettings | null;
    },
    enabled: !!orderQuery.data?.unit_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch unit info
  const unitInfoQuery = useQuery({
    queryKey: ["unit-info-tracking", orderQuery.data?.unit_id],
    queryFn: async () => {
      if (!orderQuery.data?.unit_id) return null;

      const { data, error } = await supabase
        .from("units")
        .select("id, name, address")
        .eq("id", orderQuery.data.unit_id)
        .maybeSingle();

      if (error) throw error;
      return data as UnitInfo | null;
    },
    enabled: !!orderQuery.data?.unit_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Subscribe to realtime updates using order id from fetched data
  useEffect(() => {
    if (!orderQuery.data?.id) return;

    const orderId = orderQuery.data.id;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as OrderStatus;
          setRealtimeStatus(newStatus);
          
          // Also invalidate the query to refresh full data
          queryClient.invalidateQueries({ queryKey: ["order-tracking", token] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderQuery.data?.id, token, queryClient]);

  // Get the most current status (prefer realtime, fallback to query)
  const currentStatus = realtimeStatus || orderQuery.data?.status || "pending";

  // Calculate progress percentage
  const getProgressPercentage = (status: OrderStatus): number => {
    switch (status) {
      case "pending":
        return 0;
      case "preparing":
        return 50;
      case "ready":
        return 100;
      case "delivered":
        return 100;
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  };

  // Get status label in Portuguese
  const getStatusLabel = (status: OrderStatus): string => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "preparing":
        return "Preparando";
      case "ready":
        return "Pronto";
      case "delivered":
        return "Entregue";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  return {
    order: orderQuery.data,
    isLoading: orderQuery.isLoading,
    error: orderQuery.error,
    currentStatus,
    progressPercentage: getProgressPercentage(currentStatus),
    statusLabel: getStatusLabel(currentStatus),
    unitSettings: unitSettingsQuery.data,
    unitInfo: unitInfoQuery.data,
    refetch: orderQuery.refetch,
  };
}
