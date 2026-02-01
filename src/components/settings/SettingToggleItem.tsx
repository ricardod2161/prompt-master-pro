import { LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SettingToggleItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  iconColor?: "primary" | "success" | "warning" | "error" | "accent";
}

export function SettingToggleItem({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  iconColor = "primary",
}: SettingToggleItemProps) {
  const iconColorClasses = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-status-success/20 to-status-success/5 text-status-success",
    warning: "from-status-warning/20 to-status-warning/5 text-status-warning",
    error: "from-status-error/20 to-status-error/5 text-status-error",
    accent: "from-accent/20 to-accent/5 text-accent",
  };

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
        "hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
        checked 
          ? "bg-gradient-to-r from-primary/5 to-transparent border-primary/20 shadow-sm" 
          : "bg-card/50 border-border/50"
      )}
    >
      {/* Active indicator */}
      {checked && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-primary to-primary/60" />
      )}
      
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2.5 rounded-lg bg-gradient-to-br transition-transform duration-300 group-hover:scale-110",
          iconColorClasses[iconColor]
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
