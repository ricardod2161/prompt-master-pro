import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Sparkles, Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription, checkSubscription } = useAuth();
  const { openCustomerPortal, isLoading } = useSubscription();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check subscription status when page loads
    const checkStatus = async () => {
      await checkSubscription();
      setIsChecking(false);
    };
    
    checkStatus();
  }, [checkSubscription]);

  const tierConfig = subscription.tier ? SUBSCRIPTION_TIERS[subscription.tier] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/30 to-background p-4">
      <div className="relative w-full max-w-md">
        {/* Background Glow */}
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-2xl" />
        
        {/* Card */}
        <div className="relative rounded-2xl border bg-card/95 p-8 shadow-2xl backdrop-blur">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold">
              Parabéns! 🎉
            </h1>
            <p className="text-muted-foreground">
              Sua assinatura foi ativada com sucesso.
            </p>
          </div>

          {/* Plan Details */}
          {isChecking ? (
            <div className="mb-6 flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : tierConfig ? (
            <div className="mb-6 rounded-xl border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="text-lg font-semibold">{tierConfig.name}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>
              {subscription.subscriptionEnd && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                  <p className="font-medium">
                    {new Date(subscription.subscriptionEnd).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <Home className="h-4 w-4" />
              Ir para o Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={openCustomerPortal}
              disabled={isLoading}
            >
              <Settings className="h-4 w-4" />
              Gerenciar Assinatura
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
