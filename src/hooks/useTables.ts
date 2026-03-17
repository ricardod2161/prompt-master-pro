import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import { useEffect } from "react";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type Table = Tables<"tables">;
export type TableStatus = Enums<"table_status">;

export function useTables() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tables", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return [];

      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .order("number");

      if (error) throw error;
      return data as Table[];
    },
    enabled: !!selectedUnit?.id,
  });

  // Realtime subscription — scoped per unit to avoid cross-unit conflicts
  useEffect(() => {
    if (!selectedUnit?.id) return;

    const channel = supabase
      .channel(`tables-realtime-${selectedUnit.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
          filter: `unit_id=eq.${selectedUnit.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tables", selectedUnit?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUnit?.id, queryClient]);

  return query;
}

export function useCreateTable() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ number, capacity = 4, silent = false }: { number: number; capacity?: number; silent?: boolean }) => {
      if (!selectedUnit?.id) throw new Error("No unit selected");

      const { data, error } = await supabase
        .from("tables")
        .insert({
          unit_id: selectedUnit.id,
          number,
          status: "free",
          capacity,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, silent };
    },
    onSuccess: (result) => {
      queryClient.refetchQueries({ queryKey: ["tables"] });
      if (!result.silent) {
        toast({ title: "Mesa criada com sucesso!" });
      }
    },
    onError: (error, variables) => {
      if (!(variables as any).silent) {
        toast({
          title: "Erro ao criar mesa",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tableId,
      status,
    }: {
      tableId: string;
      status: TableStatus;
    }) => {
      const { error } = await supabase
        .from("tables")
        .update({ status })
        .eq("id", tableId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["tables"] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tableId: string) => {
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", tableId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["tables"] });
      toast({ title: "Mesa removida!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover mesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useGenerateQRCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tableId: string) => {
      const qrCode = `${window.location.origin}/order/${tableId}`;

      const { error } = await supabase
        .from("tables")
        .update({ qr_code: qrCode })
        .eq("id", tableId);

      if (error) throw error;
      return qrCode;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["tables"] });
      toast({ title: "QR Code gerado!" });
    },
  });
}
