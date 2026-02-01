import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLog } from "./useAdminLogs";

export interface LogIssue {
  title: string;
  description: string;
  severity: "info" | "warning" | "error";
  affected_area?: string;
  suggested_fix: string;
  occurrences?: number;
}

export interface LogAnalysisResult {
  health_status: "ok" | "warning" | "critical";
  health_summary: string;
  issues: LogIssue[];
  patterns: string[];
  recommendations: string[];
  stats: {
    total_analyzed: number;
    errors_count: number;
    warnings_count: number;
    info_count: number;
  };
}

export function useLogAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LogAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeLogs = async (logs: AdminLog[], analysisType: string = "general") => {
    if (logs.length === 0) {
      toast.error("Nenhum log disponível para análise");
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-logs", {
        body: { logs, analysisType },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success && data?.analysis) {
        setAnalysisResult(data.analysis);
        toast.success("Análise concluída com sucesso!");
        return data.analysis as LogAnalysisResult;
      }

      throw new Error("Resposta inválida da análise");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao analisar logs";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return {
    analyzeLogs,
    clearAnalysis,
    isAnalyzing,
    analysisResult,
    error,
  };
}
