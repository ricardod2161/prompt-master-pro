import { useState } from "react";
import { useAdminLogs, AdminLog } from "@/hooks/useAdminLogs";
import { AILogAnalyzer } from "./AILogAnalyzer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Clock,
  User,
  Building2,
  Activity,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const severityConfig = {
  info: {
    icon: Info,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    label: "Info",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    label: "Aviso",
  },
  error: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    label: "Erro",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    label: "Sucesso",
  },
};

const categoryLabels: Record<string, string> = {
  system: "Sistema",
  auth: "Autenticação",
  payment: "Pagamento",
  order: "Pedido",
  user: "Usuário",
  unit: "Unidade",
  whatsapp: "WhatsApp",
  inventory: "Estoque",
};

export function AdminActivityLogs() {
  const [category, setCategory] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { logs, loading, refetch } = useAdminLogs({
    category: category !== "all" ? category : undefined,
    severity: severity !== "all" ? severity : undefined,
    limit: 200,
  });

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower) ||
      log.category.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 flex-1" />
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Analysis */}
      <AILogAnalyzer logs={logs} />

      {/* Filters */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(severityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className={`h-3 w-3 ${config.color}`} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(severityConfig).map(([key, config]) => {
          const count = logs.filter((l) => l.severity === key).length;
          return (
            <Card
              key={key}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                severity === key && `border-2 ${config.borderColor}`
              )}
              onClick={() => setSeverity(severity === key ? "all" : key)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <config.icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Histórico de Atividades
            <Badge variant="secondary" className="ml-auto">
              {filteredLogs.length} registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="mx-auto h-12 w-12 opacity-50" />
                <h3 className="mt-4 text-lg font-medium">Nenhum log encontrado</h3>
                <p className="text-sm">
                  {search
                    ? "Tente ajustar os filtros de busca"
                    : "Os logs aparecerão aqui conforme o sistema é utilizado"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredLogs.map((log, index) => (
                  <LogItem key={log.id} log={log} index={index} />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function LogItem({ log, index }: { log: AdminLog; index: number }) {
  const config = severityConfig[log.severity] || severityConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "p-4 hover:bg-muted/50 transition-colors animate-fade-in",
        index < 5 && "border-l-2",
        index < 5 && config.borderColor.replace("border-", "border-l-")
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex gap-3">
        <div className={`p-2 rounded-lg ${config.bgColor} h-fit`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{log.action}</p>
              {log.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {log.description}
                </p>
              )}
            </div>
            <Badge
              variant="outline"
              className={cn("shrink-0", config.bgColor, config.color)}
            >
              {categoryLabels[log.category] || log.category}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span title={format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}>
                {formatDistanceToNow(new Date(log.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>

            {log.user_id && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{log.user_id.slice(0, 8)}...</span>
              </div>
            )}

            {log.unit_id && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>{log.unit_id.slice(0, 8)}...</span>
              </div>
            )}
          </div>

          {/* Metadata preview */}
          {Object.keys(log.metadata || {}).length > 0 && (
            <div className="mt-2 p-2 rounded bg-muted/50 text-xs font-mono overflow-x-auto">
              {JSON.stringify(log.metadata, null, 2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
