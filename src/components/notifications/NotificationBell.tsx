import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
}

export function NotificationBell({ unreadCount, onClick, className }: NotificationBellProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "relative h-9 w-9 rounded-full transition-all hover:bg-accent",
        className
      )}
      aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
    >
      <Bell className={cn(
        "h-5 w-5 transition-all",
        unreadCount > 0 && "animate-pulse text-primary"
      )} />
      
      {/* Badge */}
      {unreadCount > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex items-center justify-center",
            "min-w-[18px] h-[18px] px-1 rounded-full",
            "bg-destructive text-destructive-foreground",
            "text-[10px] font-bold",
            "animate-in zoom-in-50 duration-200",
            "ring-2 ring-background"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      
      {/* Pulse effect for new notifications */}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-destructive animate-ping opacity-40" />
      )}
    </Button>
  );
}
