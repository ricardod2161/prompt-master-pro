import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionTier, SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

export interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier | null;
  productId: string | null;
  subscriptionEnd: string | null;
}

export function useSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkSubscription = useCallback(async (): Promise<SubscriptionState> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }
      
      return {
        subscribed: data.subscribed || false,
        tier: data.tier as SubscriptionTier | null,
        productId: data.productId || null,
        subscriptionEnd: data.subscriptionEnd || null
      };
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return {
        subscribed: false,
        tier: null,
        productId: null,
        subscriptionEnd: null
      };
    }
  }, []);

  const createCheckout = useCallback(async (priceId: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao criar sessão de checkout');
      }
      
      if (data?.error) {
        if (data?.hasActiveSubscription) {
          toast({
            title: "Assinatura ativa",
            description: "Você já possui uma assinatura ativa. Use 'Gerenciar Assinatura' para alterar seu plano.",
          });
          return null;
        }
        throw new Error(data.error);
      }
      
      return data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro no checkout",
        description: message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const openCustomerPortal = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw new Error(error.message || 'Erro ao abrir portal');
      }
      
      if (data?.isManualOverride) {
        toast({
          title: "Acesso manual",
          description: data.error || "Seu acesso foi concedido manualmente pela equipe. Entre em contato para alterações.",
        });
        return;
      }

      if (data?.error) {
        throw new Error(data.error);
      }
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const startCheckout = useCallback(async (tier: SubscriptionTier): Promise<void> => {
    const config = SUBSCRIPTION_TIERS[tier];
    if (!config) {
      toast({
        title: "Erro",
        description: "Plano não encontrado",
        variant: "destructive"
      });
      return;
    }

    const url = await createCheckout(config.priceId);
    if (url) {
      window.open(url, '_blank');
    }
  }, [createCheckout, toast]);

  return {
    isLoading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    startCheckout
  };
}
