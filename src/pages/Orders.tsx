import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, Filter, Eye, Clock, Package, User, MapPin, 
  CreditCard, LayoutGrid, List, ChefHat, CheckCircle2, 
  Truck, XCircle, ShoppingBag, Banknote, Printer
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOrders, useUpdateOrderStatus, type Order, type OrderStatus, type OrderChannel } from "@/hooks/useOrders";
import { StatusBadge, ChannelBadge } from "@/components/shared/StatusBadge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePrintOrder } from "@/hooks/usePrintOrder";
import { cn } from "@/lib/utils";

const statusOptions: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendente" },
  { value: "preparing", label: "Preparando" },
  { value: "ready", label: "Pronto" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
];

const channelOptions: { value: OrderChannel | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "counter", label: "Balcão" },
  { value: "table", label: "Mesa" },
  { value: "delivery", label: "Delivery" },
  { value: "whatsapp", label: "WhatsApp" },
];

const paymentLabels: Record<string, string> = {
  cash: "Dinheiro",
  credit: "Crédito",
  debit: "Débito",
  pix: "Pix",
  voucher: "Vale Refeição",
};

// ============= ORDER METRICS COMPONENT =============
function OrderMetrics({ orders }: { orders: Order[] }) {
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
    
    return {
      total: todayOrders.length,
      pending: todayOrders.filter(o => o.status === "pending").length,
      preparing: todayOrders.filter(o => o.status === "preparing").length,
      ready: todayOrders.filter(o => o.status === "ready").length,
      delivered: todayOrders.filter(o => o.status === "delivered").length,
      revenue: todayOrders
        .filter(o => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total_price, 0),
    };
  }, [orders]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Hoje</span>
          </div>
          <p className="text-2xl font-bold mt-1">{metrics.total}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-xs text-muted-foreground">Pendentes</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{metrics.pending}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-muted-foreground">Preparando</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-blue-600">{metrics.preparing}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs text-muted-foreground">Prontos</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-green-600">{metrics.ready}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-gray-600" />
            <span className="text-xs text-muted-foreground">Entregues</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-gray-600">{metrics.delivered}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-muted-foreground">Faturamento</span>
          </div>
          <p className="text-lg font-bold mt-1 text-emerald-600">
            R$ {metrics.revenue.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============= KANBAN CARD COMPONENT =============
function OrderKanbanCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const waitTime = formatDistanceToNow(new Date(order.created_at), { 
    locale: ptBR, 
    addSuffix: false 
  });

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">#{order.order_number}</span>
          <ChannelBadge channel={order.channel} />
        </div>
        
        {order.customer_name && (
          <div className="flex items-center gap-1.5 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{order.customer_name}</span>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Há {waitTime}</span>
        </div>
        
        <div className="flex items-center justify-between pt-1 border-t">
          <span className="text-xs text-muted-foreground">
            {order.order_items?.length || 0} {(order.order_items?.length || 0) === 1 ? 'item' : 'itens'}
          </span>
          <span className="font-semibold text-primary">
            R$ {order.total_price.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============= KANBAN VIEW COMPONENT =============
function OrderKanbanView({ 
  orders, 
  onOrderClick 
}: { 
  orders: Order[]; 
  onOrderClick: (order: Order) => void;
}) {
  const columns: { status: OrderStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { status: "pending", label: "Pendentes", icon: <Clock className="h-4 w-4" />, color: "bg-yellow-500" },
    { status: "preparing", label: "Preparando", icon: <ChefHat className="h-4 w-4" />, color: "bg-blue-500" },
    { status: "ready", label: "Prontos", icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-green-500" },
    { status: "delivered", label: "Entregues", icon: <Truck className="h-4 w-4" />, color: "bg-gray-500" },
  ];

  const ordersByStatus = useMemo(() => {
    const grouped: Record<OrderStatus, Order[]> = {
      pending: [],
      preparing: [],
      ready: [],
      delivered: [],
      cancelled: [],
    };
    orders.forEach(order => {
      const status = order.status || "pending";
      if (grouped[status]) {
        grouped[status].push(order);
      }
    });
    return grouped;
  }, [orders]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map(({ status, label, icon, color }) => (
        <div key={status} className="flex flex-col">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b">
            <div className={cn("p-1.5 rounded-md text-white", color)}>
              {icon}
            </div>
            <span className="font-semibold">{label}</span>
            <Badge variant="secondary" className="ml-auto">
              {ordersByStatus[status].length}
            </Badge>
          </div>
          
          <ScrollArea className="flex-1 max-h-[calc(100vh-350px)]">
            <div className="space-y-2 pr-2">
              {ordersByStatus[status].length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum pedido
                </p>
              ) : (
                ordersByStatus[status].map(order => (
                  <OrderKanbanCard 
                    key={order.id} 
                    order={order} 
                    onClick={() => onOrderClick(order)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}

// ============= ORDER DETAILS MODAL =============
function OrderDetailsModal({
  order,
  onClose,
  onStatusChange,
  onPrint,
  isUpdating,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onPrint: (order: Order) => void;
  isUpdating: boolean;
}) {
  if (!order) return null;

  // Extract change info from notes if available
  const extractChangeInfo = (notes: string | null): string | null => {
    if (!notes) return null;
    const match = notes.match(/Troco para:?\s*R?\$?\s*([\d.,]+)/i);
    return match ? match[1] : null;
  };

  const changeFor = extractChangeInfo(order.notes);

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Pedido #{order.order_number}
          </DialogTitle>
        </DialogHeader>
        
        {/* Header info */}
        <div className="px-4 pb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ChannelBadge channel={order.channel} />
            <StatusBadge status={order.status || "pending"} />
          </div>
        </div>
        
        <Separator />
        
        {/* Scrollable content */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {/* Customer info */}
            {(order.customer_name || order.customer_phone) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-primary" />
                  <span>Cliente</span>
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    {order.customer_name && (
                      <p className="font-medium">{order.customer_name}</p>
                    )}
                    {order.customer_phone && (
                      <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Delivery address */}
            {order.delivery_order && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Endereço de Entrega</span>
                </div>
                <Card className="bg-muted/50 border-orange-500/20">
                  <CardContent className="p-3">
                    <p className="font-medium">{order.delivery_order.address}</p>
                    {order.notes && order.notes.includes("Ref:") && (
                      <p className="text-sm text-muted-foreground mt-1">
                        📍 {order.notes.split("Ref:")[1]?.split("|")[0]?.trim()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span>Itens do Pedido</span>
              </div>
              <Card>
                <CardContent className="p-3 space-y-2">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-xs">
                          {item.quantity}
                        </Badge>
                        {item.product_name}
                      </span>
                      <span className="font-medium">R$ {item.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-primary">R$ {order.total_price.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Payment */}
            {order.order_payments && order.order_payments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Pagamento</span>
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 space-y-1">
                    {order.order_payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm">
                        <span>{paymentLabels[payment.method] || payment.method}</span>
                        <span className="font-medium">R$ {payment.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {changeFor && (
                      <div className="flex justify-between text-sm pt-1 border-t mt-1">
                        <span className="text-muted-foreground">Troco para</span>
                        <span className="font-medium text-orange-600">R$ {changeFor}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Notes (only if not address-related) */}
            {order.notes && !order.notes.includes("Ref:") && !order.notes.includes("Troco") && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">📋 {order.notes}</p>
              </div>
            )}
            
            {/* Actions */}
            <div className="space-y-4 pt-2">
              {/* Print button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onPrint(order)}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Comanda
              </Button>
              
              {/* Status buttons */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Alterar Status</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(["pending", "preparing", "ready", "delivered", "cancelled"] as OrderStatus[]).map((status) => {
                    const statusConfig: Record<OrderStatus, { icon: React.ReactNode; className: string }> = {
                      pending: { icon: <Clock className="h-3.5 w-3.5" />, className: "border-yellow-500 text-yellow-600 hover:bg-yellow-500/10" },
                      preparing: { icon: <ChefHat className="h-3.5 w-3.5" />, className: "border-blue-500 text-blue-600 hover:bg-blue-500/10" },
                      ready: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: "border-green-500 text-green-600 hover:bg-green-500/10" },
                      delivered: { icon: <Truck className="h-3.5 w-3.5" />, className: "border-gray-500 text-gray-600 hover:bg-gray-500/10" },
                      cancelled: { icon: <XCircle className="h-3.5 w-3.5" />, className: "border-red-500 text-red-600 hover:bg-red-500/10" },
                    };
                    const config = statusConfig[status];
                    const isActive = order.status === status;
                    
                    return (
                      <Button
                        key={status}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => onStatusChange(order.id, status)}
                        disabled={isUpdating}
                        className={cn(
                          "flex items-center gap-1.5",
                          !isActive && config.className
                        )}
                      >
                        {config.icon}
                        {statusOptions.find((s) => s.value === status)?.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============= MOBILE ORDER CARD =============
function MobileOrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">#{order.order_number}</span>
          <StatusBadge status={order.status || "pending"} />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Clock className="h-3.5 w-3.5" />
          <span>{format(new Date(order.created_at), "dd/MM HH:mm")}</span>
          <ChannelBadge channel={order.channel} />
        </div>
        
        {order.customer_name && (
          <div className="flex items-center gap-1.5 text-sm mb-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{order.customer_name}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            {order.order_items?.length || 0} itens
          </span>
          <span className="font-bold text-primary">
            R$ {order.total_price.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============= MAIN COMPONENT =============
export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<OrderChannel | "all">("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  
  const isMobile = useIsMobile();

  const { data: orders, isLoading } = useOrders({
    status: statusFilter === "all" ? undefined : statusFilter,
    channel: channelFilter === "all" ? undefined : channelFilter,
    date: dateFilter,
  });

  const updateOrderStatus = useUpdateOrderStatus();
  const { printKitchenTicket, printOnPreparing } = usePrintOrder();

  const filteredOrders = orders?.filter((order) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.order_number.toString().includes(searchLower) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_phone?.includes(searchLower)
    );
  }) || [];

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    // Find the order to get current status
    const order = orders?.find(o => o.id === orderId);
    const previousStatus = order?.status || null;
    
    updateOrderStatus.mutate({ orderId, status });
    
    // Auto-print when status changes to preparing
    if (order && status === "preparing" && previousStatus !== "preparing") {
      await printKitchenTicket(order);
    }
  };
  
  const handleManualPrint = (order: Order) => {
    printKitchenTicket(order);
  };

  if (isLoading) {
    return <LoadingSkeleton variant="table" count={10} />;
  }

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <OrderMetrics orders={orders || []} />
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as OrderChannel | "all")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            {channelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(!dateFilter && "text-muted-foreground")}>
              <Filter className="h-4 w-4 mr-2" />
              {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              locale={ptBR}
            />
            {dateFilter && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setDateFilter(undefined)}
                >
                  Limpar filtro
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        
        {/* View mode toggle */}
        {!isMobile && (
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum pedido encontrado"
          description="Tente ajustar os filtros ou aguarde novos pedidos"
        />
      ) : isMobile ? (
        // Mobile: Card list
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <MobileOrderCard
              key={order.id}
              order={order}
              onClick={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      ) : viewMode === "kanban" ? (
        // Desktop: Kanban view
        <OrderKanbanView
          orders={filteredOrders}
          onOrderClick={setSelectedOrder}
        />
      ) : (
        // Desktop: Table view
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedOrder(order)}>
                  <TableCell className="font-medium">#{order.order_number}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(order.created_at), "dd/MM/yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ChannelBadge channel={order.channel} />
                  </TableCell>
                  <TableCell>
                    {order.customer_name || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    R$ {order.total_price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status || "pending"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onPrint={handleManualPrint}
        isUpdating={updateOrderStatus.isPending}
      />
    </div>
  );
}
