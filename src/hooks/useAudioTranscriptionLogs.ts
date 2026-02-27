import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { startOfDay, subDays, format } from "date-fns";

export interface AudioTranscriptionLog {
  id: string;
  unit_id: string;
  conversation_id: string | null;
  message_id: string | null;
  phone: string;
  status: "failed" | "retried" | "success";
  failure_reason: string | null;
  mimetype: string | null;
  file_size: number | null;
  transcription_result: string | null;
  retry_count: number;
  audio_base64: string | null;
  created_at: string;
  updated_at: string;
}

export interface DayStats {
  date: string;
  success: number;
  failed: number;
  total: number;
}

export interface TodayStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

export function useAudioTranscriptionLogs() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["audio-transcription-logs", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return [];

      // Last 48 hours for real-time feed
      const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("audio_transcription_logs")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data || []) as AudioTranscriptionLog[];
    },
    enabled: !!selectedUnit?.id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!selectedUnit?.id) return;

    const channel = supabase
      .channel("audio-transcription-logs-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "audio_transcription_logs",
          filter: `unit_id=eq.${selectedUnit.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["audio-transcription-logs", selectedUnit.id],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUnit?.id, queryClient]);

  return query;
}

export function useAudioTranscriptionHistory() {
  const { selectedUnit } = useUnit();

  return useQuery({
    queryKey: ["audio-transcription-history", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return [] as DayStats[];

      const since = subDays(startOfDay(new Date()), 6).toISOString();

      const { data, error } = await supabase
        .from("audio_transcription_logs")
        .select("status, created_at")
        .eq("unit_id", selectedUnit.id)
        .gte("created_at", since);

      if (error) throw error;

      // Group by day
      const dayMap: Record<string, DayStats> = {};
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        dayMap[d] = { date: d, success: 0, failed: 0, total: 0 };
      }

      for (const row of data || []) {
        const d = format(new Date(row.created_at), "yyyy-MM-dd");
        if (!dayMap[d]) continue;
        dayMap[d].total++;
        if (row.status === "success") dayMap[d].success++;
        else dayMap[d].failed++;
      }

      return Object.values(dayMap);
    },
    enabled: !!selectedUnit?.id,
  });
}

export function useRetryTranscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedUnit } = useUnit();

  return useMutation({
    mutationFn: async (logId: string) => {
      const { data, error } = await supabase.functions.invoke(
        "retry-audio-transcription",
        { body: { log_id: logId } }
      );
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Retry failed");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["audio-transcription-logs", selectedUnit?.id],
      });
      toast({
        title: "Transcrição realizada!",
        description: `Resultado: "${data.transcription?.substring(0, 80)}${data.transcription?.length > 80 ? "…" : ""}"`,
      });
    },
    onError: (error) => {
      queryClient.invalidateQueries({
        queryKey: ["audio-transcription-logs", selectedUnit?.id],
      });
      toast({
        variant: "destructive",
        title: "Falha no retry",
        description: (error as Error).message,
      });
    },
  });
}

export function computeTodayStats(logs: AudioTranscriptionLog[]): TodayStats {
  const todayStart = startOfDay(new Date()).toISOString();
  const today = logs.filter((l) => l.created_at >= todayStart);
  const success = today.filter((l) => l.status === "success").length;
  const failed = today.filter((l) => l.status !== "success").length;
  const total = today.length;
  return {
    total,
    success,
    failed,
    successRate: total > 0 ? Math.round((success / total) * 100) : 0,
  };
}
