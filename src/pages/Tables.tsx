import { useState, useMemo, useCallback } from "react";
import { 
  QrCode, Plus, Trash2, Eye, Users, Clock, UtensilsCrossed, 
  Filter, Grid3X3, RefreshCw, AlertCircle, Check, Loader2,
  Sparkles, ArrowLeft, DollarSign, ArrowUpDown, Receipt,
  ShoppingCart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { useTables, useCreateTable, useDeleteTable, useUpdateTableStatus, useGenerateQRCode, type Table, type TableStatus } from "@/hooks/useTables";
import { useOrders } from "@/hooks/useOrders";
import { useUnit } from "@/contexts/UnitContext";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableQRCodeDialog } from "@/components/tables/TableQRCodeDialog";
import { TableBillSheet } from "@/components/customer-order/TableBillSheet";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables as DBTables } from "@/integrations/supabase/types";

type OrderWithItems = DBTables<"orders"> & {
  order_items: DBTables<"order_items">[];
};

// Status configuration with premium styling
const statusConfig: Record<TableStatus, { 
  label: string; 
  color: string; 
  bgColor: string; 
  borderColor: string; 
  iconBg: string;
  gradient: string;
  shadowColor: string;
  pulseClass?: string;
}> = {
  free: { 
    label: "Livre", 
    color: "text-emerald-600 dark:text-emerald-400", 
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
    iconBg: "bg-emerald-500/20",
    gradient: "from-emerald-500/5 via-transparent to-emerald-500/10",
    shadowColor: "shadow-emerald-500/10 hover:shadow-emerald-500/20",
  },
  occupied: { 
    label: "Ocupada", 
    color: "text-blue-600 dark:text-blue-400", 
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30 hover:border-blue-500/60",
    iconBg: "bg-blue-500/20",
    gradient: "from-blue-500/5 via-transparent to-blue-500/10",
    shadowColor: "shadow-blue-500/10 hover:shadow-blue-500/20",
  },
  pending_order: { 
    label: "Aguardando", 
    color: "text-amber-600 dark:text-amber-400", 
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30 hover:border-amber-500/60",
    iconBg: "bg-amber-500/20",
    gradient: "from-amber-500/5 via-transparent to-amber-500/10",
    shadowColor: "shadow-amber-500/10 hover:shadow-amber-500/20",
    pulseClass: "animate-pulse-glow",
  },
};

type SortOption = "number" | "status" | "time" | "revenue";

