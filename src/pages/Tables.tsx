import { useState, useMemo } from "react";
import { 
  QrCode, Plus, Trash2, Eye, Users, Clock, UtensilsCrossed, 
  Download, Filter, Grid3X3, Copy, ExternalLink, RefreshCw,
  AlertCircle, Check, Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTables, useCreateTable, useDeleteTable, useUpdateTableStatus, useGenerateQRCode, type Table, type TableStatus } from "@/hooks/useTables";
import { useOrders } from "@/hooks/useOrders";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Status configuration
const statusConfig: Record<TableStatus, { label: string; color: string; bgColor: string; borderColor: string; iconBg: string }> = {
  free: { 
    label: "Livre", 
    color: "text-emerald-600 dark:text-emerald-400", 
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30 hover:border-emerald-500",
    iconBg: "bg-emerald-500/20"
  },
  occupied: { 
    label: "Ocupada", 
    color: "text-blue-600 dark:text-blue-400", 
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30 hover:border-blue-500",
    iconBg: "bg-blue-500/20"
  },
  pending_order: { 
    label: "Aguardando", 
    color: "text-amber-600 dark:text-amber-400", 
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30 hover:border-amber-500",
    iconBg: "bg-amber-500/20"
  },
};

// ============= METRICS COMPONENT =============
function TableMetrics({ tables }: { tables: Table[] }) {
  const metrics = useMemo(() => {
    const free = tables.filter(t => t.status === "free").length;
    const occupied = tables.filter(t => t.status === "occupied").length;
    const pending = tables.filter(t => t.status === "pending_order").length;
    return { total: tables.length, free, occupied, pending };
  }, [tables]);

  const metricsData = [
    { label: "Total", value: metrics.total, icon: Grid3X3, color: "text-foreground", bgColor: "bg-muted" },
    { label: "Livres", value: metrics.free, icon: Users, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { label: "Ocupadas", value: metrics.occupied, icon: UtensilsCrossed, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { label: "Aguardando", value: metrics.pending, icon: Clock, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metricsData.map((metric) => (
        <Card key={metric.label} className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className={cn("p-2 sm:p-2.5 rounded-lg", metric.bgColor, metric.color)}>
              <metric.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{metric.value}</p>
              <p className="text-xs text-muted-foreground truncate">{metric.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============= TABLE CARD COMPONENT =============
function TableCard({ 
  table, 
  activeOrder,
  onToggleStatus, 
  onGenerateQR, 
  onDelete,
  onViewOrder,
  isUpdating
}: { 
  table: Table;
  activeOrder?: { id: string; order_number: number; total_price: number; created_at: string; status: string };
  onToggleStatus: () => void;
  onGenerateQR: () => void;
  onDelete: () => void;
  onViewOrder?: () => void;
  isUpdating?: boolean;
}) {
  const status = table.status || "free";
  const config = statusConfig[status];
  
  const occupiedTime = table.updated_at && status !== "free" 
    ? formatDistanceToNow(new Date(table.updated_at), { locale: ptBR, addSuffix: false })
    : null;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 border-2 hover:shadow-lg group relative overflow-hidden",
        config.borderColor,
        config.bgColor,
        isUpdating && "opacity-50 pointer-events-none"
      )}
      onClick={onToggleStatus}
    >
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      
      <CardContent className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-bold truncate">Mesa {table.number}</h3>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] sm:text-xs mt-1 font-medium",
                config.color, 
                config.bgColor,
                "border-current/30"
              )}
            >
              {config.label}
            </Badge>
          </div>
          {status !== "free" && occupiedTime && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="hidden xs:inline">{occupiedTime}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Tempo de ocupação: {occupiedTime}</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Active Order Info */}
        {activeOrder && (
          <div 
            className="mb-2 sm:mb-3 p-2 rounded-md bg-background/60 backdrop-blur-sm border border-border/50 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewOrder?.();
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-xs sm:text-sm truncate">
                Pedido #{activeOrder.order_number}
              </span>
              <Badge variant="secondary" className="text-[10px] sm:text-xs font-bold text-primary flex-shrink-0">
                R$ {activeOrder.total_price.toFixed(2)}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {format(new Date(activeOrder.created_at), "HH:mm", { locale: ptBR })}
              </p>
              <Badge variant="outline" className="text-[10px] capitalize">
                {activeOrder.status === "pending" ? "Pendente" : 
                 activeOrder.status === "preparing" ? "Preparando" : 
                 activeOrder.status === "ready" ? "Pronto" : activeOrder.status}
              </Badge>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1.5 sm:gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 sm:h-9 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateQR();
                }}
              >
                <QrCode className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                <span className="hidden sm:inline">QR</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Gerar QR Code</TooltipContent>
          </Tooltip>
          
          {activeOrder && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 sm:h-9 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewOrder?.();
                  }}
                >
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                  <span className="hidden sm:inline">Ver</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver Pedido</TooltipContent>
            </Tooltip>
          )}
          
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 sm:h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Remover Mesa</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Remover Mesa {table.number}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Pedidos vinculados serão desassociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// ============= CREATE TABLES DIALOG =============
function CreateTablesDialog({ 
  open, 
  onOpenChange,
  existingNumbers,
  onCreateSingle,
  onCreateBatch
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNumbers: number[];
  onCreateSingle: (number: number) => Promise<void>;
  onCreateBatch: (start: number, end: number) => Promise<void>;
}) {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [singleNumber, setSingleNumber] = useState("");
  const [batchStart, setBatchStart] = useState("");
  const [batchEnd, setBatchEnd] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      if (mode === "single") {
        const num = parseInt(singleNumber);
        if (isNaN(num) || num < 1) {
          toast({ title: "Número inválido", variant: "destructive" });
          return;
        }
        if (existingNumbers.includes(num)) {
          toast({ title: "Mesa já existe", variant: "destructive" });
          return;
        }
        await onCreateSingle(num);
      } else {
        const start = parseInt(batchStart);
        const end = parseInt(batchEnd);
        if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
          toast({ title: "Intervalo inválido", variant: "destructive" });
          return;
        }
        if (end - start > 50) {
          toast({ title: "Máximo de 50 mesas por vez", variant: "destructive" });
          return;
        }
        await onCreateBatch(start, end);
      }
      onOpenChange(false);
      setSingleNumber("");
      setBatchStart("");
      setBatchEnd("");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedNumber = useMemo(() => {
    if (existingNumbers.length === 0) return 1;
    return Math.max(...existingNumbers) + 1;
  }, [existingNumbers]);

  const batchCount = useMemo(() => {
    const start = parseInt(batchStart);
    const end = parseInt(batchEnd);
    if (isNaN(start) || isNaN(end)) return 0;
    const existing = existingNumbers.filter(n => n >= start && n <= end).length;
    return Math.max(0, end - start + 1 - existing);
  }, [batchStart, batchEnd, existingNumbers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Criar Mesas
          </DialogTitle>
          <DialogDescription>
            Adicione uma mesa ou crie várias de uma vez.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "single" | "batch")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Mesa Única</TabsTrigger>
            <TabsTrigger value="batch">Em Lote</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4 py-4">
          {mode === "single" ? (
            <div className="space-y-3">
              <Label>Número da Mesa</Label>
              <Input
                type="number"
                min="1"
                placeholder={`Ex: ${suggestedNumber}`}
                value={singleNumber}
                onChange={(e) => setSingleNumber(e.target.value)}
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                Próximo número sugerido: <strong>{suggestedNumber}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>De</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={batchStart}
                    onChange={(e) => setBatchStart(e.target.value)}
                    className="text-lg font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Até</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={batchEnd}
                    onChange={(e) => setBatchEnd(e.target.value)}
                    className="text-lg font-semibold"
                  />
                </div>
              </div>
              {batchStart && batchEnd && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Mesas a criar:</span>
                      <Badge variant="secondary" className="font-bold">
                        {batchCount}
                      </Badge>
                    </div>
                    {existingNumbers.some(n => n >= parseInt(batchStart) && n <= parseInt(batchEnd)) && (
                      <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Mesas existentes serão ignoradas
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : mode === "single" ? (
              "Criar Mesa"
            ) : (
              `Criar ${batchCount} Mesas`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= QR CODE DIALOG =============
function QRCodeDialog({
  open,
  onOpenChange,
  tableNumber,
  qrCode
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableNumber: number | null;
  qrCode: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({ title: "Link copiado!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280" width="240" height="280">
        <rect fill="white" width="240" height="280" rx="12"/>
        <rect fill="#f8fafc" x="20" y="20" width="200" height="200" rx="8"/>
        <rect fill="#1e293b" x="40" y="40" width="40" height="40" rx="4"/>
        <rect fill="#1e293b" x="160" y="40" width="40" height="40" rx="4"/>
        <rect fill="#1e293b" x="40" y="160" width="40" height="40" rx="4"/>
        <rect fill="#1e293b" x="100" y="100" width="40" height="40"/>
        <rect fill="#1e293b" x="60" y="100" width="20" height="20"/>
        <rect fill="#1e293b" x="160" y="100" width="20" height="20"/>
        <rect fill="#1e293b" x="100" y="60" width="20" height="20"/>
        <rect fill="#1e293b" x="100" y="160" width="20" height="20"/>
        <text x="120" y="248" text-anchor="middle" font-size="16" font-weight="bold" font-family="Arial" fill="#1e293b">Mesa ${tableNumber}</text>
        <text x="120" y="268" text-anchor="middle" font-size="10" font-family="Arial" fill="#64748b">Escaneie para pedir</text>
      </svg>
    `;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mesa-${tableNumber}-qrcode.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "QR Code baixado!" });
  };

  const handleOpenLink = () => {
    if (qrCode) {
      window.open(qrCode, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            QR Code - Mesa {tableNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* QR Preview */}
          <div className="p-6 sm:p-8 bg-white rounded-xl flex flex-col items-center justify-center shadow-inner">
            <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-br from-slate-100 to-slate-50 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300">
              <QrCode className="h-20 w-20 sm:h-24 sm:w-24 text-slate-800 mb-2" />
              <span className="text-sm font-bold text-slate-800">Mesa {tableNumber}</span>
            </div>
          </div>

          {/* Link Input */}
          <div className="flex gap-2">
            <Input 
              value={qrCode || ""} 
              readOnly 
              className="flex-1 text-xs sm:text-sm font-mono bg-muted" 
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleCopy}
                  className={cn(copied && "text-green-500 border-green-500")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar Link</TooltipContent>
            </Tooltip>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleOpenLink} className="h-10">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Link
            </Button>
            <Button onClick={handleDownload} className="h-10">
              <Download className="h-4 w-4 mr-2" />
              Baixar QR
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Imprima e coloque na mesa para seus clientes fazerem pedidos
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============= STATUS LEGEND =============
function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
      {Object.entries(statusConfig).map(([key, config]) => (
        <div key={key} className="flex items-center gap-1.5 sm:gap-2">
          <div className={cn(
            "w-3 h-3 sm:w-4 sm:h-4 rounded border-2", 
            config.borderColor.split(" ")[0], 
            config.bgColor
          )} />
          <span className="text-muted-foreground">{config.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============= MAIN COMPONENT =============
export default function Tables() {
  const { data: tables = [], isLoading, refetch } = useTables();
  const { data: orders = [] } = useOrders();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();
  const updateTableStatus = useUpdateTableStatus();
  const generateQRCode = useGenerateQRCode();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedTableQR, setSelectedTableQR] = useState<{ number: number; qr_code: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<TableStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingTableId, setUpdatingTableId] = useState<string | null>(null);

  // Map orders to tables
  const tableOrders = useMemo(() => {
    const map = new Map<string, typeof orders[0]>();
    orders
      .filter(o => o.table_id && o.status !== "delivered" && o.status !== "cancelled")
      .forEach(order => {
        if (order.table_id) {
          map.set(order.table_id, order);
        }
      });
    return map;
  }, [orders]);

  // Filter tables
  const filteredTables = useMemo(() => {
    return tables
      .filter(table => {
        if (statusFilter !== "all" && table.status !== statusFilter) return false;
        if (searchTerm && !table.number.toString().includes(searchTerm)) return false;
        return true;
      })
      .sort((a, b) => a.number - b.number);
  }, [tables, statusFilter, searchTerm]);

  const existingNumbers = useMemo(() => tables.map(t => t.number), [tables]);

  const handleCreateSingle = async (number: number) => {
    await createTable.mutateAsync(number);
  };

  const handleCreateBatch = async (start: number, end: number) => {
    const promises = [];
    for (let i = start; i <= end; i++) {
      if (!existingNumbers.includes(i)) {
        promises.push(createTable.mutateAsync(i));
      }
    }
    await Promise.all(promises);
    toast({ title: `${promises.length} mesas criadas!` });
  };

  const handleGenerateQR = async (tableId: string, tableNumber: number) => {
    const qrCode = await generateQRCode.mutateAsync(tableId);
    setSelectedTableQR({ number: tableNumber, qr_code: qrCode });
    setQrDialogOpen(true);
  };

  const handleToggleStatus = async (tableId: string, currentStatus: TableStatus) => {
    const statusFlow: Record<TableStatus, TableStatus> = {
      free: "occupied",
      occupied: "pending_order",
      pending_order: "free",
    };
    setUpdatingTableId(tableId);
    try {
      await updateTableStatus.mutateAsync({ tableId, status: statusFlow[currentStatus] });
    } finally {
      setUpdatingTableId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="space-y-6 p-4 sm:p-6">
          <LoadingSkeleton variant="grid" count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 space-y-4 p-4 sm:p-6 pb-0 bg-background">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">Gestão de Mesas</h1>
            <p className="text-sm text-muted-foreground">
              {tables.length} {tables.length === 1 ? 'mesa cadastrada' : 'mesas cadastradas'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => refetch()}
                  className="h-9 w-9"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atualizar</TooltipContent>
            </Tooltip>
            <Button onClick={() => setCreateDialogOpen(true)} className="h-9 sm:h-10">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Nova Mesa</span>
              <span className="xs:hidden">Nova</span>
            </Button>
          </div>
        </div>

        {/* Metrics */}
        {tables.length > 0 && <TableMetrics tables={tables} />}

        {/* Filters */}
        {tables.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar mesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TableStatus | "all")}>
              <SelectTrigger className="w-full sm:w-[160px] h-10">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="free">Livres</SelectItem>
                <SelectItem value="occupied">Ocupadas</SelectItem>
                <SelectItem value="pending_order">Aguardando</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Legend */}
        {tables.length > 0 && <StatusLegend />}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 pt-4">
        {/* Empty State */}
        {!tables.length ? (
          <EmptyState
            icon={QrCode}
            title="Nenhuma mesa cadastrada"
            description="Adicione mesas para gerenciar seu salão"
            action={
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Mesa
              </Button>
            }
          />
        ) : filteredTables.length === 0 ? (
          <Card className="bg-muted/30">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Nenhuma mesa encontrada</p>
              <Button variant="link" onClick={() => { setStatusFilter("all"); setSearchTerm(""); }}>
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                activeOrder={tableOrders.get(table.id)}
                onToggleStatus={() => handleToggleStatus(table.id, table.status || "free")}
                onGenerateQR={() => handleGenerateQR(table.id, table.number)}
                onDelete={() => deleteTable.mutate(table.id)}
                onViewOrder={() => {
                  const order = tableOrders.get(table.id);
                  if (order) {
                    toast({ 
                      title: `Pedido #${order.order_number}`,
                      description: `Total: R$ ${order.total_price.toFixed(2)}`
                    });
                  }
                }}
                isUpdating={updatingTableId === table.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateTablesDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        existingNumbers={existingNumbers}
        onCreateSingle={handleCreateSingle}
        onCreateBatch={handleCreateBatch}
      />

      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        tableNumber={selectedTableQR?.number || null}
        qrCode={selectedTableQR?.qr_code || null}
      />
    </div>
  );
}
