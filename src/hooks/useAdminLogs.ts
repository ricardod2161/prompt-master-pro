import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminLog {
  id: string;
  action: string;
  category: string;
  description: string | null;
  metadata: Record<string, any>;
  user_id: string | null;
  unit_id: string | null;
  severity: "info" | "warning" | "error" | "success";
  created_at: string;
}

interface LogFilters {
  category?: string;
  severity?: string;
  limit?: number;
}

export function useAdminLogs(filters: LogFilters = {}) {
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ["admin-logs", filters],
    queryFn: async (): Promise<AdminLog[]> => {
      let query = supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters.limit || 100);

      if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      if (filters.severity && filters.severity !== "all") {
        query = query.eq("severity", filters.severity);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AdminLog[];
    },
  });

  const createLogMutation = useMutation({
    mutationFn: async (log: {
      action: string;
      category?: string;
      description?: string;
      metadata?: Record<string, any>;
      severity?: "info" | "warning" | "error" | "success";
    }) => {
      const { error } = await supabase.from("admin_logs").insert({
        action: log.action,
        category: log.category || "system",
        description: log.description,
        metadata: log.metadata || {},
        severity: log.severity || "info",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
    },
  });

  return {
    logs: logsQuery.data || [],
    loading: logsQuery.isLoading,
    error: logsQuery.error,
    createLog: createLogMutation.mutate,
    refetch: logsQuery.refetch,
  };
}
