import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type DeliveryDriver = Tables<"delivery_drivers">;
export type DeliveryOrder = Tables<"delivery_orders">;

export function useDeliveryDrivers() {
  const { selectedUnit } = useUnit();

  return useQuery({
    queryKey: ["delivery-drivers", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return [];

      const { data, error } = await supabase
        .from("delivery_drivers")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .eq("active", true)
        .order("name");

      if (error) throw error;
      return data as DeliveryDriver[];
    },
    enabled: !!selectedUnit?.id,
  });
}

export function useCreateDriver() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (driver: {
      name: string;
      phone?: string;
      vehicle?: string;
    }) => {
      if (!selectedUnit?.id) throw new Error("No unit selected");

      const { data, error } = await supabase
        .from("delivery_drivers")
        .insert({
          unit_id: selectedUnit.id,
          ...driver,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-drivers"] });
      toast({ title: "Entregador cadastrado!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar entregador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<DeliveryDriver> & { id: string }) => {
      const { error } = await supabase
        .from("delivery_drivers")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-drivers"] });
      toast({ title: "Entregador atualizado!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar entregador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      driverId,
      address,
    }: {
      orderId: string;
      driverId: string;
      address: string;
    }) => {
      // Check if delivery order exists
      const { data: existing } = await supabase
        .from("delivery_orders")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("delivery_orders")
          .update({
            driver_id: driverId,
            dispatch_time: new Date().toISOString(),
          })
          .eq("order_id", orderId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from("delivery_orders").insert({
          order_id: orderId,
          driver_id: driverId,
          address,
          dispatch_time: new Date().toISOString(),
        });

        if (error) throw error;
      }

      // Update order status
      await supabase
        .from("orders")
        .update({ status: "ready" })
        .eq("id", orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      toast({ title: "Entregador atribuído!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atribuir entregador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMarkReady() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "ready" })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      toast({ title: "Pedido pronto para entrega!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao marcar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMarkDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // Tenta atualizar delivery_orders SE existir
      const { data: existing } = await supabase
        .from("delivery_orders")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("delivery_orders")
          .update({ delivery_time: new Date().toISOString() })
          .eq("order_id", orderId);
      }

      // Sempre atualiza o status do pedido
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "delivered" })
        .eq("id", orderId);

      if (orderError) throw orderError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      toast({ title: "Entrega confirmada!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao confirmar entrega",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
