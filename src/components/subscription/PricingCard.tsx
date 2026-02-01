import { Check, Loader2, Star } from "lucide-react";
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
}

export function PricingCard({ 
  tier, 
  config, 
  currentTier, 
  isLoading, 
  onSubscribe, 
  onManage 
}: PricingCardProps) {
  const isCurrentPlan = currentTier === tier;
  const isPopular = config.popular;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300",
        "hover:-translate-y-2 hover:shadow-2xl",
        isPopular && "border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.2)]",
        isCurrentPlan && "ring-2 ring-primary"
      )}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground animate-pulse">
            <Star className="h-3 w-3 fill-current" />
            Popular
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <div className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
            Seu Plano
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold">{config.name}</h3>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-extrabold">R$ {config.price}</span>
          <span className="text-muted-foreground">/mês</span>
        </div>
      </div>

      {/* Features */}
      <ul className="mb-8 flex-1 space-y-3">
        {config.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {isCurrentPlan ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={onManage}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Gerenciar Assinatura"
          )}
        </Button>
      ) : tier === 'enterprise' ? (
        <Button
          variant={isPopular ? "default" : "outline"}
          className={cn(
            "w-full",
            isPopular && "bg-gradient-to-r from-primary to-primary/80"
          )}
          onClick={() => window.open('mailto:contato@restaurantos.com.br?subject=Interesse no Plano Enterprise', '_blank')}
        >
          Falar com Vendas
        </Button>
      ) : (
        <Button
          variant={isPopular ? "default" : "outline"}
          className={cn(
            "w-full",
            isPopular && "bg-gradient-to-r from-primary to-primary/80"
          )}
          onClick={() => onSubscribe(tier)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Assinar Agora"
          )}
        </Button>
      )}
    </div>
  );
}
