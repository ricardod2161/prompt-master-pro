import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SubscriptionTier, canAccessFeature, SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface SubscriptionGateProps {
  children: ReactNode;
  requiredTier: SubscriptionTier;
  fallback?: ReactNode;
  showUpgradeModal?: boolean;
}

export function SubscriptionGate({ 
  children, 
  requiredTier, 
  fallback,
  showUpgradeModal = true 
}: SubscriptionGateProps) {
  const { subscription, isSubscriptionLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const hasAccess = canAccessFeature(subscription.tier, requiredTier);

  if (isSubscriptionLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const requiredConfig = SUBSCRIPTION_TIERS[requiredTier];

  return (
    <>
      <div 
        className="relative cursor-pointer rounded-lg border border-dashed border-muted-foreground/25 bg-muted/5 p-6 transition-all hover:border-primary/50 hover:bg-muted/10"
        onClick={() => showUpgradeModal && setShowModal(true)}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Recurso Premium</p>
            <p className="text-sm text-muted-foreground">
              Disponível no plano {requiredConfig.name}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Fazer Upgrade
          </Button>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recurso do Plano {requiredConfig.name}
            </DialogTitle>
            <DialogDescription>
              Este recurso está disponível a partir do plano {requiredConfig.name} por R$ {requiredConfig.price}/mês.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <p className="text-sm font-medium">Inclui:</p>
            <ul className="space-y-2">
              {requiredConfig.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={() => {
                setShowModal(false);
                navigate('/pricing');
              }}
            >
              <Sparkles className="h-4 w-4" />
              Ver Planos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
