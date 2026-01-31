import { useState, useMemo } from "react";
import { QrCode, Plus, Trash2, Eye, Users, Clock, UtensilsCrossed, Download, Filter, Grid3X3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTables, useCreateTable, useDeleteTable, useUpdateTableStatus, useGenerateQRCode, type Table, type TableStatus } from "@/hooks/useTables";
import { useOrders } from "@/hooks/useOrders";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Status configuration
const statusConfig: Record<TableStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  free: { 
    label: "Livre", 
    color: "text-emerald-700 dark:text-emerald-400", 
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/50 hover:border-emerald-500"
  },
  occupied: { 
    label: "Ocupada", 
    color: "text-blue-700 dark:text-blue-400", 
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/50 hover:border-blue-500"
  },
  pending_order: { 
    label: "Aguardando", 
    color: "text-amber-700 dark:text-amber-400", 
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/50 hover:border-amber-500"
  },
};

// Metrics Component
function TableMetrics({ tables }: { tables: Table[] }) {
  const metrics = useMemo(() => {
    const free = tables.filter(t => t.status === "free").length;
    const occupied = tables.filter(t => t.status === "occupied").length;
    const pending = tables.filter(t => t.status === "pending_order").length;
    return { total: tables.length, free, occupied, pending };
  }, [tables]);

  const metricsData = [
    { label: "Total", value: metrics.total, icon: Grid3X3, color: "text-foreground" },
    { label: "Livres", value: metrics.free, icon: Users, color: "text-emerald-500" },
    { label: "Ocupadas", value: metrics.occupied, icon: UtensilsCrossed, color: "text-blue-500" },
    { label: "Aguardando", value: metrics.pending, icon: Clock, color: "text-amber-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {metricsData.map((metric) => (
        <Card key={metric.label} className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-muted", metric.color)}>
              <metric.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Table Card Component
function TableCard({ 
  table, 
  activeOrder,
  onToggleStatus, 
  onGenerateQR, 
  onDelete,
  onViewOrder
}: { 
  table: Table;
  activeOrder?: { id: string; order_number: number; total_price: number; created_at: string; status: string };
  onToggleStatus: () => void;
  onGenerateQR: () => void;
  onDelete: () => void;
  onViewOrder?: () => void;
}) {
  const status = table.status || "free";
  const config = statusConfig[status];
  
  const occupiedTime = table.updated_at && status !== "free" 
    ? formatDistanceToNow(new Date(table.updated_at), { locale: ptBR, addSuffix: false })
    : null;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 border-2 hover:shadow-lg group",
        config.borderColor,
        config.bgColor
      )}
      onClick={onToggleStatus}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold">Mesa {table.number}</h3>
            <Badge variant="outline" className={cn("text-xs mt-1", config.color, config.bgColor)}>
              {config.label}
            </Badge>
          </div>
          {status !== "free" && occupiedTime && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {occupiedTime}
              </div>
            </div>
          )}
        </div>

        {/* Active Order Info */}
        {activeOrder && (
          <div 
            className="mb-3 p-2 rounded-md bg-background/50 border border-border/50 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewOrder?.();
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Pedido #{activeOrder.order_number}</span>
              <Badge variant="secondary" className="text-xs">
                R$ {activeOrder.total_price.toFixed(2)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(activeOrder.created_at), "HH:mm", { locale: ptBR })}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateQR();
            }}
          >
            <QrCode className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">QR</span>
          </Button>
          {activeOrder && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewOrder?.();
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Ver</span>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover Mesa {table.number}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Pedidos vinculados serão desassociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Remover</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Tables Dialog
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Mesas</DialogTitle>
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
            <div className="space-y-2">
              <Label>Número da Mesa</Label>
              <Input
                type="number"
                min="1"
                placeholder={`Ex: ${suggestedNumber}`}
                value={singleNumber}
                onChange={(e) => setSingleNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Próximo número sugerido: {suggestedNumber}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>De</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={batchStart}
                  onChange={(e) => setBatchStart(e.target.value)}
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
                />
              </div>
              {batchStart && batchEnd && (
                <p className="col-span-2 text-xs text-muted-foreground">
                  Serão criadas {Math.max(0, parseInt(batchEnd) - parseInt(batchStart) + 1)} mesas
                  {existingNumbers.some(n => n >= parseInt(batchStart) && n <= parseInt(batchEnd)) && 
                    " (mesas existentes serão ignoradas)"}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? "Criando..." : mode === "single" ? "Criar Mesa" : "Criar Mesas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// QR Code Dialog
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
  const handleCopy = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      toast({ title: "Link copiado!" });
    }
  };

  const handleDownload = () => {
    // Create QR code download using a simple SVG
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
        <rect fill="white" width="200" height="200"/>
        <text x="100" y="90" text-anchor="middle" font-size="14" font-family="Arial">Mesa ${tableNumber}</text>
        <text x="100" y="110" text-anchor="middle" font-size="10" font-family="Arial">Escaneie para pedir</text>
        <rect x="50" y="130" width="100" height="40" fill="#f0f0f0" rx="5"/>
        <text x="100" y="155" text-anchor="middle" font-size="8" font-family="Arial">QR Code</text>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code - Mesa {tableNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-48 h-48 bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
              <QrCode className="h-24 w-24 text-foreground mb-2" />
              <span className="text-sm font-medium text-foreground">Mesa {tableNumber}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Input value={qrCode || ""} readOnly className="flex-1 text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Escaneie este código para fazer pedidos nesta mesa
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Tables() {
  const { data: tables = [], isLoading } = useTables();
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

  const handleToggleStatus = (tableId: string, currentStatus: TableStatus) => {
    const statusFlow: Record<TableStatus, TableStatus> = {
      free: "occupied",
      occupied: "pending_order",
      pending_order: "free",
    };
    updateTableStatus.mutate({ tableId, status: statusFlow[currentStatus] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <LoadingSkeleton variant="grid" count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Mesas</h1>
          <p className="text-muted-foreground">
            {tables.length} mesas cadastradas
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Mesa
        </Button>
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
              className="pl-9"
            />
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TableStatus | "all")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="free">Livres</SelectItem>
              <SelectItem value="occupied">Ocupadas</SelectItem>
              <SelectItem value="pending_order">Aguardando</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Legend */}
      {tables.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={cn("w-4 h-4 rounded border-2", config.borderColor.split(" ")[0], config.bgColor)} />
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      )}

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
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma mesa encontrada com os filtros aplicados</p>
          <Button variant="link" onClick={() => { setStatusFilter("all"); setSearchTerm(""); }}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              activeOrder={tableOrders.get(table.id)}
              onToggleStatus={() => handleToggleStatus(table.id, table.status || "free")}
              onGenerateQR={() => handleGenerateQR(table.id, table.number)}
              onDelete={() => deleteTable.mutate(table.id)}
              onViewOrder={() => {
                // Could navigate to order details
                toast({ title: `Pedido #${tableOrders.get(table.id)?.order_number}` });
              }}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateTablesDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        existingNumbers={existingNumbers}
        onCreateSingle={handleCreateSingle}
        onCreateBatch={handleCreateBatch}
      />

      {/* QR Code Dialog */}
      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        tableNumber={selectedTableQR?.number || null}
        qrCode={selectedTableQR?.qr_code || null}
      />
    </div>
  );
}
