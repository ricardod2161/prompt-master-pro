import { forwardRef } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  variant?: "default" | "glass" | "elevated" | "destructive";
  className?: string;
}

export const SettingCard = forwardRef<HTMLDivElement, SettingCardProps>(
  function SettingCard(
    {
      icon: Icon,
      title,
      description,
      children,
      variant = "default",
      className,
    },
    ref
  ) {
    const variantClasses = {
      default: "bg-card border-border/50 hover:border-primary/20",
      glass: "glass border-border/30",
      elevated: "bg-card border-border/50 shadow-lg shadow-black/5 hover:shadow-xl hover:-translate-y-1",
      destructive: "bg-card border-destructive/30 hover:border-destructive/50",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl border p-6 transition-all duration-300",
          variantClasses[variant],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br shadow-sm",
            variant === "destructive" 
              ? "from-destructive/20 to-destructive/5 text-destructive"
              : "from-primary/15 to-primary/5 text-primary"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className={cn(
              "text-lg font-semibold",
              variant === "destructive" && "text-destructive"
            )}>
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    );
  }
);
