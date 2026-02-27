import { Check, Loader2, Star, Zap, Sparkles, Crown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SubscriptionTier, TierConfig } from "@/lib/subscription-tiers";

interface PricingCardProps {
  tier: SubscriptionTier;
  config: TierConfig;
  currentTier: SubscriptionTier | null;
  isLoading: boolean;
  onSubscribe: (tier: SubscriptionTier) => void;
  onManage: () => void;
  index?: number;
  isTrialing?: boolean;
}

const tierIcons: Record<SubscriptionTier, React.ElementType> = {
  starter: Zap,
  pro: Sparkles,
  enterprise: Crown
};

const tierGradients: Record<SubscriptionTier, string> = {
  starter: "from-emerald-500 to-emerald-600",
  pro: "from-blue-500 to-purple-600",
  enterprise: "from-purple-500 to-pink-600"
};

export function PricingCard({ 
  tier, 
  config, 
  currentTier, 
  isLoading, 
  onSubscribe, 
  onManage,
  index = 0,
  isTrialing = false,
}: PricingCardProps) {
  const isCurrentPlan = currentTier === tier;
  const isPopular = config.popular;
  const Icon = tierIcons[tier];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-500",
        "card-hover-lift",
        "animate-fade-in-up",
        index === 0 && "animate-stagger-1",
        index === 1 && "animate-stagger-2",
        index === 2 && "animate-stagger-3",
        isPopular && "pricing-card-popular border-primary/50 scale-[1.02] lg:scale-105",
        isCurrentPlan && "ring-2 ring-primary"
      )}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg">
            <Star className="h-3 w-3 fill-current" />
            Mais Popular
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4 flex gap-1">
          <div className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            ✓ Seu Plano
          </div>
          {isTrialing && (
            <div className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
              Trial ativo
            </div>
          )}
        </div>
      )}

      {/* Header with Icon */}
      <div className="mb-6 text-center">
        <div className={cn(
          "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
          tierGradients[tier]
        )}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        
        <h3 className="text-xl font-bold">{config.name}</h3>
        
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-extrabold tracking-tight">R$ {config.price}</span>
          <span className="text-muted-foreground">/mês</span>
        </div>
      </div>

      {/* Features */}
      <ul className="mb-8 flex-1 space-y-3">
        {config.features.map((feature, featureIndex) => (
          <li 
            key={featureIndex} 
            className="flex items-start gap-3 animate-fade-in"
            style={{ animationDelay: `${(index * 0.15) + (featureIndex * 0.05)}s` }}
          >
            <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <div className="mt-auto">
        {isCurrentPlan ? (
          <Button
            variant="outline"
            className="w-full gap-2 h-11"
            onClick={onManage}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Settings className="h-4 w-4" />
                Gerenciar Assinatura
              </>
            )}
          </Button>
        ) : (
          <Button
            variant={isPopular ? "default" : "outline"}
            className={cn(
              "w-full gap-2 h-11 font-semibold transition-all",
              isPopular && "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl"
            )}
            onClick={() => onSubscribe(tier)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Assinar Agora
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

