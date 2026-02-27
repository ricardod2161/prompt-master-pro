import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Sparkles, Home, Settings, ArrowRight, Rocket, Book, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { PageHeader } from "@/components/shared/PageHeader";

const nextSteps = [
  {
    icon: Rocket,
    title: "Configure seu Cardápio",
    description: "Adicione produtos, categorias e preços",
    href: "/menu"
  },
  {
    icon: Book,
    title: "Explore os Recursos",
    description: "Descubra todas as funcionalidades do sistema",
    href: "/dashboard"
  },
  {
    icon: HeadphonesIcon,
    title: "Precisa de Ajuda?",
    description: "Nossa equipe está pronta para ajudar",
    href: "mailto:suporte@restaurantos.com.br"
  }
];

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { subscription, checkSubscription } = useAuth();
  const { openCustomerPortal, isLoading } = useSubscription();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkWithRetry = async (attempts = 3, delay = 2000) => {
      for (let i = 0; i < attempts; i++) {
        await checkSubscription();
        // If subscription found, stop retrying
        if (i < attempts - 1) {
          await new Promise((res) => setTimeout(res, delay));
        }
      }
      setIsChecking(false);
    };

    checkWithRetry();
  }, [checkSubscription]);

  const tierConfig = subscription.tier ? SUBSCRIPTION_TIERS[subscription.tier] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <PageHeader
          title=""
          showBackButton
          backTo="/pricing"
          breadcrumbs={[
            { label: "Planos", href: "/pricing" },
            { label: "Sucesso" }
          ]}
        />

        <div className="mt-8 flex flex-col items-center">
          {/* Success Animation */}
          <div className="relative mb-8 animate-bounce-in">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" style={{ animationDuration: '2s' }} />
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-green-400/20 via-emerald-500/20 to-green-600/20 blur-xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-2xl">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h1 className="mb-3 text-3xl sm:text-4xl font-bold">
              Parabéns! 🎉
            </h1>
            <p className="text-lg text-muted-foreground">
              Sua assinatura foi ativada com sucesso.
            </p>
          </div>

          {/* Plan Card */}
          <div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {isChecking ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              </div>
            ) : tierConfig ? (
              <div className="rounded-2xl border bg-card p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Seu plano</p>
                    <p className="text-2xl font-bold">{tierConfig.name}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                {subscription.subscriptionEnd && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                    <p className="font-semibold">
                      {new Date(subscription.subscriptionEnd).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  <Button 
                    className="w-full gap-2 h-11"
                    onClick={() => navigate('/dashboard')}
                  >
                    <Home className="h-4 w-4" />
                    Ir para o Dashboard
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 h-11"
                    onClick={openCustomerPortal}
                    disabled={isLoading}
                  >
                    <Settings className="h-4 w-4" />
                    Gerenciar Assinatura
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Next Steps */}
          <div className="w-full max-w-2xl mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-lg font-semibold mb-4 text-center">Próximos Passos</h2>
            
            <div className="grid gap-4 sm:grid-cols-3">
              {nextSteps.map((step, index) => {
                const Icon = step.icon;
                const isExternal = step.href.startsWith('mailto:');
                
                return (
                  <button
                    key={index}
                    onClick={() => isExternal ? window.open(step.href, '_blank') : navigate(step.href)}
                    className="group flex flex-col items-center text-center p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all hover:-translate-y-1"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    <ArrowRight className="h-4 w-4 mt-2 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