// ============= METRICS COMPONENT =============
function TableMetrics({ tables, totalRevenue, avgOccupiedTime }: { 
  tables: Table[]; 
  totalRevenue: number;
  avgOccupiedTime: string;
}) {
  const metrics = useMemo(() => {
    const free = tables.filter(t => t.status === "free").length;
    const occupied = tables.filter(t => t.status === "occupied").length;
    const pending = tables.filter(t => t.status === "pending_order").length;
    return { total: tables.length, free, occupied, pending };
  }, [tables]);

  const metricsData = [
    { label: "Total", value: metrics.total.toString(), icon: Grid3X3, color: "text-foreground", bgColor: "bg-muted" },
    { label: "Livres", value: metrics.free.toString(), icon: Users, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { label: "Ocupadas", value: metrics.occupied.toString(), icon: UtensilsCrossed, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { label: "Aguardando", value: metrics.pending.toString(), icon: Clock, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    { label: "Receita Ativa", value: `R$ ${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-primary", bgColor: "bg-primary/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
      {metricsData.map((metric) => (
        <Card key={metric.label} className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <div className={cn("p-2.5 sm:p-3 rounded-xl", metric.bgColor, metric.color)}>
              <metric.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold truncate">{metric.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{metric.label}</p>
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
  activeOrders,
  onToggleStatus, 
  onGenerateQR, 
  onDelete,
  onViewOrders,
  onRelease,
  isUpdating
}: { 
  table: Table;
  activeOrders: OrderWithItems[];
  onToggleStatus: () => void;
  onGenerateQR: () => void;
  onDelete: () => void;
  onViewOrders?: () => void;
  onRelease?: () => void;
  isUpdating?: boolean;
}) {
  const status = table.status || "free";
  const config = statusConfig[status];
  
  const occupiedTime = table.updated_at && status !== "free" 
    ? formatDistanceToNow(new Date(table.updated_at), { locale: ptBR, addSuffix: false })
    : null;

  // Time-based alert: yellow > 1h, red > 2h
  const occupiedMs = status !== "free" && table.updated_at
    ? Date.now() - new Date(table.updated_at).getTime()
    : 0;
  const isOverdue2h = occupiedMs > 2 * 60 * 60 * 1000;
  const isOverdue1h = occupiedMs > 1 * 60 * 60 * 1000;

  const timeBorderClass = isOverdue2h
    ? "!border-red-500 ring-2 ring-red-500/30"
    : isOverdue1h
    ? "!border-yellow-500 ring-2 ring-yellow-500/30"
    : "";

  const totalRevenue = useMemo(() => 
    activeOrders.reduce((sum, o) => sum + o.total_price, 0), 
    [activeOrders]
  );

  const ordersCount = activeOrders.length;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 border-2 group relative overflow-hidden",
        "hover:scale-[1.02] hover:shadow-xl",
        config.borderColor,
        config.shadowColor,
        "shadow-md",
        isUpdating && "opacity-50 pointer-events-none",
        config.pulseClass,
        timeBorderClass
      )}
      onClick={onToggleStatus}
    >
      {/* Gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none",
        config.gradient
      )} />
      
      {/* Top shine effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      
      <CardContent className="p-5 sm:p-6 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl sm:text-3xl font-bold">Mesa {table.number}</h3>
              {status === "pending_order" && (
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-sm font-semibold backdrop-blur-sm",
                  config.color, 
                  config.bgColor,
                  "border-current/40"
                )}
              >
                {config.label}
              </Badge>
              {table.capacity && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Users className="h-3 w-3" />
                  {table.capacity}
                </Badge>
              )}
              {ordersCount > 1 && (
                <Badge variant="default" className="text-xs gap-1 bg-primary/20 text-primary">
                  <ShoppingCart className="h-3 w-3" />
                  {ordersCount} pedidos
                </Badge>
              )}
            </div>
          </div>
          {status !== "free" && occupiedTime && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-background/60 backdrop-blur-sm px-3 py-2 rounded-full border border-border/50">
                  <Clock className="h-4 w-4" />
                  <span>{occupiedTime}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Tempo de ocupação: {occupiedTime}</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Active Orders Summary */}
        {ordersCount > 0 && (
          <div 
            className="mb-4 sm:mb-5 p-4 rounded-xl bg-background/70 backdrop-blur-md border border-border/50 shadow-sm hover:bg-background/80 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onViewOrders?.();
            }}
          >
            {ordersCount === 1 ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-base">
                    Pedido #{activeOrders[0].order_number}
                  </span>
                  <Badge className="text-sm font-bold bg-primary/10 text-primary hover:bg-primary/20 flex-shrink-0">
                    R$ {activeOrders[0].total_price.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(activeOrders[0].created_at), "HH:mm", { locale: ptBR })}
                  </p>
                  <Badge variant="outline" className={cn(
                    "text-sm capitalize",
                    activeOrders[0].status === "pending" && "text-amber-500 border-amber-500/50",
                    activeOrders[0].status === "preparing" && "text-blue-500 border-blue-500/50",
                    activeOrders[0].status === "ready" && "text-emerald-500 border-emerald-500/50"
                  )}>
                    {activeOrders[0].status === "pending" ? "Pendente" : 
                     activeOrders[0].status === "preparing" ? "Preparando" : 
                     activeOrders[0].status === "ready" ? "Pronto" : activeOrders[0].status}
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-base">
                    {ordersCount} Pedidos Ativos
                  </span>
                  <Badge className="text-sm font-bold bg-primary/10 text-primary hover:bg-primary/20 flex-shrink-0">
                    R$ {totalRevenue.toFixed(2)}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1">
                  {activeOrders.slice(0, 3).map(o => (
                    <div key={o.id} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>#{o.order_number}</span>
                      <span>R$ {o.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                  {ordersCount > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{ordersCount - 3} mais...
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap opacity-90 group-hover:opacity-100 transition-opacity">
          {status !== "free" && onRelease && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-10 sm:h-11 text-sm bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRelease();
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  <span>Liberar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Liberar mesa (status → Livre)</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 sm:h-11 text-sm bg-background/60 backdrop-blur-sm hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateQR();
                }}
              >
                <QrCode className="h-4 w-4 mr-2" />
                <span>QR Code</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Gerar QR Code Escaneável</TooltipContent>
          </Tooltip>
          
          {ordersCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-10 sm:h-11 text-sm bg-background/60 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewOrders?.();
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span>Ver Conta</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver pedidos e conta da mesa</TooltipContent>
            </Tooltip>
          )}
          
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 sm:h-11 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 bg-background/60 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
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
  onCreateSingle: (number: number, capacity: number) => Promise<void>;
  onCreateBatch: (start: number, end: number, capacity: number) => Promise<void>;
}) {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [singleNumber, setSingleNumber] = useState("");
  const [batchStart, setBatchStart] = useState("");
  const [batchEnd, setBatchEnd] = useState("");
  const [capacity, setCapacity] = useState(4);
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
        await onCreateSingle(num, capacity);
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
        await onCreateBatch(start, end, capacity);
      }
      onOpenChange(false);
      setSingleNumber("");
      setBatchStart("");
      setBatchEnd("");
      setCapacity(4);
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

          {/* Capacity selector */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Capacidade
              </Label>
              <Badge variant="outline" className="font-bold text-base px-3">
                {capacity} <span className="text-muted-foreground font-normal ml-1">pessoas</span>
              </Badge>
            </div>
            <Slider
              value={[capacity]}
              onValueChange={([val]) => setCapacity(val)}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>20</span>
            </div>
          </div>
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
  const navigate = useNavigate();
  const { data: tables = [], isLoading, refetch } = useTables();
  const { data: orders = [] } = useOrders();
  const { selectedUnit } = useUnit();
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
  const [sortBy, setSortBy] = useState<SortOption>("number");
  
  // Bill Sheet state
  const [billSheetOpen, setBillSheetOpen] = useState(false);
  const [billSheetTable, setBillSheetTable] = useState<Table | null>(null);

  // Map orders to tables - now as arrays
  const tableOrdersMap = useMemo(() => {
    const map = new Map<string, OrderWithItems[]>();
    orders
      .filter(o => o.table_id && o.status !== "delivered" && o.status !== "cancelled" && o.status !== "completed")
      .forEach(order => {
        if (order.table_id) {
          const existing = map.get(order.table_id) || [];
          existing.push(order as OrderWithItems);
          map.set(order.table_id, existing);
        }
      });
    return map;
  }, [orders]);

  // Total revenue from active table orders
  const totalRevenue = useMemo(() => {
    let total = 0;
    tableOrdersMap.forEach(ordersList => {
      ordersList.forEach(o => { total += o.total_price; });
    });
    return total;
  }, [tableOrdersMap]);

  // Average occupied time
  const avgOccupiedTime = useMemo(() => {
    const occupiedTables = tables.filter(t => t.status !== "free" && t.updated_at);
    if (occupiedTables.length === 0) return "—";
    const totalMs = occupiedTables.reduce((sum, t) => sum + (Date.now() - new Date(t.updated_at).getTime()), 0);
    const avgMs = totalMs / occupiedTables.length;
    const mins = Math.round(avgMs / 60000);
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? `${mins % 60}m` : ""}`;
  }, [tables]);

  // Filter & sort tables
  const filteredTables = useMemo(() => {
    const filtered = tables
      .filter(table => {
        if (statusFilter !== "all" && table.status !== statusFilter) return false;
        if (searchTerm && !table.number.toString().includes(searchTerm)) return false;
        return true;
      });

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "status": {
          const order: Record<string, number> = { occupied: 0, pending_order: 1, free: 2 };
          return (order[a.status || "free"] ?? 2) - (order[b.status || "free"] ?? 2);
        }
        case "time": {
          const aTime = a.status !== "free" ? new Date(a.updated_at).getTime() : Infinity;
          const bTime = b.status !== "free" ? new Date(b.updated_at).getTime() : Infinity;
          return aTime - bTime; // oldest first
        }
        case "revenue": {
          const aRev = (tableOrdersMap.get(a.id) || []).reduce((s, o) => s + o.total_price, 0);
          const bRev = (tableOrdersMap.get(b.id) || []).reduce((s, o) => s + o.total_price, 0);
          return bRev - aRev; // highest first
        }
        default:
          return a.number - b.number;
      }
    });
  }, [tables, statusFilter, searchTerm, sortBy, tableOrdersMap]);

  const existingNumbers = useMemo(() => tables.map(t => t.number), [tables]);

  const handleCreateSingle = async (number: number, capacity: number) => {
    await createTable.mutateAsync({ number, capacity });
  };

  const handleCreateBatch = async (start: number, end: number, capacity: number) => {
    const promises = [];
    for (let i = start; i <= end; i++) {
      if (!existingNumbers.includes(i)) {
        promises.push(createTable.mutateAsync({ number: i, capacity, silent: true }));
      }
    }
    await Promise.all(promises);
    toast({ title: `${promises.length} mesas criadas com sucesso!` });
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

  const handleViewOrders = useCallback((table: Table) => {
    setBillSheetTable(table);
    setBillSheetOpen(true);
  }, []);

  // Bill sheet data
  const billSheetOrders = useMemo(() => {
    if (!billSheetTable) return [];
    return tableOrdersMap.get(billSheetTable.id) || [];
  }, [billSheetTable, tableOrdersMap]);

  const billTotal = useMemo(() => 
    billSheetOrders.reduce((s, o) => s + o.total_price, 0), 
    [billSheetOrders]
  );

  const billItemsCount = useMemo(() => 
    billSheetOrders.reduce((s, o) => s + (o.order_items?.length || 0), 0), 
    [billSheetOrders]
  );

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
          <div className="min-w-0 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="h-9 w-9 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Gestão de Mesas</h1>
              <p className="text-sm text-muted-foreground">
                {tables.length} {tables.length === 1 ? 'mesa cadastrada' : 'mesas cadastradas'}
                {filteredTables.length !== tables.length && ` · ${filteredTables.length} exibidas`}
              </p>
            </div>
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
        {tables.length > 0 && (
          <TableMetrics 
            tables={tables} 
            totalRevenue={totalRevenue}
            avgOccupiedTime={avgOccupiedTime}
          />
        )}

        {/* Filters & Sort */}
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
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="number">Por Número</SelectItem>
                <SelectItem value="status">Por Status</SelectItem>
                <SelectItem value="time">Por Tempo (antigas)</SelectItem>
                <SelectItem value="revenue">Por Receita</SelectItem>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                activeOrders={tableOrdersMap.get(table.id) || []}
                onToggleStatus={() => handleToggleStatus(table.id, table.status || "free")}
                onGenerateQR={() => handleGenerateQR(table.id, table.number)}
                onDelete={() => deleteTable.mutate(table.id)}
                onRelease={table.status !== "free" ? () => {
                  setUpdatingTableId(table.id);
                  updateTableStatus.mutateAsync({ tableId: table.id, status: "free" }).finally(() => setUpdatingTableId(null));
                } : undefined}
                onViewOrders={() => handleViewOrders(table)}
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

      <TableQRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        tableNumber={selectedTableQR?.number || null}
        qrCode={selectedTableQR?.qr_code || null}
        restaurantName={selectedUnit?.name || "Restaurante"}
      />

      {/* Bill Sheet */}
      {billSheetTable && (
        <TableBillSheet
          open={billSheetOpen}
          onOpenChange={setBillSheetOpen}
          orders={billSheetOrders}
          billTotal={billTotal}
          ordersCount={billSheetOrders.length}
          itemsCount={billItemsCount}
          tableNumber={billSheetTable.number}
          tableId={billSheetTable.id}
          unitId={selectedUnit?.id}
          onCloseBill={async (phone) => {
            toast({ title: "Conta fechada!", description: `Resumo enviado para ${phone}` });
          }}
          closingBill={false}
          billClosed={false}
        />
      )}
    </div>
  );
}
