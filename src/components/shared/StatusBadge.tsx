import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled"
  | "free"
  | "occupied"
  | "pending_order";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  pending: {
    label: "Pendente",
    variant: "outline",
    className: "border-yellow-500 text-yellow-600 bg-yellow-500/10",
  },
  preparing: {
    label: "Preparando",
    variant: "outline",
    className: "border-blue-500 text-blue-600 bg-blue-500/10",
  },
  ready: {
    label: "Pronto",
    variant: "outline",
    className: "border-green-500 text-green-600 bg-green-500/10",
  },
  delivered: {
    label: "Entregue",
    variant: "outline",
    className: "border-gray-500 text-gray-600 bg-gray-500/10",
  },
  cancelled: {
    label: "Cancelado",
    variant: "destructive",
    className: "",
  },
  free: {
    label: "Livre",
    variant: "outline",
    className: "border-green-500 text-green-600 bg-green-500/10",
  },
  occupied: {
    label: "Ocupada",
    variant: "outline",
    className: "border-blue-500 text-blue-600 bg-blue-500/10",
  },
  pending_order: {
    label: "Aguardando",
    variant: "outline",
    className: "border-yellow-500 text-yellow-600 bg-yellow-500/10",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export function ChannelBadge({ channel }: { channel: string }) {
  const channelLabels: Record<string, { label: string; className: string }> = {
    counter: { label: "Balcão", className: "bg-purple-500/10 text-purple-600 border-purple-500" },
    table: { label: "Mesa", className: "bg-blue-500/10 text-blue-600 border-blue-500" },
    delivery: { label: "Delivery", className: "bg-orange-500/10 text-orange-600 border-orange-500" },
    whatsapp: { label: "WhatsApp", className: "bg-green-500/10 text-green-600 border-green-500" },
  };

  const config = channelLabels[channel] || channelLabels.counter;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
