import { useEffect, useMemo, useRef } from "react";
import { Clock, ChefHat, CheckCircle, AlertTriangle, Play, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrders, useUpdateOrderStatus, useUpdateKitchenStatus, type Order, type KitchenStatus } from "@/hooks/useOrders";
import { useOrderNotification } from "@/hooks/useOrderNotification";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ChannelBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
interface OrderWithKitchen extends Order {
  allReady?: boolean;
}

function getWaitTime(createdAt: string): { minutes: number; label: string; isLate: boolean } {
  const created = new Date(createdAt);
  const now = new Date();
  const minutes = Math.floor((now.getTime() - created.getTime()) / 60000);
  const isLate = minutes > 15;
  const label = formatDistanceToNow(created, { locale: ptBR, addSuffix: false });
  return { minutes, label, isLate };
}

function KDSOrderCard({
  order,
  onStartPreparing,
  onMarkReady,
  onUpdateItem,
}: {
  order: OrderWithKitchen;
  onStartPreparing: () => void;
  onMarkReady: () => void;
  onUpdateItem: (itemId: string, status: KitchenStatus) => void;
}) {
  const waitTime = getWaitTime(order.created_at);

  return (
    <Card className={cn(
      "transition-all",
      waitTime.isLate && order.status === "pending" && "border-destructive bg-destructive/5"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">#{order.order_number}</CardTitle>
          <ChannelBadge channel={order.channel} />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs",
          waitTime.isLate ? "text-destructive font-medium" : "text-muted-foreground"
        )}>
          {waitTime.isLate && <AlertTriangle className="h-3 w-3" />}
          <Clock className="h-3 w-3" />
          <span>{waitTime.label}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {order.order_items?.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-md",
                item.kitchen_status === "ready" && "bg-green-500/10",
                item.kitchen_status === "preparing" && "bg-blue-500/10"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.quantity}x</span>
                  <span className="truncate">{item.product_name}</span>
                </div>
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📝 {item.notes}
                  </p>
                )}
              </div>
              {order.status === "preparing" && item.kitchen_status !== "ready" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-600"
                  onClick={() => onUpdateItem(item.id, "ready")}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="p-2 bg-muted rounded-md text-sm">
            📋 {order.notes}
          </div>
        )}

        {order.customer_name && (
          <p className="text-sm text-muted-foreground">
            👤 {order.customer_name}
          </p>
        )}

        {order.status === "pending" && (
          <Button className="w-full" onClick={onStartPreparing}>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Preparo
          </Button>
        )}

        {order.status === "preparing" && order.allReady && (
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={onMarkReady}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Pronto
            <Bell className="h-3 w-3 ml-2 animate-pulse" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function KDSColumn({
  title,
  icon: Icon,
  orders,
  className,
  onStartPreparing,
  onMarkReady,
  onUpdateItem,
}: {
  title: string;
  icon: React.ElementType;
  orders: OrderWithKitchen[];
  className?: string;
  onStartPreparing: (orderId: string) => void;
  onMarkReady: (orderId: string) => void;
  onUpdateItem: (itemId: string, status: KitchenStatus) => void;
}) {
  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon className="h-5 w-5" />
        <h2 className="font-semibold">{title}</h2>
        <Badge variant="secondary">{orders.length}</Badge>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-2">
          {orders.map((order) => (
            <KDSOrderCard
              key={order.id}
              order={order}
              onStartPreparing={() => onStartPreparing(order.id)}
              onMarkReady={() => onMarkReady(order.id)}
              onUpdateItem={onUpdateItem}
            />
          ))}
          {orders.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Nenhum pedido
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function KDS() {
  const { data: orders, isLoading } = useOrders();
  const updateOrderStatus = useUpdateOrderStatus();
  const updateKitchenStatus = useUpdateKitchenStatus();
  const sendNotification = useOrderNotification();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderCount = useRef(0);

  // Filter and categorize orders
  const { pending, preparing, ready } = useMemo(() => {
    if (!orders) return { pending: [], preparing: [], ready: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((o) => new Date(o.created_at) >= today);

    const withKitchenStatus = todayOrders.map((order) => ({
      ...order,
      allReady: order.order_items?.every((item) => item.kitchen_status === "ready") ?? false,
    }));

    return {
      pending: withKitchenStatus.filter((o) => o.status === "pending"),
      preparing: withKitchenStatus.filter((o) => o.status === "preparing"),
      ready: withKitchenStatus.filter((o) => o.status === "ready"),
    };
  }, [orders]);

  // Play sound on new orders
  useEffect(() => {
    if (pending.length > lastOrderCount.current) {
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
    lastOrderCount.current = pending.length;
  }, [pending.length]);

  const handleStartPreparing = (orderId: string) => {
    updateOrderStatus.mutate({ orderId, status: "preparing" });
  };

  const handleMarkReady = (orderId: string) => {
    // Update status and send notification to customer
    updateOrderStatus.mutate(
      { orderId, status: "ready" },
      {
        onSuccess: () => {
          // Send WhatsApp notification to customer
          sendNotification.mutate({ orderId, status: "ready" });
        },
      }
    );
  };

  const handleUpdateItem = (itemId: string, status: KitchenStatus) => {
    updateKitchenStatus.mutate({ itemId, status });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        <LoadingSkeleton variant="card" count={3} />
        <LoadingSkeleton variant="card" count={3} />
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Hidden audio element for notifications */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleWkyVbTG6cuuVhgdmM/O0JBXR1eDr7nE0alxMB53q7jC2MKCRCg="
        preload="auto"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        <KDSColumn
          title="Pendentes"
          icon={Clock}
          orders={pending}
          className="bg-yellow-500/5 rounded-lg p-4"
          onStartPreparing={handleStartPreparing}
          onMarkReady={handleMarkReady}
          onUpdateItem={handleUpdateItem}
        />
        <KDSColumn
          title="Preparando"
          icon={ChefHat}
          orders={preparing}
          className="bg-blue-500/5 rounded-lg p-4"
          onStartPreparing={handleStartPreparing}
          onMarkReady={handleMarkReady}
          onUpdateItem={handleUpdateItem}
        />
        <KDSColumn
          title="Prontos"
          icon={CheckCircle}
          orders={ready}
          className="bg-green-500/5 rounded-lg p-4"
          onStartPreparing={handleStartPreparing}
          onMarkReady={handleMarkReady}
          onUpdateItem={handleUpdateItem}
        />
      </div>
    </div>
  );
}
