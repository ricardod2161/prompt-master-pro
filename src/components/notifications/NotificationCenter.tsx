import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Package,
  CreditCard,
  AlertTriangle,
  MessageSquare,
  Settings,
  Info,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  order: Package,
  payment: CreditCard,
  stock: AlertTriangle,
  whatsapp: MessageSquare,
  system: Settings,
};

const typeStyles: Record<string, { icon: React.ElementType; color: string }> = {
  info: { icon: Info, color: "text-blue-500" },
  success: { icon: CheckCircle, color: "text-green-500" },
  warning: { icon: AlertTriangle, color: "text-yellow-500" },
  error: { icon: XCircle, color: "text-red-500" },
  order: { icon: Package, color: "text-primary" },
  payment: { icon: CreditCard, color: "text-emerald-500" },
  stock: { icon: AlertTriangle, color: "text-orange-500" },
};

export function NotificationCenter({
  open,
  onOpenChange,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  isLoading,
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    return n.category === activeTab;
  });

  const categories = [
    { value: "all", label: "Todas" },
    { value: "unread", label: "Não lidas", count: unreadCount },
    { value: "order", label: "Pedidos" },
    { value: "payment", label: "Pagamentos" },
    { value: "stock", label: "Estoque" },
    { value: "system", label: "Sistema" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 pb-2 border-b bg-gradient-to-r from-background to-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg">Notificações</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
                    : "Todas lidas"}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="gap-1.5 text-xs"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-3 h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className={cn(
                  "relative px-3 py-1.5 text-xs rounded-full",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                  "border border-transparent data-[state=inactive]:border-border",
                  "transition-all"
                )}
              >
                {cat.label}
                {cat.count !== undefined && cat.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {cat.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="p-4 space-y-2">
                {isLoading ? (
                  <NotificationSkeleton />
                ) : filteredNotifications.length === 0 ? (
                  <EmptyNotifications />
                ) : (
                  filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={onMarkAsRead}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const typeConfig = typeStyles[notification.type] || typeStyles.info;
  const TypeIcon = typeConfig.icon;
  const CategoryIcon = categoryIcons[notification.category] || Settings;

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={cn(
        "group relative p-3 rounded-xl border transition-all",
        "hover:shadow-md hover:border-primary/20",
        notification.read
          ? "bg-background border-border/50"
          : "bg-primary/5 border-primary/20"
      )}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn("p-2 rounded-lg bg-muted/50 shrink-0", typeConfig.color)}>
          <TypeIcon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "font-medium text-sm leading-tight",
              !notification.read && "text-foreground"
            )}>
              {notification.title}
            </h4>
            
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onMarkAsRead(notification.id)}
                  title="Marcar como lida"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(notification.id)}
                title="Excluir"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
              <CategoryIcon className="h-2.5 w-2.5" />
              {notification.category}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Action URL indicator */}
      {notification.action_url && (
        <a
          href={notification.action_url}
          className="absolute inset-0 rounded-xl"
          aria-label="Ver detalhes"
        />
      )}
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-xl border animate-pulse">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted/50 mb-4">
        <Bell className="h-8 w-8 text-muted-foreground" />
      </div>
      <h4 className="font-medium text-muted-foreground">Nenhuma notificação</h4>
      <p className="text-xs text-muted-foreground mt-1">
        Você verá suas notificações aqui
      </p>
    </div>
  );
}
