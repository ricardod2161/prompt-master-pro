import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface PixTransaction {
  id: string;
  unit_id: string;
  order_id: string | null;
  table_id: string | null;
  transaction_id: string;
  pix_code: string;
  amount: number;
  status: "pending" | "confirmed" | "expired" | "cancelled";
  customer_phone: string | null;
  customer_name: string | null;
  generated_at: string;
  confirmed_at: string | null;
  expires_at: string;
  metadata: Record<string, unknown>;
}

export function usePixTransactions(filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pix-transactions", selectedUnit?.id, filters],
    queryFn: async () => {
      if (!selectedUnit) return [];

      let q = supabase
        .from("pix_transactions")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .order("generated_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        q = q.eq("status", filters.status);
      }
      if (filters?.startDate) {
        q = q.gte("generated_at", filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        q = q.lte("generated_at", filters.endDate.toISOString());
      }

      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data || []) as PixTransaction[];
    },
    enabled: !!selectedUnit,
  });

  // Realtime subscription
  useEffect(() => {
    if (!selectedUnit) return;

    const channel = supabase
      .channel(`pix-transactions-${selectedUnit.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pix_transactions",
          filter: `unit_id=eq.${selectedUnit.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["pix-transactions", selectedUnit.id],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUnit?.id, queryClient]);

  const confirmMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from("pix_transactions")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pix-transactions"] });
      toast({ title: "Pix confirmado", description: "Pagamento marcado como recebido." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from("pix_transactions")
        .update({ status: "cancelled" })
        .eq("id", transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pix-transactions"] });
      toast({ title: "Pix cancelado" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  // Stats
  const stats = {
    total: query.data?.length || 0,
    pending: query.data?.filter((t) => t.status === "pending").length || 0,
    confirmed: query.data?.filter((t) => t.status === "confirmed").length || 0,
    expired: query.data?.filter((t) => t.status === "expired").length || 0,
    totalAmount: query.data?.reduce((sum, t) => sum + t.amount, 0) || 0,
    confirmedAmount:
      query.data
        ?.filter((t) => t.status === "confirmed")
        .reduce((sum, t) => sum + t.amount, 0) || 0,
    conversionRate:
      query.data && query.data.length > 0
        ? (query.data.filter((t) => t.status === "confirmed").length /
            query.data.length) *
          100
        : 0,
  };

  return {
    transactions: query.data || [],
    isLoading: query.isLoading,
    stats,
    confirmTransaction: confirmMutation.mutateAsync,
    cancelTransaction: cancelMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    isCancelling: cancelMutation.isPending,
    refetch: query.refetch,
  };
}
