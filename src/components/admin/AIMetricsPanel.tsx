import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot,
  CheckCircle2,
  XCircle,
  Zap,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AILog {
  id: string;
  created_at: string;
  function_name: string;
  provider: string;
  model: string | null;
  status: string;
  http_status: number | null;
  duration_ms: number | null;
  total_tokens: number | null;
  estimated_cost_usd: number | null;
  credits_debited: number | null;
  system_slug: string | null;
  fallback_used: boolean;
  error_message: string | null;
}

const PROVIDER_COLORS: Record<string, string> = {
  lovable: "hsl(var(--primary))",
  openai: "hsl(24 100% 50%)",
};

export function AIMetricsPanel() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["ai-provider-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_provider_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as AILog[];
    },
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const items = logs ?? [];
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const inLast24h = items.filter((l) => new Date(l.created_at).getTime() > dayAgo);
  const inLast30d = items.filter((l) => new Date(l.created_at).getTime() > monthAgo);

  const totalRequests = items.length;
  const totalErrors = items.filter((l) => l.status === "error").length;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  const fallbackCount = items.filter((l) => l.fallback_used && l.status === "success").length;

  const costToday = inLast24h.reduce((sum, l) => sum + (Number(l.estimated_cost_usd) || 0), 0);
  const costMonth = inLast30d.reduce((sum, l) => sum + (Number(l.estimated_cost_usd) || 0), 0);
  const tokensToday = inLast24h.reduce((sum, l) => sum + (Number(l.total_tokens) || 0), 0);

  const avgDuration =
    items.filter((l) => l.duration_ms).length > 0
      ? Math.round(
          items.filter((l) => l.duration_ms).reduce((s, l) => s + (l.duration_ms || 0), 0) /
            items.filter((l) => l.duration_ms).length
        )
      : 0;

  // Requests por provedor
  const byProvider = items.reduce<Record<string, { success: number; error: number }>>((acc, l) => {
    if (!acc[l.provider]) acc[l.provider] = { success: 0, error: 0 };
    if (l.status === "success") acc[l.provider].success++;
    else acc[l.provider].error++;
    return acc;
  }, {});

  const providerChartData = Object.entries(byProvider).map(([provider, stats]) => ({
    provider: provider === "lovable" ? "Lovable AI" : "OpenAI",
    key: provider,
    Sucesso: stats.success,
    Erro: stats.error,
  }));

  const pieData = Object.entries(byProvider).map(([provider, stats]) => ({
    name: provider === "lovable" ? "Lovable AI" : "OpenAI",
    value: stats.success + stats.error,
    key: provider,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Bot className="h-4 w-4" />}
          label="Requisições (total)"
          value={totalRequests.toString()}
          subtitle={`${inLast24h.length} nas últimas 24h`}
        />
        <MetricCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Custo estimado (30d)"
          value={`$${costMonth.toFixed(4)}`}
          subtitle={`$${costToday.toFixed(4)} hoje`}
          tone="success"
        />
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Latência média"
          value={`${avgDuration} ms`}
          subtitle={`${tokensToday.toLocaleString()} tokens hoje`}
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Taxa de erro"
          value={`${errorRate.toFixed(1)}%`}
          subtitle={`${fallbackCount} fallbacks OpenAI`}
          tone={errorRate > 10 ? "danger" : errorRate > 5 ? "warning" : "success"}
        />
      </div>

      {/* Gráficos */}
      {providerChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Requisições por Provedor
              </CardTitle>
              <CardDescription>Sucesso vs Erro em cada plataforma de IA</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={providerChartData}>
                  <XAxis dataKey="provider" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Sucesso" fill="hsl(142 76% 36%)" />
                  <Bar dataKey="Erro" fill="hsl(0 84% 60%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Distribuição de Uso
              </CardTitle>
              <CardDescription>Percentual de tráfego por provedor</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={PROVIDER_COLORS[entry.key] || "#888"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de logs recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas 50 chamadas</CardTitle>
          <CardDescription>
            Atualiza a cada 15 segundos • Verde = sucesso • Vermelho = erro • Laranja = fallback OpenAI ativado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Duração</TableHead>
                  <TableHead className="text-right">Custo (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.slice(0, 50).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{log.function_name}</TableCell>
                    <TableCell>
                      <Badge variant={log.provider === "openai" ? "destructive" : "secondary"}>
                        {log.provider === "lovable" ? "Lovable" : "OpenAI"}
                        {log.fallback_used && " ↩"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{log.model ?? "—"}</TableCell>
                    <TableCell>
                      {log.status === "success" ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle2 className="h-3 w-3" /> OK
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-red-600 text-xs"
                          title={log.error_message ?? ""}
                        >
                          <XCircle className="h-3 w-3" /> {log.http_status ?? "err"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {log.total_tokens?.toLocaleString() ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {log.duration_ms ? `${log.duration_ms}ms` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {log.estimated_cost_usd
                        ? `$${Number(log.estimated_cost_usd).toFixed(6)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma chamada de IA registrada ainda. Use qualquer feature de IA para popular esta lista.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    default: "border-border",
    success: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    danger: "border-red-500/30 bg-red-500/5",
  }[tone];

  return (
    <Card className={toneClasses}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}
