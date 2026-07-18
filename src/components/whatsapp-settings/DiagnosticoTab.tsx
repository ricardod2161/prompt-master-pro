import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import {
  BarChart3,
  Check,
  Loader2,
  Mic,
  MicOff,
  Radio,
  RefreshCw,
} from "lucide-react";

interface AudioLog {
  id: string;
  created_at: string;
  phone: string;
  failure_reason?: string | null;
  mimetype?: string | null;
  file_size?: number | null;
  status: string;
  retry_count?: number | null;
  audio_base64?: string | null;
  transcription_result?: string | null;
}

interface AudioHistoryEntry {
  date: string;
  success: number;
  failed: number;
}

interface TodayStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

interface DiagnosticoTabProps {
  audioLogs: AudioLog[];
  audioHistory: AudioHistoryEntry[];
  todayStats: TodayStats;
  loadingAudioLogs: boolean;
  retryingId: string | null;
  isRetryPending: boolean;
  onRetry: (logId: string) => void | Promise<void>;
  maxRetryCount: number;
}

export function DiagnosticoTab({
  audioLogs,
  audioHistory,
  todayStats,
  loadingAudioLogs,
  retryingId,
  isRetryPending,
  onRetry,
  maxRetryCount,
}: DiagnosticoTabProps) {
  return (
    <div className="space-y-6">
      {/* Seção A — Estatísticas do dia */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayStats.total}</p>
                <p className="text-xs text-muted-foreground">Áudios hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-status-success/10 rounded-lg">
                <Check className="h-5 w-5 text-status-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-status-success">{todayStats.success}</p>
                <p className="text-xs text-muted-foreground">Com sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <MicOff className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{todayStats.failed}</p>
                <p className="text-xs text-muted-foreground">Falhas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Taxa sucesso</span>
              </div>
              <span className="text-sm font-bold">{todayStats.successRate}%</span>
            </div>
            <Progress value={todayStats.successRate} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Seção B — Logs em tempo real */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Logs em Tempo Real
            <Badge variant="outline" className="ml-auto text-xs">
              Últimas 48h — {audioLogs.length} registros
            </Badge>
          </CardTitle>
          <CardDescription>
            Falhas de transcrição de áudio. Use o botão Retry para tentar novamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingAudioLogs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : audioLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Mic className="h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhuma falha de transcrição nas últimas 48 horas 🎉</p>
            </div>
          ) : (
            <ScrollArea className="h-[360px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Horário</TableHead>
                    <TableHead className="text-xs">Telefone</TableHead>
                    <TableHead className="text-xs">Motivo</TableHead>
                    <TableHead className="text-xs">Mime</TableHead>
                    <TableHead className="text-xs">Tamanho</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audioLogs.map((log) => {
                    const maxRetriesReached = (log.retry_count ?? 0) >= maxRetryCount;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "HH:mm:ss dd/MM")}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {log.phone.replace(/\D/g, "").slice(-11)}
                        </TableCell>
                        <TableCell className="text-xs max-w-[140px] truncate">
                          {log.failure_reason || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.mimetype?.split("/")[1] || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.file_size
                            ? log.file_size > 1024 * 100
                              ? `${(log.file_size / 1024).toFixed(0)}KB`
                              : `${log.file_size}B`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {log.status === "success" ? (
                            <Badge className="text-xs bg-status-success/10 text-status-success border-0 hover:bg-status-success/20">
                              ✓ Sucesso
                            </Badge>
                          ) : log.status === "retried" ? (
                            <Badge className="text-xs bg-status-warning/10 text-status-warning border-0 hover:bg-status-warning/20">
                              ↻ Retried
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              ✗ Falha
                            </Badge>
                          )}
                          {(log.retry_count ?? 0) > 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ×{log.retry_count}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.status !== "success" && log.audio_base64 && (
                            maxRetriesReached ? (
                              <span className="text-xs text-muted-foreground italic">
                                Máx. atingido
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                disabled={retryingId === log.id || isRetryPending}
                                onClick={() => onRetry(log.id)}
                              >
                                {retryingId === log.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                                Retry
                              </Button>
                            )
                          )}
                          {log.transcription_result && (
                            <span
                              className="text-xs text-muted-foreground ml-1 max-w-[120px] truncate block text-right"
                              title={log.transcription_result}
                            >
                              "{log.transcription_result.substring(0, 30)}…"
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Seção C — Histórico 7 dias */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Histórico — Últimos 7 Dias
          </CardTitle>
          <CardDescription>
            Comparativo de transcrições com sucesso vs falhas por dia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audioHistory.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Sem dados históricos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={audioHistory} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => format(new Date(v + "T12:00:00"), "dd/MM")}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value, name) => [value, name === "success" ? "Sucesso" : "Falhas"]}
                  labelFormatter={(label) => format(new Date(label + "T12:00:00"), "dd/MM/yyyy")}
                />
                <Legend formatter={(v) => (v === "success" ? "Sucesso" : "Falhas")} />
                <Bar dataKey="success" fill="hsl(var(--status-success))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
