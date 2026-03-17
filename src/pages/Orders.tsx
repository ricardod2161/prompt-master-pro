import { useState, useMemo, useEffect } from "react";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, Filter, Eye, Clock, Package, User, MapPin, 
  CreditCard, LayoutGrid, List, ChefHat, CheckCircle2, 
  Truck, XCircle, ShoppingBag, Banknote, Printer, Bell, Edit, Trash2,
  ArrowRight, ChevronsUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOrders, useUpdateOrderStatus, useUpdatePaymentMethod, useDeleteOrder, type Order, type OrderStatus, type OrderChannel, type PaymentMethod } from "@/hooks/useOrders";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useOrderNotification } from "@/hooks/useOrderNotification";
import { StatusBadge, ChannelBadge } from "@/components/shared/StatusBadge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePrintOrder } from "@/hooks/usePrintOrder";
import { cn } from "@/lib/utils";

// ─── Status / Channel helpers ──────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ReactNode; chipClass: string; borderClass: string }> = {
  pending:   { label: "Pendente",   icon: <Clock className="h-3.5 w-3.5" />,        chipClass: "border-yellow-500/50 text-yellow-600 data-[active=true]:bg-yellow-500 data-[active=true]:text-white data-[active=true]:border-yellow-500", borderClass: "" },
  preparing: { label: "Preparando", icon: <ChefHat className="h-3.5 w-3.5" />,      chipClass: "border-blue-500/50   text-blue-600   data-[active=true]:bg-blue-500   data-[active=true]:text-white data-[active=true]:border-blue-500",   borderClass: "" },
  ready:     { label: "Pronto",     icon: <CheckCircle2 className="h-3.5 w-3.5" />, chipClass: "border-green-500/50  text-green-600  data-[active=true]:bg-green-500  data-[active=true]:text-white data-[active=true]:border-green-500",  borderClass: "" },
  delivered: { label: "Entregue",   icon: <Truck className="h-3.5 w-3.5" />,        chipClass: "border-gray-500/50   text-gray-600   data-[active=true]:bg-gray-500   data-[active=true]:text-white data-[active=true]:border-gray-500",   borderClass: "" },
  cancelled: { label: "Cancelado",  icon: <XCircle className="h-3.5 w-3.5" />,      chipClass: "border-red-500/50    text-red-600    data-[active=true]:bg-red-500    data-[active=true]:text-white data-[active=true]:border-red-500",    borderClass: "" },
  completed: { label: "Finalizado", icon: <CheckCircle2 className="h-3.5 w-3.5" />, chipClass: "border-purple-500/50 text-purple-600 data-[active=true]:bg-purple-500 data-[active=true]:text-white data-[active=true]:border-purple-500", borderClass: "" },
};

const CHANNEL_CONFIG: Record<string, { label: string; chipClass: string }> = {
  all:      { label: "Todos",     chipClass: "border-border text-foreground data-[active=true]:bg-foreground data-[active=true]:text-background" },
  counter:  { label: "Balcão",   chipClass: "border-purple-500/50 text-purple-600 data-[active=true]:bg-purple-500 data-[active=true]:text-white" },
  table:    { label: "Mesa",     chipClass: "border-blue-500/50   text-blue-600   data-[active=true]:bg-blue-500   data-[active=true]:text-white" },
  delivery: { label: "Delivery", chipClass: "border-orange-500/50 text-orange-600 data-[active=true]:bg-orange-500 data-[active=true]:text-white" },
  whatsapp: { label: "WhatsApp", chipClass: "border-green-500/50  text-green-600  data-[active=true]:bg-green-500  data-[active=true]:text-white" },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:   "preparing",
  preparing: "ready",
  ready:     "delivered",
};

const paymentLabels: Record<string, string> = {
  cash: "Dinheiro", credit: "Crédito", debit: "Débito", pix: "Pix", voucher: "Vale Refeição",
};

// ─── ORDER METRICS ─────────────────────────────────────────────────────────

