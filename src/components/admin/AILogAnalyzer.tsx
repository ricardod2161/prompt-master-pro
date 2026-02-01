import { useState } from "react";
import { useLogAnalysis, LogAnalysisResult, LogIssue } from "@/hooks/useLogAnalysis";
import { AdminLog } from "@/hooks/useAdminLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AILogAnalyzerProps {
  logs: AdminLog[];
}

const healthConfig = {
  ok: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    label: "Sistema Saudável",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    label: "Atenção Necessária",
  },
  critical: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    label: "Situação Crítica",
  },
};

const severityConfig = {
  info: { color: "text-blue-500", bgColor: "bg-blue-500/10" },
  warning: { color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  error: { color: "text-red-500", bgColor: "bg-red-500/10" },
};

export function AILogAnalyzer({ logs }: AILogAnalyzerProps) {
  const { analyzeLogs, clearAnalysis, isAnalyzing, analysisResult } = useLogAnalysis();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAnalyze = () => {
    analyzeLogs(logs, "general");
  };

  if (!analysisResult) {
    return (
      <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Análise Inteligente de Logs</h3>
                <p className="text-sm text-muted-foreground">
                  Use IA para identificar padrões e sugerir correções
                </p>
              </div>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || logs.length === 0}
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Analisar com IA
                </>
              )}
            </Button>
          </div>
          {logs.length === 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Nenhum log disponível para análise
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const health = healthConfig[analysisResult.health_status];
  const HealthIcon = health.icon;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={cn("border-2", health.borderColor)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", health.bgColor)}>
                <HealthIcon className={cn("h-5 w-5", health.color)} />
              </div>
              <div>
                <span className={health.color}>{health.label}</span>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                  {analysisResult.health_summary}
                </p>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearAnalysis}>
                Nova Análise
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Stats badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="gap-1">
              <span className="text-muted-foreground">Analisados:</span>
              {analysisResult.stats.total_analyzed}
            </Badge>
            {analysisResult.stats.errors_count > 0 && (
              <Badge variant="outline" className="gap-1 text-red-500 border-red-500/30">
                <XCircle className="h-3 w-3" />
                {analysisResult.stats.errors_count} erros
              </Badge>
            )}
            {analysisResult.stats.warnings_count > 0 && (
              <Badge variant="outline" className="gap-1 text-yellow-500 border-yellow-500/30">
                <AlertTriangle className="h-3 w-3" />
                {analysisResult.stats.warnings_count} avisos
              </Badge>
            )}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Issues */}
            {analysisResult.issues.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Problemas Identificados ({analysisResult.issues.length})
                </h4>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-3">
                    {analysisResult.issues.map((issue, index) => (
                      <IssueCard key={index} issue={issue} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Patterns */}
            {analysisResult.patterns && analysisResult.patterns.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Padrões Observados
                </h4>
                <ul className="space-y-1">
                  {analysisResult.patterns.map((pattern, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary">•</span>
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysisResult.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Recomendações
                </h4>
                <ul className="space-y-2">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="text-sm bg-muted/50 rounded-lg p-3 flex items-start gap-2"
                    >
                      <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.issues.length === 0 &&
              analysisResult.recommendations.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Nenhum problema identificado nos logs analisados</p>
                </div>
              )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function IssueCard({ issue }: { issue: LogIssue }) {
  const severity = severityConfig[issue.severity];
  const [showFix, setShowFix] = useState(false);

  return (
    <div className={cn("rounded-lg border p-3", severity.bgColor, "border-transparent")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", severity.color)}>
              {issue.severity === "error"
                ? "Erro"
                : issue.severity === "warning"
                ? "Aviso"
                : "Info"}
            </Badge>
            {issue.affected_area && (
              <Badge variant="secondary" className="text-xs">
                {issue.affected_area}
              </Badge>
            )}
            {issue.occurrences && issue.occurrences > 1 && (
              <span className="text-xs text-muted-foreground">
                ({issue.occurrences}x)
              </span>
            )}
          </div>
          <p className="font-medium mt-1">{issue.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{issue.description}</p>
        </div>
      </div>

      <Collapsible open={showFix} onOpenChange={setShowFix}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="mt-2 gap-1 h-7 text-xs">
            <Lightbulb className="h-3 w-3" />
            {showFix ? "Ocultar solução" : "Ver solução sugerida"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 p-2 rounded bg-background/50 text-sm">
            <span className="font-medium text-primary">Sugestão:</span>{" "}
            {issue.suggested_fix}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
