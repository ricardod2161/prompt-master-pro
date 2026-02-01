import { cn } from "@/lib/utils";

interface SidebarBadgeProps {
  count: number;
  variant?: "default" | "warning" | "danger" | "success";
  pulse?: boolean;
  className?: string;
}

export function SidebarBadge({
  count,
  variant = "default",
  pulse = false,
  className,
}: SidebarBadgeProps) {
  if (count <= 0) return null;

  const variantStyles = {
    default: "bg-primary text-primary-foreground",
    warning: "bg-yellow-500 text-yellow-950",
    danger: "bg-red-500 text-white",
    success: "bg-green-500 text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full",
        variantStyles[variant],
        pulse && "animate-pulse",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
