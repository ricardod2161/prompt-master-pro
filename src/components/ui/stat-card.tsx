import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: "primary" | "success" | "warning" | "error" | "info";
  loading?: boolean;
}

const iconColorClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-status-success/10 text-status-success",
  warning: "bg-status-warning/10 text-status-warning",
  error: "bg-status-error/10 text-status-error",
  info: "bg-status-info/10 text-status-info",
};

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      title,
      value,
      change,
      changeLabel = "vs ontem",
      icon: Icon,
      iconColor = "primary",
      loading,
      ...props
    },
    ref
  ) => {
    const isPositive = change !== undefined && change >= 0;

    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-xl border bg-card p-6",
            "card-3d",
            className
          )}
          {...props}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-24 rounded shimmer" />
            <div className="h-10 w-10 rounded-xl shimmer" />
          </div>
          <div className="h-8 w-32 rounded shimmer mb-2" />
          <div className="h-4 w-20 rounded shimmer" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card p-6",
          "card-3d group",
          className
        )}
        {...props}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              {title}
            </span>
            <div
              className={cn(
                "p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110",
                iconColorClasses[iconColor]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>

          <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>

          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full",
                  isPositive
                    ? "bg-status-success/10 text-status-success"
                    : "bg-status-error/10 text-status-error"
                )}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(change).toFixed(1)}%
              </div>
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

export { StatCard };
