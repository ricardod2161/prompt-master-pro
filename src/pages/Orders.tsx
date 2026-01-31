import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Filter, Eye, Clock, Package, User } from "lucide-react";
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

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<OrderChannel | "all">("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useOrders({
    status: statusFilter === "all" ? undefined : statusFilter,
    channel: channelFilter === "all" ? undefined : channelFilter,
    date: dateFilter,
  });

  const updateOrderStatus = useUpdateOrderStatus();

  const filteredOrders = orders?.filter((order) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.order_number.toString().includes(searchLower) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_phone?.includes(searchLower)
    );
  });

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateOrderStatus.mutate({ orderId, status });
  };

  if (isLoading) {
    return <LoadingSkeleton variant="table" count={10} />;
  }

  return (
    <div className="space-y-4">
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
      </div>

      {!filteredOrders?.length ? (
        <EmptyState
          icon={Package}
          title="Nenhum pedido encontrado"
          description="Tente ajustar os filtros ou aguarde novos pedidos"
        />
      ) : (
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
                <TableRow key={order.id}>
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
                      onClick={() => setSelectedOrder(order)}
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

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(selectedOrder.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={selectedOrder.channel} />
                  <StatusBadge status={selectedOrder.status || "pending"} />
                </div>
              </div>

              {(selectedOrder.customer_name || selectedOrder.customer_phone) && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    {selectedOrder.customer_name && <p className="font-medium">{selectedOrder.customer_name}</p>}
                    {selectedOrder.customer_phone && (
                      <p className="text-sm text-muted-foreground">{selectedOrder.customer_phone}</p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Itens</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="font-medium">R$ {item.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>R$ {selectedOrder.total_price.toFixed(2)}</span>
              </div>

              {selectedOrder.order_payments && selectedOrder.order_payments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Pagamentos</h4>
                  <div className="space-y-1">
                    {selectedOrder.order_payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm">
                        <span className="capitalize">{payment.method}</span>
                        <span>R$ {payment.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">📋 {selectedOrder.notes}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Alterar Status</h4>
                <div className="flex flex-wrap gap-2">
                  {(["pending", "preparing", "ready", "delivered", "cancelled"] as OrderStatus[]).map((status) => (
                    <Button
                      key={status}
                      variant={selectedOrder.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusChange(selectedOrder.id, status)}
                      disabled={updateOrderStatus.isPending}
                    >
                      {statusOptions.find((s) => s.value === status)?.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
