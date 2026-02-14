import { useState, useMemo } from "react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  QrCode,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Search,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePixTransactions, type PixTransaction } from "@/hooks/usePixTransactions";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

type DateRange = "today" | "week" | "month" | "all";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", icon: Clock, color: "text-amber-500", badgeVariant: "outline" },
  confirmed: { label: "Confirmado", icon: CheckCircle2, color: "text-emerald-500", badgeVariant: "default" },
  expired: { label: "Expirado", icon: AlertTriangle, color: "text-muted-foreground", badgeVariant: "secondary" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "text-destructive", badgeVariant: "destructive" },
};

export function PixTransactionsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [customDate, setCustomDate] = useState<Date | undefined>();

  const dateFilter = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "today": return { startDate: startOfDay(now), endDate: endOfDay(now) };
      case "week": return { startDate: startOfDay(subDays(now, 7)), endDate: endOfDay(now) };
      case "month": return { startDate: startOfDay(subDays(now, 30)), endDate: endOfDay(now) };
      case "all": return {};
      default: return {};
    }
  }, [dateRange]);

  const { transactions, isLoading, stats, confirmTransaction, isConfirming } = usePixTransactions({
    status: statusFilter,
    ...dateFilter,
  });

  const filteredTransactions = useMemo(() => {
    if (!search) return transactions;
    const term = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.transaction_id.toLowerCase().includes(term) ||
        t.customer_name?.toLowerCase().includes(term) ||
        t.customer_phone?.includes(term)
    );
  }, [transactions, search]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (isLoading) return <LoadingSkeleton variant="card" count={4} />;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pix Gerados</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.totalAmount)} total</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.confirmedAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">confirmados / gerados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {(["today", "week", "month", "all"] as DateRange[]).map((range) => (
          <Button
            key={range}
            size="sm"
            variant={dateRange === range ? "default" : "outline"}
            onClick={() => setDateRange(range)}
          >
            {range === "today" ? "Hoje" : range === "week" ? "7 dias" : range === "month" ? "30 dias" : "Todos"}
          </Button>
        ))}
        <div className="flex-1" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-[200px]"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {filteredTransactions.length > 0 ? (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gerado em</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const config = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;
                    const StatusIcon = config.icon;
                    const isExpiringSoon =
                      tx.status === "pending" &&
                      new Date(tx.expires_at).getTime() - Date.now() < 10 * 60 * 1000;

                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">{tx.transaction_id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{tx.customer_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{tx.customer_phone || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(tx.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={config.badgeVariant} className="gap-1">
                            <StatusIcon className={cn("h-3 w-3", config.color)} />
                            {config.label}
                          </Badge>
                          {isExpiringSoon && (
                            <p className="text-[10px] text-amber-500 mt-1">⏳ Expirando em breve</p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(tx.generated_at), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(tx.expires_at), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          {tx.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                              onClick={() => confirmTransaction(tx.id)}
                              disabled={isConfirming}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Confirmar
                            </Button>
                          )}
                          {tx.status === "confirmed" && tx.confirmed_at && (
                            <span className="text-xs text-emerald-600">
                              ✓ {format(new Date(tx.confirmed_at), "HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={QrCode}
                title="Nenhuma transação Pix"
                description="As transações Pix aparecerão aqui quando clientes fizerem pagamentos"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
