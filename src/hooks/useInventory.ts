import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type InventoryItem = Tables<"inventory_items">;
export type InventoryMovement = Tables<"inventory_movements">;
export type InventoryMovementType = Enums<"inventory_movement_type">;

export function useInventory() {
  const { selectedUnit } = useUnit();

  return useQuery({
    queryKey: ["inventory", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return [];

      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .order("name");

      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!selectedUnit?.id,
  });
}

export function useInventoryMovements(itemId?: string) {
  return useQuery({
    queryKey: ["inventory-movements", itemId],
    queryFn: async () => {
      if (!itemId) return [];

      const { data, error } = await supabase
        .from("inventory_movements")
        .select("*")
        .eq("inventory_item_id", itemId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as InventoryMovement[];
    },
    enabled: !!itemId,
  });
}

export function useCreateInventoryItem() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      name: string;
      unit_measure: string;
      current_stock?: number;
      min_stock?: number;
      cost_per_unit?: number;
    }) => {
      if (!selectedUnit?.id) throw new Error("No unit selected");

      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          unit_id: selectedUnit.id,
          ...item,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Insumo criado com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar insumo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<InventoryItem> & { id: string }) => {
      const { error } = await supabase
        .from("inventory_items")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Insumo atualizado!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar insumo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAddInventoryMovement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      type,
      quantity,
      notes,
    }: {
      itemId: string;
      type: InventoryMovementType;
      quantity: number;
      notes?: string;
    }) => {
      // Get current stock
      const { data: item } = await supabase
        .from("inventory_items")
        .select("current_stock")
        .eq("id", itemId)
        .single();

      if (!item) throw new Error("Item not found");

      const previousStock = item.current_stock;
      const isSubtraction = ["sale", "waste", "transfer"].includes(type);
      const newStock = isSubtraction
        ? previousStock - quantity
        : previousStock + quantity;

      // Create movement
      const { error: movementError } = await supabase
        .from("inventory_movements")
        .insert({
          inventory_item_id: itemId,
          type,
          quantity,
          previous_stock: previousStock,
          new_stock: newStock,
          notes,
          created_by: user?.id,
        });

      if (movementError) throw movementError;

      // Update stock
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({ current_stock: newStock })
        .eq("id", itemId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      toast({ title: "Movimentação registrada!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar movimentação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Insumo removido!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover insumo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
