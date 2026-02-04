export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';

export interface TierConfig {
  name: string;
  productId: string;
  priceId: string;
  price: number;
  popular?: boolean;
  features: string[];
  limits: {
    units: number;
    delivery: boolean;
    whatsapp: boolean;
    advancedReports: boolean;
    api: boolean;
  };
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  starter: {
    name: "Starter",
    productId: "prod_TulLmt1sNhS2L2",
    priceId: "price_1SwvpCKBKtRrb6BSnwobSyQd",
    price: 100,
    features: [
      "PDV completo",
      "Cardápio Digital",
      "KDS básico",
      "1 unidade",
      "Suporte por email"
    ],
    limits: { 
      units: 1, 
      delivery: false, 
      whatsapp: false,
      advancedReports: false,
      api: false
    }
  },
  pro: {
    name: "Pro",
    productId: "prod_TulNDUheGUqxbB",
    priceId: "price_1SwvqQKBKtRrb6BSLNrUrF2y",
    price: 150,
    popular: true,
    features: [
      "Tudo do Starter",
      "Módulo Delivery",
      "Relatórios avançados",
      "Integração WhatsApp",
      "Até 3 unidades",
      "Suporte prioritário"
    ],
    limits: { 
      units: 3, 
      delivery: true, 
      whatsapp: true,
      advancedReports: true,
      api: false
    }
  },
  enterprise: {
    name: "Enterprise",
    productId: "prod_TulNrqfw5s4Hp9",
    priceId: "price_1SwvqoKBKtRrb6BSPU4IcDyP",
    price: 200,
    features: [
      "Tudo do Pro",
      "Unidades ilimitadas",
      "API personalizada",
      "Suporte 24/7",
      "Gerente de conta dedicado",
      "Treinamento personalizado"
    ],
    limits: { 
      units: Infinity, 
      delivery: true, 
      whatsapp: true,
      advancedReports: true,
      api: true
    }
  }
};

export function getTierByProductId(productId: string): SubscriptionTier | null {
  for (const [tier, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (config.productId === productId) {
      return tier as SubscriptionTier;
    }
  }
  return null;
}

export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return SUBSCRIPTION_TIERS[tier];
}

export function canAccessFeature(
  currentTier: SubscriptionTier | null, 
  requiredTier: SubscriptionTier
): boolean {
  if (!currentTier) return false;
  
  const tierOrder: SubscriptionTier[] = ['starter', 'pro', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);
  
  return currentIndex >= requiredIndex;
}
