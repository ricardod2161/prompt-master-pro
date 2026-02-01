import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { PricingCard } from "@/components/subscription/PricingCard";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";
import { SUBSCRIPTION_TIERS, SubscriptionTier } from "@/lib/subscription-tiers";

export default function Pricing() {
  const { subscription, isSubscriptionLoading, checkSubscription } = useAuth();
  const { isLoading, startCheckout, openCustomerPortal } = useSubscription();

  const tiers = Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS[SubscriptionTier]][];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 to-background px-4 py-16 text-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)]" />
        
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Planos e Preços
          </div>
          
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Escolha o Plano Ideal para seu{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Restaurante
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Comece grátis por 14 dias. Sem compromisso. Cancele quando quiser.
          </p>

          {/* Current Subscription Status */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">Seu plano atual:</span>
            <SubscriptionBadge 
              tier={subscription.tier} 
              subscriptionEnd={subscription.subscriptionEnd} 
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={checkSubscription}
              disabled={isSubscriptionLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isSubscriptionLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {tiers.map(([tier, config]) => (
            <PricingCard
              key={tier}
              tier={tier}
              config={config}
              currentTier={subscription.tier}
              isLoading={isLoading}
              onSubscribe={startCheckout}
              onManage={openCustomerPortal}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="mb-8 text-2xl font-bold">Perguntas Frequentes</h2>
          <div className="mx-auto max-w-2xl space-y-6 text-left">
            <div>
              <h3 className="font-semibold">Posso trocar de plano depois?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. O valor será ajustado proporcionalmente.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Como funciona o período de teste?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Todos os planos incluem 14 dias de teste grátis. Você só será cobrado após o período de teste.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Quais formas de pagamento são aceitas?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Aceitamos cartões de crédito (Visa, Mastercard, Amex) e boleto bancário via Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
