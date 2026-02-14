import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type OrderWithItems = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
};

export function useTableBill(tableId: string, unitId: string | undefined) {
  const queryClient = useQueryClient();
  const [closingBill, setClosingBill] = useState(false);
  const [billClosed, setBillClosed] = useState(false);

  // Fetch all active orders for this table
  const ordersQuery = useQuery({
    queryKey: ["table-bill", tableId],
    queryFn: async () => {
      if (!tableId) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(*)
        `)
        .eq("table_id", tableId)
        .in("status", ["pending", "preparing", "ready", "delivered"])
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as OrderWithItems[];
    },
    enabled: !!tableId,
    staleTime: 30 * 1000, // 30 seconds - orders can change frequently
    refetchInterval: 30 * 1000, // Auto refetch every 30 seconds
  });

  // Calculate totals
  const billTotal = useMemo(() => {
    return (ordersQuery.data || []).reduce((sum, order) => sum + order.total_price, 0);
  }, [ordersQuery.data]);

  const ordersCount = useMemo(() => {
    return (ordersQuery.data || []).length;
  }, [ordersQuery.data]);

  const itemsCount = useMemo(() => {
    return (ordersQuery.data || []).reduce((sum, order) => {
      return sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
  }, [ordersQuery.data]);

  // Close bill mutation
  const closeBillMutation = useMutation({
    mutationFn: async (customerPhone: string) => {
      if (!tableId || !unitId || ordersCount === 0) {
        throw new Error("Dados inválidos para fechar conta");
      }

      setClosingBill(true);

      // Get customer name from most recent order
      const orders = ordersQuery.data || [];
      const customerName = orders.find(o => o.customer_name)?.customer_name || "Cliente";

      // Call edge function to send consolidated bill via WhatsApp
      const { data, error } = await supabase.functions.invoke("send-order-notification", {
        body: {
          orderId: orders[0].id, // Use first order as reference
          status: "bill_close",
          unitId: unitId,
          billData: {
            orders: orders.map(order => ({
              orderNumber: order.order_number,
              createdAt: order.created_at,
              total: order.total_price,
              items: order.order_items.map(item => ({
                name: item.product_name,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                totalPrice: item.total_price,
              })),
            })),
            totalAmount: billTotal,
            customerName,
            customerPhone,
          },
        },
      });

      if (error) {
        console.error("Error sending bill notification:", error);
        // Don't throw - we still want to close the bill
      }

      // 1. Mark all orders as delivered (finalizes the session)
      const orderIds = orders.map(o => o.id);
      if (orderIds.length > 0) {
        const { error: ordersError } = await supabase
          .from("orders")
          .update({ status: "completed" as any })
          .in("id", orderIds);

        if (ordersError) {
          console.error("Error updating orders status:", ordersError);
          // Continue anyway - the main goal is to free the table
        }
      }

      // 2. Update table status to free
      const { error: tableError } = await supabase
        .from("tables")
        .update({ status: "free" })
        .eq("id", tableId);

      if (tableError) {
        console.error("Error updating table status:", tableError);
      }

      return { success: true, ordersCompleted: orderIds.length };
    },
    onSuccess: () => {
      setBillClosed(true);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["table-bill", tableId] });
    },
    onSettled: () => {
      setClosingBill(false);
    },
  });

  const closeBill = useCallback((customerPhone: string) => {
    if (!customerPhone || customerPhone.replace(/\D/g, "").length < 10) {
      throw new Error("Informe um telefone válido para receber a conta");
    }
    return closeBillMutation.mutateAsync(customerPhone);
  }, [closeBillMutation]);

  const resetBillState = useCallback(() => {
    setBillClosed(false);
  }, []);

  return {
    orders: ordersQuery.data || [],
    ordersLoading: ordersQuery.isLoading,
    ordersError: ordersQuery.error,
    billTotal,
    ordersCount,
    itemsCount,
    closeBill,
    closingBill,
    billClosed,
    resetBillState,
    refetchOrders: ordersQuery.refetch,
  };
}
