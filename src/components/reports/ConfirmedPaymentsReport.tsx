import { useMemo, useState } from "react";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2, DollarSign, ShoppingBag, TrendingUp, Search, Calendar as CalendarIcon,
  FileText, FileSpreadsheet, FileDown, ArrowUpDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useConfirmedPayments, ConfirmedPayment } from "@/hooks/useConfirmedPayments";
import { cn } from "@/lib/utils";

type RangePreset = "today" | "yesterday" | "7d" | "30d" | "thisMonth" | "lastMonth" | "custom";
type SortKey = "paid_at" | "amount_paid" | "customer_name";

const METHOD_LABEL: Record<string, string> = {
  pix: "PIX", cash: "Dinheiro", credit: "Cartão de Crédito",
  debit: "Cartão de Débito", voucher: "Voucher",
};

function computeRange(preset: RangePreset, custom?: { from?: Date; to?: Date }) {
  const now = new Date();
  switch (preset) {
    case "today": return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday": { const y = subDays(now, 1); return { start: startOfDay(y), end: endOfDay(y) }; }
    case "7d": return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case "30d": return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case "thisMonth": return { start: startOfMonth(now), end: endOfDay(now) };
    case "lastMonth": { const lm = subMonths(now, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) }; }
    case "custom": {
      const from = custom?.from ?? startOfDay(now);
      const to = custom?.to ?? endOfDay(now);
      return { start: startOfDay(from), end: endOfDay(to) };
    }
  }
}

const BRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function ConfirmedPaymentsReport() {
  const [preset, setPreset] = useState<RangePreset>("today");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("paid_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const range = useMemo(
    () => computeRange(preset, { from: customFrom, to: customTo }),
    [preset, customFrom, customTo],
  );

  const { data: payments = [], isLoading } = useConfirmedPayments(range);

  const filtered = useMemo(() => {
    let list = [...payments];
    if (methodFilter !== "all") list = list.filter((p) => p.method === methodFilter);
    if (search.trim()) {
      const t = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.customer_name?.toLowerCase().includes(t) ||
          String(p.order_number).includes(t) ||
          p.customer_phone?.includes(t),
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "paid_at") cmp = new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime();
      else if (sortKey === "amount_paid") cmp = a.amount_paid - b.amount_paid;
      else cmp = (a.customer_name ?? "").localeCompare(b.customer_name ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [payments, search, sortKey, sortDir, methodFilter]);

  const totals = useMemo(() => {
    const totalReceived = filtered.reduce((s, p) => s + p.amount_paid, 0);
    const totalSold = filtered.reduce((s, p) => s + p.total_price, 0);
    const count = filtered.length;
    const avg = count > 0 ? totalSold / count : 0;
    return { totalReceived, totalSold, count, avg };
  }, [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const exportCSV = () => {
    const header = ["Pedido","Data","Hora","Cliente","Telefone","Valor Total","Valor Pago","Forma","Status Pagamento","Status Pedido","ID Transação"];
    const rows = filtered.map((p) => [
      p.order_number,
      format(new Date(p.paid_at), "dd/MM/yyyy"),
      format(new Date(p.paid_at), "HH:mm"),
      p.customer_name ?? "",
      p.customer_phone ?? "",
      p.total_price.toFixed(2).replace(".", ","),
      p.amount_paid.toFixed(2).replace(".", ","),
      METHOD_LABEL[p.method] ?? p.method,
      "Confirmado",
      p.order_status,
      p.transaction_id ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `pagamentos-confirmados-${Date.now()}.csv`);
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = filtered.map((p) => ({
      Pedido: p.order_number,
      Data: format(new Date(p.paid_at), "dd/MM/yyyy"),
      Hora: format(new Date(p.paid_at), "HH:mm"),
      Cliente: p.customer_name ?? "",
      Telefone: p.customer_phone ?? "",
      "Valor Total": p.total_price,
      "Valor Pago": p.amount_paid,
      Forma: METHOD_LABEL[p.method] ?? p.method,
      "Status Pagamento": "Confirmado",
      "Status Pedido": p.order_status,
      "ID Transação": p.transaction_id ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");
    XLSX.writeFile(wb, `pagamentos-confirmados-${Date.now()}.xlsx`);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Relatório de Pagamentos Confirmados", 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Período: ${format(range.start, "dd/MM/yyyy")} a ${format(range.end, "dd/MM/yyyy")}`,
      14, 22,
    );
    autoTable(doc, {
      startY: 28,
      head: [["Pedido","Data","Hora","Cliente","Telefone","Total","Pago","Forma","Status"]],
      body: filtered.map((p) => [
        `#${p.order_number}`,
        format(new Date(p.paid_at), "dd/MM/yyyy"),
        format(new Date(p.paid_at), "HH:mm"),
        p.customer_name ?? "-",
        p.customer_phone ?? "-",
        BRL(p.total_price),
        BRL(p.amount_paid),
        METHOD_LABEL[p.method] ?? p.method,
        p.order_status,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] },
    });
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.text(`Total vendido: ${BRL(totals.totalSold)}`, 14, finalY);
    doc.text(`Total recebido: ${BRL(totals.totalReceived)}`, 14, finalY + 6);
    doc.text(`Pedidos pagos: ${totals.count}`, 14, finalY + 12);
    doc.text(`Ticket médio: ${BRL(totals.avg)}`, 14, finalY + 18);
    doc.save(`pagamentos-confirmados-${Date.now()}.pdf`);
  };

  if (isLoading) return <LoadingSkeleton variant="card" count={4} />;

  return (
    <div className="space-y-6">
      {/* Filtros de período */}
      <div className="flex flex-wrap gap-2">
        {([
          ["today", "Hoje"], ["yesterday", "Ontem"], ["7d", "7 dias"],
          ["30d", "30 dias"], ["thisMonth", "Este mês"], ["lastMonth", "Mês anterior"],
        ] as [RangePreset, string][]).map(([k, label]) => (
          <Button key={k} size="sm" variant={preset === k ? "default" : "outline"} onClick={() => setPreset(k)}>
            {label}
          </Button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant={preset === "custom" ? "default" : "outline"}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              {preset === "custom" && customFrom
                ? `${format(customFrom, "dd/MM")}${customTo ? " - " + format(customTo, "dd/MM") : ""}`
                : "Período"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: customFrom, to: customTo }}
              onSelect={(r) => {
                setCustomFrom(r?.from);
                setCustomTo(r?.to);
                if (r?.from) setPreset("custom");
              }}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Cards de totais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{BRL(totals.totalReceived)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{BRL(totals.totalSold)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pagos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{BRL(totals.avg)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros + busca + exportação */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cliente, pedido ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-[260px]"
          />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Forma de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as formas</SelectItem>
            {Object.entries(METHOD_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={filtered.length === 0}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportPDF}>
              <FileText className="h-4 w-4 mr-2" /> PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportCSV}>
              <FileDown className="h-4 w-4 mr-2" /> CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <ScrollArea className="max-h-[560px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort("paid_at")} className="inline-flex items-center gap-1 hover:text-foreground">
                        Data/Hora <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort("customer_name")} className="inline-flex items-center gap-1 hover:text-foreground">
                        Cliente <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">
                      <button onClick={() => toggleSort("amount_paid")} className="inline-flex items-center gap-1 hover:text-foreground">
                        Pago <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Status Pedido</TableHead>
                    <TableHead>Transação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: ConfirmedPayment) => (
                    <TableRow key={p.payment_id}>
                      <TableCell className="font-mono text-xs">#{p.order_number}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(p.paid_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{p.customer_name ?? "—"}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.customer_phone ?? "—"}</TableCell>
                      <TableCell className="text-right">{BRL(p.total_price)}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">{BRL(p.amount_paid)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{METHOD_LABEL[p.method] ?? p.method}</Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{p.order_status}</TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground max-w-[140px] truncate">
                        {p.transaction_id ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={CheckCircle2}
                title="Nenhum pagamento confirmado"
                description="Ajuste os filtros ou o período para ver os pagamentos."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
