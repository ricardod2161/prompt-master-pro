import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: "sm" | "md" | "lg";
  glow?: boolean;
  glowColor?: "primary" | "success" | "warning" | "error";
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, blur = "md", glow, glowColor = "primary", children, ...props }, ref) => {
    const blurValues = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md",
      lg: "backdrop-blur-lg",
    };

    const glowColors = {
      primary: "shadow-[0_0_30px_hsl(var(--primary)/0.15)]",
      success: "shadow-[0_0_30px_hsl(var(--status-success)/0.15)]",
      warning: "shadow-[0_0_30px_hsl(var(--status-warning)/0.15)]",
      error: "shadow-[0_0_30px_hsl(var(--status-error)/0.15)]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl",
          "bg-card/80 dark:bg-card/60",
          blurValues[blur],
          "border border-border/50",
          "transition-all duration-300",
          glow && glowColors[glowColor],
          className
        )}
        {...props}
      >
        {/* Top light reflection */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
