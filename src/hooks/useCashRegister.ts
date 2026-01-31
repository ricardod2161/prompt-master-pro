import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type CashRegister = Tables<"cash_registers"> & {
  movements?: Tables<"cash_movements">[];
};

export type CashMovement = Tables<"cash_movements">;
export type CashMovementType = Enums<"cash_movement_type">;

export function useCashRegister() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cash-register", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("cash_registers")
        .select(`
          *,
          movements:cash_movements(*)
        `)
        .eq("unit_id", selectedUnit.id)
        .gte("opened_at", today.toISOString())
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CashRegister | null;
    },
    enabled: !!selectedUnit?.id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!selectedUnit?.id) return;

    const channel = supabase
      .channel("cash-register-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cash_registers",
          filter: `unit_id=eq.${selectedUnit.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["cash-register", selectedUnit.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUnit?.id, queryClient]);

  return query;
}

export function useOpenCashRegister() {
  const { selectedUnit } = useUnit();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (initialAmount: number) => {
      if (!selectedUnit?.id) throw new Error("No unit selected");

      const { data, error } = await supabase
        .from("cash_registers")
        .insert({
          unit_id: selectedUnit.id,
          initial_amount: initialAmount,
          opened_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create opening movement
      await supabase.from("cash_movements").insert({
        cash_register_id: data.id,
        type: "opening",
        amount: initialAmount,
        description: "Abertura de caixa",
        created_by: user?.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-register"] });
      toast({ title: "Caixa aberto com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao abrir caixa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCloseCashRegister() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      registerId,
      finalAmount,
      notes,
    }: {
      registerId: string;
      finalAmount: number;
      notes?: string;
    }) => {
      // Calculate expected amount from movements
      const { data: movements } = await supabase
        .from("cash_movements")
        .select("*")
        .eq("cash_register_id", registerId);

      const expectedAmount = movements?.reduce((sum, mov) => {
        if (mov.type === "withdrawal") return sum - mov.amount;
        return sum + mov.amount;
      }, 0) || 0;

      const { error } = await supabase
        .from("cash_registers")
        .update({
          closed_at: new Date().toISOString(),
          closed_by: user?.id,
          final_amount: finalAmount,
          expected_amount: expectedAmount,
          notes,
        })
        .eq("id", registerId);

      if (error) throw error;

      // Create closing movement
      await supabase.from("cash_movements").insert({
        cash_register_id: registerId,
        type: "closing",
        amount: finalAmount,
        description: "Fechamento de caixa",
        created_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-register"] });
      toast({ title: "Caixa fechado com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao fechar caixa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAddCashMovement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      registerId,
      type,
      amount,
      description,
    }: {
      registerId: string;
      type: CashMovementType;
      amount: number;
      description?: string;
    }) => {
      const { error } = await supabase.from("cash_movements").insert({
        cash_register_id: registerId,
        type,
        amount,
        description,
        created_by: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-register"] });
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
