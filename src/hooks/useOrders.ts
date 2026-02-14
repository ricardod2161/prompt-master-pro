import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import { useEffect } from "react";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type Order = Tables<"orders"> & {
  order_items?: Tables<"order_items">[];
  order_payments?: Tables<"order_payments">[];
  table?: Tables<"tables"> | null;
  delivery_order?: Tables<"delivery_orders"> | null;
};

export type OrderItem = Tables<"order_items">;
export type OrderStatus = Enums<"order_status">;
export type OrderChannel = Enums<"order_channel">;
export type KitchenStatus = Enums<"kitchen_status">;
export type PaymentMethod = Enums<"payment_method">;

interface CreateOrderData {
  channel: OrderChannel;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  table_id?: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
  payments: {
    method: PaymentMethod;
    amount: number;
  }[];
}

export function useOrders(filters?: {
  status?: OrderStatus;
  channel?: OrderChannel;
  date?: Date;
}) {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["orders", selectedUnit?.id, filters],
    queryFn: async () => {
      if (!selectedUnit?.id) return [];

      let q = supabase
        .from("orders")
        .select(`
          *,
          order_items(*),
          order_payments(*),
          table:tables(*),
          delivery_order:delivery_orders(*)
        `)
        .eq("unit_id", selectedUnit.id)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        q = q.eq("status", filters.status);
      }
      if (filters?.channel) {
        q = q.eq("channel", filters.channel);
      }
      if (filters?.date) {
        const start = new Date(filters.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.date);
        end.setHours(23, 59, 59, 999);
        q = q.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!selectedUnit?.id,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Realtime subscription
  useEffect(() => {
    if (!selectedUnit?.id) return;

    const channel = supabase
      .channel(`orders-realtime-${selectedUnit.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `unit_id=eq.${selectedUnit.id}`,
        },
        () => {
          queryClient.refetchQueries({ queryKey: ["orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUnit?.id, queryClient]);

  return query;
}

export function useCreateOrder() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      if (!selectedUnit?.id) throw new Error("No unit selected");

      const totalPrice = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          unit_id: selectedUnit.id,
          channel: data.channel,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          notes: data.notes,
          table_id: data.table_id,
          total_price: totalPrice,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = data.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        notes: item.notes,
        kitchen_status: "pending" as KitchenStatus,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create payments
      const payments = data.payments.map((payment) => ({
        order_id: order.id,
        method: payment.method,
        amount: payment.amount,
      }));

      const { error: paymentsError } = await supabase
        .from("order_payments")
        .insert(payments);

      if (paymentsError) throw paymentsError;

      // Update table status if table order
      if (data.table_id) {
        await supabase
          .from("tables")
          .update({ status: "occupied" })
          .eq("id", data.table_id);
      }

      return order;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["orders"] });
      toast({ title: "Pedido criado com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateKitchenStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      status,
    }: {
      itemId: string;
      status: KitchenStatus;
    }) => {
      const { error } = await supabase
        .from("order_items")
        .update({ kitchen_status: status })
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      newMethod,
    }: {
      orderId: string;
      newMethod: PaymentMethod;
    }) => {
      const { error } = await supabase
        .from("order_payments")
        .update({ method: newMethod })
        .eq("order_id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["orders"] });
      toast({ title: "Forma de pagamento atualizada!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      await supabase.from("order_items").delete().eq("order_id", orderId);
      await supabase.from("order_payments").delete().eq("order_id", orderId);
      await supabase.from("delivery_orders").delete().eq("order_id", orderId);
      const { error } = await supabase.from("orders").delete().eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["orders"] });
      toast({ title: "Pedido excluído com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
