import { Crown, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionTier, SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionBadgeProps {
  tier: SubscriptionTier | null;
  subscriptionEnd: string | null;
  className?: string;
}

const tierIcons: Record<SubscriptionTier, React.ElementType> = {
  starter: Zap,
  pro: Sparkles,
  enterprise: Crown
};

const tierColors: Record<SubscriptionTier, string> = {
  starter: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  pro: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  enterprise: "bg-purple-500/10 text-purple-500 border-purple-500/20"
};

export function SubscriptionBadge({ tier, subscriptionEnd, className }: SubscriptionBadgeProps) {
  if (!tier) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        "bg-muted/50 text-muted-foreground border-muted",
        className
      )}>
        <Zap className="h-3 w-3" />
        <span>Gratuito</span>
      </div>
    );
  }

  const Icon = tierIcons[tier];
  const config = SUBSCRIPTION_TIERS[tier];
  const formattedDate = subscriptionEnd 
    ? format(new Date(subscriptionEnd), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium cursor-help transition-all hover:scale-105",
          tierColors[tier],
          className
        )}>
          <Icon className="h-3 w-3" />
          <span>{config.name}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">Plano {config.name}</p>
        {formattedDate && (
          <p className="text-xs text-muted-foreground">
            Renova em {formattedDate}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
