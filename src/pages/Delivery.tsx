import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Truck, Plus, User, Phone, Car, CheckCircle, Clock, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrders, type Order } from "@/hooks/useOrders";
import { useDeliveryDrivers, useCreateDriver, useAssignDriver, useMarkDelivered, type DeliveryDriver } from "@/hooks/useDelivery";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

export default function Delivery() {
  const { data: orders, isLoading: ordersLoading } = useOrders({ channel: "delivery" });
  const { data: drivers, isLoading: driversLoading } = useDeliveryDrivers();
  const createDriver = useCreateDriver();
  const assignDriver = useAssignDriver();
  const markDelivered = useMarkDelivered();

  const [createDriverOpen, setCreateDriverOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Driver form
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverVehicle, setDriverVehicle] = useState("");

  const pendingOrders = orders?.filter((o) => o.status === "pending" || o.status === "preparing") || [];
  const readyOrders = orders?.filter((o) => o.status === "ready") || [];
  const deliveredOrders = orders?.filter((o) => o.status === "delivered") || [];

  const handleCreateDriver = async () => {
    await createDriver.mutateAsync({
      name: driverName,
      phone: driverPhone || undefined,
      vehicle: driverVehicle || undefined,
    });
    setCreateDriverOpen(false);
    setDriverName("");
    setDriverPhone("");
    setDriverVehicle("");
  };

  const handleAssignDriver = async () => {
    if (!selectedOrder || !selectedDriver) return;
    await assignDriver.mutateAsync({
      orderId: selectedOrder.id,
      driverId: selectedDriver,
      address: deliveryAddress,
    });
    setAssignDialogOpen(false);
    setSelectedOrder(null);
    setSelectedDriver("");
    setDeliveryAddress("");
  };

  const openAssignDialog = (order: Order) => {
    setSelectedOrder(order);
    setDeliveryAddress(order.notes || "");
    setAssignDialogOpen(true);
  };

  if (ordersLoading || driversLoading) {
    return <LoadingSkeleton variant="card" count={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery</h1>
          <p className="text-muted-foreground">
            Gerencie entregas e entregadores
          </p>
        </div>
        <Button onClick={() => setCreateDriverOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Entregador
        </Button>
      </div>

      {/* Drivers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Entregadores ({drivers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drivers && drivers.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {drivers.map((driver) => (
                <Badge key={driver.id} variant="secondary" className="py-2 px-3">
                  <User className="h-3 w-3 mr-1" />
                  {driver.name}
                  {driver.vehicle && (
                    <span className="ml-2 text-muted-foreground">
                      • {driver.vehicle}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum entregador cadastrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Orders Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Preparando ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="ready">
            Prontos ({readyOrders.length})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Entregues ({deliveredOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingOrders.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="Nenhum pedido em preparo"
              description="Pedidos de delivery em preparo aparecerão aqui"
            />
          )}
        </TabsContent>

        <TabsContent value="ready" className="mt-4">
          {readyOrders.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAssign={() => openAssignDialog(order)}
                  onDeliver={() => markDelivered.mutate(order.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Truck}
              title="Nenhum pedido pronto"
              description="Pedidos prontos para entrega aparecerão aqui"
            />
          )}
        </TabsContent>

        <TabsContent value="delivered" className="mt-4">
          {deliveredOrders.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {deliveredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle}
              title="Nenhum pedido entregue"
              description="Pedidos entregues aparecerão aqui"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Driver Dialog */}
      <Dialog open={createDriverOpen} onOpenChange={setCreateDriverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Entregador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome do entregador"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(opcional)"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Veículo</Label>
                <Input
                  placeholder="Ex: Moto, Bicicleta"
                  value={driverVehicle}
                  onChange={(e) => setDriverVehicle(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDriverOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateDriver} disabled={createDriver.isPending || !driverName}>
              {createDriver.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Entregador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">Pedido #{selectedOrder?.order_number}</p>
              <p className="text-sm text-muted-foreground">
                R$ {selectedOrder?.total_price.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Entregador</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o entregador" />
                </SelectTrigger>
                <SelectContent>
                  {drivers?.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Endereço de Entrega</Label>
              <Input
                placeholder="Endereço completo"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignDriver}
              disabled={assignDriver.isPending || !selectedDriver || !deliveryAddress}
            >
              {assignDriver.isPending ? "Atribuindo..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderCard({
  order,
  onAssign,
  onDeliver,
}: {
  order: Order;
  onAssign?: () => void;
  onDeliver?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">#{order.order_number}</CardTitle>
          <StatusBadge status={order.status || "pending"} />
        </div>
        <CardDescription>
          {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {order.customer_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{order.customer_name}</span>
          </div>
        )}
        {order.customer_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{order.customer_phone}</span>
          </div>
        )}
        {order.notes && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">{order.notes}</span>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground mb-1">Itens:</p>
          {order.order_items?.slice(0, 3).map((item) => (
            <p key={item.id} className="text-sm">
              {item.quantity}x {item.product_name}
            </p>
          ))}
          {order.order_items && order.order_items.length > 3 && (
            <p className="text-sm text-muted-foreground">
              +{order.order_items.length - 3} itens
            </p>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="font-semibold">R$ {order.total_price.toFixed(2)}</span>
          <div className="flex gap-2">
            {onAssign && (
              <Button size="sm" variant="outline" onClick={onAssign}>
                <Truck className="h-4 w-4 mr-1" />
                Despachar
              </Button>
            )}
            {onDeliver && (
              <Button size="sm" onClick={onDeliver}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Entregue
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