function OrderMetrics({ orders }: { orders: Order[] }) {
  // orders here is already filtered to today only
  const metrics = useMemo(() => ({
    total:     orders.length,
    pending:   orders.filter(o => o.status === "pending").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready:     orders.filter(o => o.status === "ready").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    revenue:   orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total_price, 0),
  }), [orders]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total Hoje</span></div>
          <p className="text-2xl font-bold mt-1">{metrics.total}</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-600" /><span className="text-xs text-muted-foreground">Pendentes</span></div>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{metrics.pending}</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2"><ChefHat className="h-4 w-4 text-blue-600" /><span className="text-xs text-muted-foreground">Preparando</span></div>
          <p className="text-2xl font-bold mt-1 text-blue-600">{metrics.preparing}</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-xs text-muted-foreground">Prontos</span></div>
          <p className="text-2xl font-bold mt-1 text-green-600">{metrics.ready}</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-gray-600" /><span className="text-xs text-muted-foreground">Entregues</span></div>
          <p className="text-2xl font-bold mt-1 text-gray-600">{metrics.delivered}</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-emerald-600" /><span className="text-xs text-muted-foreground">Faturamento</span></div>
          <p className="text-lg font-bold mt-1 text-emerald-600">R$ {metrics.revenue.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── KANBAN CARD ────────────────────────────────────────────────────────────

function OrderKanbanCard({ 
  order, 
  onClick,
  onAdvanceStatus,
}: { 
  order: Order; 
  onClick: () => void;
  onAdvanceStatus: (orderId: string, status: OrderStatus) => void;
}) {
  const waitMinutes = differenceInMinutes(new Date(), new Date(order.created_at));
  const totalItems = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;

  // Urgency borders: pending >15min = yellow, >30min = red; preparing >30min = orange
  const urgencyClass = useMemo(() => {
    if (order.status === "pending") {
      if (waitMinutes >= 30) return "border-l-4 border-l-red-500 shadow-red-500/10 shadow-md";
      if (waitMinutes >= 15) return "border-l-4 border-l-yellow-500 shadow-yellow-500/10 shadow-md";
    }
    if (order.status === "preparing" && waitMinutes >= 30) {
      return "border-l-4 border-l-orange-500 shadow-orange-500/10 shadow-md";
    }
    return "";
  }, [order.status, waitMinutes]);

  const nextStatus = order.status ? NEXT_STATUS[order.status] : undefined;
  const waitTime = formatDistanceToNow(new Date(order.created_at), { locale: ptBR, addSuffix: false });

  return (
    <Card className={cn("cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]", urgencyClass)} onClick={onClick}>
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
        
        <div className={cn("text-xs flex items-center gap-1", waitMinutes >= 30 ? "text-red-600 font-medium" : waitMinutes >= 15 ? "text-yellow-600 font-medium" : "text-muted-foreground")}>
          <Clock className="h-3 w-3" />
          <span>Há {waitTime}{waitMinutes >= 30 ? " ⚠" : ""}</span>
        </div>
        
        <div className="flex items-center justify-between pt-1 border-t">
          <span className="text-xs text-muted-foreground">
            {totalItems} {totalItems === 1 ? "item" : "itens"}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-primary text-sm">
              R$ {order.total_price.toFixed(2)}
            </span>
            {nextStatus && (
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6 p-0 border-primary/40 hover:bg-primary hover:text-primary-foreground transition-colors"
                title={`Avançar para ${STATUS_CONFIG[nextStatus].label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdvanceStatus(order.id, nextStatus);
                }}
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── KANBAN VIEW ────────────────────────────────────────────────────────────

function OrderKanbanView({ 
  orders, 
  onOrderClick,
  onAdvanceStatus,
}: { 
  orders: Order[]; 
  onOrderClick: (order: Order) => void;
  onAdvanceStatus: (orderId: string, status: OrderStatus) => void;
}) {
  const columns: { status: OrderStatus; color: string }[] = [
    { status: "pending",   color: "bg-yellow-500" },
    { status: "preparing", color: "bg-blue-500" },
    { status: "ready",     color: "bg-green-500" },
    { status: "delivered", color: "bg-gray-500" },
  ];

  const ordersByStatus = useMemo(() => {
    const grouped: Record<OrderStatus, Order[]> = { pending: [], preparing: [], ready: [], delivered: [], cancelled: [], completed: [] };
    orders.forEach(order => {
      const status = order.status || "pending";
      if (grouped[status]) grouped[status].push(order);
    });
    return grouped;
  }, [orders]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map(({ status, color }) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <div key={status} className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <div className={cn("p-1.5 rounded-md text-white", color)}>{cfg.icon}</div>
              <span className="font-semibold">{cfg.label}</span>
              <Badge variant="secondary" className="ml-auto">{ordersByStatus[status].length}</Badge>
            </div>
            <ScrollArea className="flex-1 max-h-[calc(100vh-350px)]">
              <div className="space-y-2 pr-2">
                {ordersByStatus[status].length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum pedido</p>
                ) : (
                  ordersByStatus[status].map(order => (
                    <OrderKanbanCard
                      key={order.id}
                      order={order}
                      onClick={() => onOrderClick(order)}
                      onAdvanceStatus={onAdvanceStatus}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}

// ─── ORDER DETAILS MODAL ────────────────────────────────────────────────────

function OrderDetailsModal({
  order, onClose, onStatusChange, onPrint, onDelete, isUpdating, isDeleting,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onPrint: (order: Order) => void;
  onDelete: (order: Order) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const [editingPayment, setEditingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("pix");
  const updatePayment = useUpdatePaymentMethod();

  const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: "cash", label: "Dinheiro" }, { value: "credit", label: "Crédito" },
    { value: "debit", label: "Débito" }, { value: "pix", label: "Pix" },
    { value: "voucher", label: "Vale Refeição" },
  ];

  useEffect(() => {
    if (order?.order_payments?.[0]) setSelectedPaymentMethod(order.order_payments[0].method);
    setEditingPayment(false);
  }, [order?.id]);

  const handleSavePayment = () => {
    if (!order) return;
    updatePayment.mutate({ orderId: order.id, newMethod: selectedPaymentMethod }, { onSuccess: () => setEditingPayment(false) });
  };

  if (!order) return null;

  // BUG FIX: use order.change_for directly instead of regex on notes
  const changeFor = order.change_for;

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b bg-card">
          <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Package className="h-5 w-5 text-primary" />
              Pedido #{order.order_number}
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-3 sm:px-6 sm:pb-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2">
              <ChannelBadge channel={order.channel} />
              <StatusBadge status={order.status || "pending"} />
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-4 py-4 sm:px-6 space-y-4">
            {/* Customer info */}
            {(order.customer_name || order.customer_phone) && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-primary" /><span>Cliente</span>
                </div>
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="p-3 sm:p-4">
                    {order.customer_name && <p className="font-medium text-sm sm:text-base">{order.customer_name}</p>}
                    {order.customer_phone && <p className="text-xs sm:text-sm text-muted-foreground">{order.customer_phone}</p>}
                  </CardContent>
                </Card>
              </section>
            )}
            
            {/* Delivery address */}
            {order.delivery_order && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-orange-500" /><span>Endereço de Entrega</span>
                </div>
                <Card className="bg-orange-500/5 border-orange-500/20">
                  <CardContent className="p-3 sm:p-4">
                    <p className="font-medium text-sm sm:text-base">{order.delivery_order.address}</p>
                    {order.notes && order.notes.includes("Ref:") && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        📍 {order.notes.split("Ref:")[1]?.split("|")[0]?.trim()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}
            
            {/* Items */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShoppingBag className="h-4 w-4 text-primary" /><span>Itens do Pedido</span>
              </div>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-0">
                        <span className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-xs flex-shrink-0">{item.quantity}</Badge>
                          <span className="truncate">{item.product_name}</span>
                          {item.notes && <span className="text-xs text-muted-foreground truncate ml-1">({item.notes})</span>}
                        </span>
                        <span className="font-medium flex-shrink-0 ml-2">R$ {item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between font-bold text-base sm:text-lg">
                    <span>Total</span>
                    <span className="text-primary">R$ {order.total_price.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </section>
            
            {/* Payment */}
            {order.order_payments && order.order_payments.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4 text-primary" /><span>Pagamento</span>
                  </div>
                  {order.status === "pending" && !editingPayment && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSelectedPaymentMethod(order.order_payments?.[0]?.method || "pix"); setEditingPayment(true); }}>
                      <Edit className="h-3.5 w-3.5 mr-1" />Editar
                    </Button>
                  )}
                </div>
                
                {editingPayment ? (
                  <Card className="bg-muted/50 border-muted">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={selectedPaymentMethod} onValueChange={(v) => setSelectedPaymentMethod(v as PaymentMethod)}>
                          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSavePayment} disabled={updatePayment.isPending} className="flex-1 sm:flex-none">Salvar</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingPayment(false)} className="flex-1 sm:flex-none">Cancelar</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-muted/50 border-muted">
                    <CardContent className="p-3 sm:p-4 space-y-2">
                      {order.order_payments.map((payment) => (
                        <div key={payment.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{paymentLabels[payment.method] || payment.method}</span>
                          <span className="font-medium">R$ {payment.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      {/* BUG FIX: use change_for column directly */}
                      {changeFor != null && changeFor > 0 && (
                        <>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Troco para</span>
                            <span className="font-medium text-orange-500">R$ {changeFor.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Troco</span>
                            <span className="font-medium text-green-600">
                              R$ {Math.max(0, changeFor - order.total_price).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </section>
            )}
            
            {/* Notes */}
            {order.notes && !order.notes.includes("Ref:") && (
              <section className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-sm flex items-start gap-2">
                  <span className="flex-shrink-0">📋</span>
                  <span>{order.notes}</span>
                </p>
              </section>
            )}
            
            {/* Status buttons */}
            <section className="space-y-3 pt-2">
              <div className="text-sm font-medium">Alterar Status</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(["pending", "preparing", "ready", "delivered", "cancelled"] as OrderStatus[]).map((status) => {
                  const cfg = STATUS_CONFIG[status];
                  const isActive = order.status === status;
                  const showBell = status === "ready" && order.status !== "ready" && order.customer_phone;
                  return (
                    <Button
                      key={status}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => onStatusChange(order.id, status)}
                      disabled={isUpdating}
                      className={cn("flex items-center gap-1.5 h-9 text-xs sm:text-sm", !isActive && cfg.chipClass.split(" data-[active")[0])}
                    >
                      {cfg.icon}
                      <span>{cfg.label}</span>
                      {showBell && <Bell className="h-3 w-3 ml-0.5 animate-pulse" />}
                    </Button>
                  );
                })}
              </div>
              {order.customer_phone && order.status !== "ready" && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 p-2 rounded-md">
                  <Bell className="h-3 w-3 flex-shrink-0" />
                  <span>Cliente será notificado via WhatsApp quando marcar como Pronto</span>
                </p>
              )}
            </section>
          </div>
        </div>
        
        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t bg-card px-4 py-3 sm:px-6 sm:py-4 flex gap-2">
          {(order.status === "delivered" || order.status === "completed" || order.status === "cancelled") && (
            <Button variant="destructive" className="h-10 sm:h-11" onClick={() => onDelete(order)} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          )}
          <Button variant="outline" className="flex-1 h-10 sm:h-11" onClick={() => onPrint(order)}>
            <Printer className="h-4 w-4 mr-2" />Imprimir Comanda
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── MOBILE ORDER CARD ──────────────────────────────────────────────────────

function MobileOrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  // BUG FIX: sum quantities, not count items
  const totalItems = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
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
          <span className="text-sm text-muted-foreground">{totalItems} {totalItems === 1 ? "item" : "itens"}</span>
          <span className="font-bold text-primary">R$ {order.total_price.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── FILTER CHIPS ───────────────────────────────────────────────────────────

function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number; chipClass: string }[];
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          data-active={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium transition-colors",
            opt.chipClass,
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span className="opacity-75">({opt.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── SORTABLE TABLE HEAD ─────────────────────────────────────────────────────

type SortField = "created_at" | "total_price" | "status";

function SortableHead({ field, label, sort, onSort }: { field: SortField; label: string; sort: { field: SortField; dir: "asc" | "desc" } | null; onSort: (f: SortField) => void }) {
  const active = sort?.field === field;
  return (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </TableHead>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<OrderChannel | "all">("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [sort, setSort] = useState<{ field: SortField; dir: "asc" | "desc" } | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const isMobile = useIsMobile();

  // BUG FIX: separate query for today's metrics (no date filter interference)
  const { data: todayOrders } = useOrders({ date: new Date(), limit: 500 });

  // Main list query — filtered by user selections
  const { data: orders, isLoading } = useOrders({
    status: statusFilter === "all" ? undefined : statusFilter,
    channel: channelFilter === "all" ? undefined : channelFilter,
    date: dateFilter,
  });

  const updateOrderStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const sendNotification = useOrderNotification();
  const { printKitchenTicket, printOnPreparing } = usePrintOrder();

  // BUG FIX: sync selectedOrder with freshly fetched list after Realtime update
  useEffect(() => {
    if (!selectedOrder || !orders) return;
    const fresh = orders.find(o => o.id === selectedOrder.id);
    if (fresh && fresh !== selectedOrder) {
      setSelectedOrder(fresh);
    }
  }, [orders]);

  // Build per-status and per-channel counts from the unfiltered today list
  const statusCounts = useMemo(() => {
    const base = orders || [];
    const counts: Record<string, number> = {};
    base.forEach(o => {
      counts[o.status || "pending"] = (counts[o.status || "pending"] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const channelCounts = useMemo(() => {
    const base = orders || [];
    const counts: Record<string, number> = {};
    base.forEach(o => {
      counts[o.channel] = (counts[o.channel] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let list = orders?.filter((order) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        order.order_number.toString().includes(q) ||
        order.customer_name?.toLowerCase().includes(q) ||
        order.customer_phone?.includes(q)
      );
    }) || [];

    // Client-side sorting for table view
    if (sort) {
      list = [...list].sort((a, b) => {
        let av: number | string = 0, bv: number | string = 0;
        if (sort.field === "created_at") { av = a.created_at; bv = b.created_at; }
        else if (sort.field === "total_price") { av = a.total_price; bv = b.total_price; }
        else if (sort.field === "status") { av = a.status || ""; bv = b.status || ""; }
        if (av < bv) return sort.dir === "asc" ? -1 : 1;
        if (av > bv) return sort.dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [orders, search, sort]);

  const handleSortToggle = (field: SortField) => {
    setSort(prev => prev?.field === field ? { field, dir: prev.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" });
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    const order = orders?.find(o => o.id === orderId);
    const previousStatus = order?.status || null;
    
    updateOrderStatus.mutate({ orderId, status }, {
      onSuccess: () => {
        if (status === "ready" && previousStatus !== "ready") sendNotification.mutate({ orderId, status: "ready" });
        if (status === "cancelled" && previousStatus !== "cancelled") sendNotification.mutate({ orderId, status: "cancelled" });
      },
    });
    
    // BUG FIX: use printOnPreparing which respects auto_print_enabled setting
    if (order && status === "preparing") {
      await printOnPreparing(order, status, previousStatus);
    }
  };

  const statusChipOptions = [
    { value: "all" as OrderStatus | "all", label: "Todos", count: orders?.length || 0, chipClass: "border-border text-foreground data-[active=true]:bg-foreground data-[active=true]:text-background" },
    ...Object.entries(STATUS_CONFIG)
      .filter(([s]) => s !== "completed")
      .map(([s, cfg]) => ({
        value: s as OrderStatus | "all",
        label: cfg.label,
        count: statusCounts[s] || 0,
        chipClass: cfg.chipClass,
      })),
  ];

  const channelChipOptions = [
    { value: "all" as OrderChannel | "all", label: "Todos", chipClass: "border-border text-foreground data-[active=true]:bg-foreground data-[active=true]:text-background" },
    ...Object.entries(CHANNEL_CONFIG)
      .filter(([c]) => c !== "all")
      .map(([c, cfg]) => ({
        value: c as OrderChannel | "all",
        label: cfg.label,
        count: channelCounts[c] || 0,
        chipClass: cfg.chipClass,
      })),
  ];

  if (isLoading) return <LoadingSkeleton variant="table" count={10} />;

  return (
    <div className="space-y-4">
      {/* Metrics — uses dedicated today query, not affected by user filters */}
      <OrderMetrics orders={todayOrders || []} />
      
      {/* Search + date filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(!dateFilter && "text-muted-foreground")}>
              <Filter className="h-4 w-4 mr-2" />
              {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} locale={ptBR} />
            {dateFilter && (
              <div className="p-2 border-t">
                <Button variant="ghost" className="w-full" onClick={() => setDateFilter(undefined)}>Limpar filtro</Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* View mode toggle */}
        {!isMobile && (
          <div className="flex border rounded-md">
            <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" className="rounded-r-none" onClick={() => setViewMode("table")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" className="rounded-l-none" onClick={() => setViewMode("kanban")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Inline chip filters */}
      <div className="space-y-2">
        <FilterChips value={statusFilter} onChange={setStatusFilter} options={statusChipOptions} />
        <FilterChips value={channelFilter} onChange={setChannelFilter} options={channelChipOptions} />
      </div>

      {/* Content */}
      {filteredOrders.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum pedido encontrado" description="Tente ajustar os filtros ou aguarde novos pedidos" />
      ) : isMobile ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <MobileOrderCard key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
          ))}
        </div>
      ) : viewMode === "kanban" ? (
        <OrderKanbanView
          orders={filteredOrders}
          onOrderClick={setSelectedOrder}
          onAdvanceStatus={handleStatusChange}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <SortableHead field="created_at" label="Data/Hora" sort={sort} onSort={handleSortToggle} />
                <TableHead>Canal</TableHead>
                <TableHead>Cliente</TableHead>
                <SortableHead field="total_price" label="Total" sort={sort} onSort={handleSortToggle} />
                <SortableHead field="status" label="Status" sort={sort} onSort={handleSortToggle} />
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedOrder(order)}>
                  <TableCell className="font-medium">#{order.order_number}</TableCell>
                  <TableCell>
                    <div className="text-sm">{format(new Date(order.created_at), "dd/MM/yyyy")}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(order.created_at), "HH:mm")}</div>
                  </TableCell>
                  <TableCell><ChannelBadge channel={order.channel} /></TableCell>
                  <TableCell>{order.customer_name || <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell className="font-medium">R$ {order.total_price.toFixed(2)}</TableCell>
                  <TableCell><StatusBadge status={order.status || "pending"} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {order.status && NEXT_STATUS[order.status] && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, NEXT_STATUS[order.status!]!); }}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          {STATUS_CONFIG[NEXT_STATUS[order.status]!].label}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
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
        onPrint={printKitchenTicket}
        onDelete={(order) => setOrderToDelete(order)}
        isUpdating={updateOrderStatus.isPending}
        isDeleting={deleteOrder.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pedido #{orderToDelete?.order_number}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pedido de R$ {orderToDelete?.total_price.toFixed(2)} será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (orderToDelete) {
                  deleteOrder.mutate(orderToDelete.id, {
                    onSuccess: () => { setOrderToDelete(null); setSelectedOrder(null); },
                  });
                }
              }}
              disabled={deleteOrder.isPending}
            >
              {deleteOrder.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
