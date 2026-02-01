import { useEffect, useMemo, useRef } from "react";
import { Clock, ChefHat, CheckCircle, AlertTriangle, Play, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card3D, Card3DContent, Card3DHeader, Card3DTitle } from "@/components/ui/card-3d";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrders, useUpdateOrderStatus, useUpdateKitchenStatus, type Order, type KitchenStatus } from "@/hooks/useOrders";
import { useOrderNotification } from "@/hooks/useOrderNotification";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
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
    <Card3D 
      variant="subtle"
      className={cn(
        "transition-all",
        waitTime.isLate && order.status === "pending" && "border-destructive glow-error animate-pulse-glow"
      )}
    >
      <Card3DHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Card3DTitle className="text-lg">#{order.order_number}</Card3DTitle>
          <ChannelBadge channel={order.channel} />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs mt-1",
          waitTime.isLate ? "text-destructive font-medium" : "text-muted-foreground"
        )}>
          {waitTime.isLate && <AlertTriangle className="h-3 w-3" />}
          <Clock className="h-3 w-3" />
          <span>{waitTime.label}</span>
        </div>
      </Card3DHeader>
      <Card3DContent className="space-y-3">
        <div className="space-y-2">
          {order.order_items?.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-lg transition-colors",
                item.kitchen_status === "ready" && "bg-status-success/10 border border-status-success/20",
                item.kitchen_status === "preparing" && "bg-status-info/10 border border-status-info/20",
                !item.kitchen_status && "bg-muted/50"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{item.quantity}x</span>
                  <span className="truncate font-medium">{item.product_name}</span>
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
                  className="text-status-success hover:bg-status-success/10"
                  onClick={() => onUpdateItem(item.id, "ready")}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="p-3 bg-muted/50 rounded-lg text-sm border border-border/50">
            📋 {order.notes}
          </div>
        )}

        {order.customer_name && (
          <p className="text-sm text-muted-foreground">
            👤 {order.customer_name}
          </p>
        )}

        {order.status === "pending" && (
          <Button className="w-full gradient-info text-white hover-lift" onClick={onStartPreparing}>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Preparo
          </Button>
        )}

        {order.status === "preparing" && order.allReady && (
          <Button className="w-full gradient-success text-white hover-lift animate-glow-pulse" onClick={onMarkReady}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Pronto
            <Bell className="h-3 w-3 ml-2" />
          </Button>
        )}
      </Card3DContent>
    </Card3D>
  );
}

function KDSColumn({
  title,
  icon: Icon,
  orders,
  className,
  columnColor,
  onStartPreparing,
  onMarkReady,
  onUpdateItem,
}: {
  title: string;
  icon: React.ElementType;
  orders: OrderWithKitchen[];
  className?: string;
  columnColor: "warning" | "info" | "success";
  onStartPreparing: (orderId: string) => void;
  onMarkReady: (orderId: string) => void;
  onUpdateItem: (itemId: string, status: KitchenStatus) => void;
}) {
  const colorClasses = {
    warning: "bg-status-warning/5 border-status-warning/20",
    info: "bg-status-info/5 border-status-info/20",
    success: "bg-status-success/5 border-status-success/20",
  };

  const iconColorClasses = {
    warning: "text-status-warning bg-status-warning/10",
    info: "text-status-info bg-status-info/10",
    success: "text-status-success bg-status-success/10",
  };

  return (
    <div className={cn("flex flex-col min-h-0 rounded-xl p-4 border", colorClasses[columnColor], className)}>
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className={cn("p-2 rounded-lg", iconColorClasses[columnColor])}>
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="font-semibold text-lg">{title}</h2>
        <Badge variant="secondary" className="ml-auto">{orders.length}</Badge>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-2">
          {orders.map((order, index) => (
            <div 
              key={order.id} 
              className="animate-fade-in-up"
              style={{ animationDelay: `${0.05 * index}s` }}
            >
              <KDSOrderCard
                order={order}
                onStartPreparing={() => onStartPreparing(order.id)}
                onMarkReady={() => onMarkReady(order.id)}
                onUpdateItem={onUpdateItem}
              />
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center text-muted-foreground py-12 text-sm">
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
          columnColor="warning"
          onStartPreparing={handleStartPreparing}
          onMarkReady={handleMarkReady}
          onUpdateItem={handleUpdateItem}
        />
        <KDSColumn
          title="Preparando"
          icon={ChefHat}
          orders={preparing}
          columnColor="info"
          onStartPreparing={handleStartPreparing}
          onMarkReady={handleMarkReady}
          onUpdateItem={handleUpdateItem}
        />
        <KDSColumn
          title="Prontos"
          icon={CheckCircle}
          orders={ready}
          columnColor="success"
          onStartPreparing={handleStartPreparing}
          onMarkReady={handleMarkReady}
          onUpdateItem={handleUpdateItem}
        />
      </div>
    </div>
  );
}
