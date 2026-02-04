import { Sparkles, RefreshCw, Shield, HeadphonesIcon, CreditCard, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { PricingCard } from "@/components/subscription/PricingCard";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { SUBSCRIPTION_TIERS, SubscriptionTier } from "@/lib/subscription-tiers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "Posso trocar de plano depois?",
    answer: "Sim! Você pode fazer upgrade ou downgrade a qualquer momento através do portal de assinatura. O valor será ajustado proporcionalmente ao tempo restante do seu plano atual."
  },
  {
    question: "Como funciona o período de teste?",
    answer: "Todos os planos incluem 14 dias de teste grátis. Durante esse período, você tem acesso completo a todas as funcionalidades do plano escolhido. Você só será cobrado após o término do teste."
  },
  {
    question: "Quais formas de pagamento são aceitas?",
    answer: "Aceitamos cartões de crédito (Visa, Mastercard, American Express), débito e PIX. Todos os pagamentos são processados de forma segura pelo Stripe."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Não há fidelidade ou multa. Você pode cancelar sua assinatura quando quiser através do portal de assinatura. Seu acesso continuará até o fim do período pago."
  },
  {
    question: "O que acontece se eu exceder os limites do meu plano?",
    answer: "Você receberá uma notificação antes de atingir os limites. Quando necessário, oferecemos a opção de fazer upgrade para um plano maior sem perder nenhum dado."
  }
];

export default function Pricing() {
  const { subscription, isSubscriptionLoading, checkSubscription } = useAuth();
  const { isLoading, startCheckout, openCustomerPortal } = useSubscription();

  const tiers = Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS[SubscriptionTier]][];

  return (
    <div className="min-h-full">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 via-background to-muted/30 border mb-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05)_0%,transparent_50%)]" />
        
        <div className="relative px-6 py-10 sm:py-12">
          <div className="text-center animate-fade-in-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Planos e Preços
            </div>
            
            <h1 className="mb-4 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              Escolha o Plano Ideal para seu{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Restaurante
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground">
              Comece grátis por 14 dias. Sem compromisso. Cancele quando quiser.
            </p>

            {/* Current Subscription Status */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">Seu plano atual:</span>
              <SubscriptionBadge 
                tier={subscription.tier} 
                subscriptionEnd={subscription.subscriptionEnd} 
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1.5"
                onClick={checkSubscription}
                disabled={isSubscriptionLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSubscriptionLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {tiers.map(([tier, config], index) => (
          <PricingCard
            key={tier}
            tier={tier}
            config={config}
            currentTier={subscription.tier}
            isLoading={isLoading}
            onSubscribe={startCheckout}
            onManage={openCustomerPortal}
            index={index}
          />
        ))}
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-12">
        <div className="flex flex-col items-center text-center p-6 rounded-xl bg-muted/30 border animate-fade-in-up animate-stagger-1">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-1">Dados Seguros</h3>
          <p className="text-sm text-muted-foreground">Criptografia de ponta a ponta em todas as transações</p>
        </div>
        
        <div className="flex flex-col items-center text-center p-6 rounded-xl bg-muted/30 border animate-fade-in-up animate-stagger-2">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <HeadphonesIcon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-1">Suporte Humanizado</h3>
          <p className="text-sm text-muted-foreground">Equipe brasileira pronta para ajudar seu negócio</p>
        </div>
        
        <div className="flex flex-col items-center text-center p-6 rounded-xl bg-muted/30 border animate-fade-in-up animate-stagger-3">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-1">Sem Surpresas</h3>
          <p className="text-sm text-muted-foreground">Preços transparentes, sem taxas escondidas</p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 text-primary">
            <HelpCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Perguntas Frequentes</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Tire suas Dúvidas
          </h2>
        </div>
        
        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border rounded-lg mb-3 px-4 bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-medium">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border animate-fade-in-up">
        <h2 className="text-xl sm:text-2xl font-bold mb-3">
          Ainda tem dúvidas?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Nossa equipe está pronta para ajudar você a escolher o melhor plano para seu restaurante.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              const link = document.createElement('a');
              link.href = 'mailto:suporte@restaurantos.com.br';
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <HeadphonesIcon className="h-4 w-4" />
            Falar com Suporte
          </Button>
          <Button 
            className="gap-2"
            onClick={() => {
              const link = document.createElement('a');
              link.href = 'mailto:ricardodelima1988@gmail.com?subject=Dúvidas sobre Planos&body=Olá! Gostaria de saber mais sobre os planos do RestaurantOS';
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Sparkles className="h-4 w-4" />
            Enviar Email
          </Button>
        </div>
      </div>
    </div>
  );
}
