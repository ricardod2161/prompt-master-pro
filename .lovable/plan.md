
# Plano: Sistema de Assinaturas Stripe - Visual 3D Profissional

## Produtos Criados no Stripe

| Plano | Preço | Product ID | Price ID |
|-------|-------|------------|----------|
| Starter | R$ 99/mês | prod_Ttv3LNr32ThW8G | price_1Sw7D7KBKtRrb6BSDHI3wTSm |
| Pro | R$ 199/mês | prod_Ttv5fsMXdkwI7k | price_1Sw7F8KBKtRrb6BSXgHeKCsG |
| Enterprise | R$ 399/mês | prod_Ttv6ifEGhgCeOI | price_1Sw7GEKBKtRrb6BSdkqlVaLt |

---

## Arquitetura do Sistema

```text
┌──────────────────────────────────────────────────────────────────┐
│                    FLUXO DE ASSINATURA                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Login] → [Dashboard] → [Pricing Page] → [Stripe Checkout]    │
│                ↓                                  ↓               │
│         [check-subscription]              [Pagamento OK]         │
│                ↓                                  ↓               │
│         [AuthContext]  ←──────────────────  [Redirect]           │
│                ↓                                                 │
│    [Acesso Liberado/Bloqueado]                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. Edge Functions a Criar

### 1.1 create-checkout
Cria sessao de checkout do Stripe para assinatura.

```text
Funcionalidades:
├── Autentica usuario via Supabase
├── Verifica se ja existe customer no Stripe
├── Cria checkout session com price_id
├── Retorna URL para redirect
└── Suporta os 3 planos (Starter, Pro, Enterprise)
```

### 1.2 check-subscription
Verifica status da assinatura do usuario.

```text
Funcionalidades:
├── Busca customer pelo email no Stripe
├── Lista subscriptions ativas
├── Identifica tier pelo product_id
├── Retorna: subscribed, tier, subscription_end
└── Logging detalhado para debug
```

### 1.3 customer-portal
Gerenciamento de assinatura via portal Stripe.

```text
Funcionalidades:
├── Autentica usuario
├── Busca customer_id no Stripe
├── Cria billing portal session
├── Retorna URL do portal
└── Permite cancelar/upgrade/downgrade
```

---

## 2. Atualizacoes no AuthContext

### Novo Estado de Assinatura

```text
AuthContextType (atualizado):
├── user, session, loading (existentes)
├── subscription: {
│   ├── subscribed: boolean
│   ├── tier: 'starter' | 'pro' | 'enterprise' | null
│   ├── productId: string | null
│   └── subscriptionEnd: string | null
│ }
├── checkSubscription: () => Promise<void>
└── isSubscriptionLoading: boolean
```

### Verificacao Automatica

```text
Triggers de verificacao:
├── Login bem-sucedido
├── Carregamento inicial da pagina
├── A cada 60 segundos (auto-refresh)
└── Apos retorno do checkout
```

---

## 3. Nova Pagina: Pricing

### Visual 3D Profissional

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│    🚀  Escolha o Plano Ideal para seu Restaurante                  │
│        Comece gratis por 14 dias. Cancele quando quiser.           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │    STARTER      │  │      PRO        │  │   ENTERPRISE    │     │
│  │    R$ 99/mês    │  │   R$ 199/mês    │  │   R$ 399/mês    │     │
│  │                 │  │  ★ POPULAR ★    │  │                 │     │
│  │ ✓ PDV           │  │ ✓ Tudo Starter  │  │ ✓ Tudo Pro      │     │
│  │ ✓ Cardapio      │  │ ✓ Delivery      │  │ ✓ Multi-unidade │     │
│  │ ✓ KDS basico    │  │ ✓ Relatorios    │  │ ✓ API           │     │
│  │ ✓ 1 unidade     │  │ ✓ WhatsApp      │  │ ✓ Suporte 24/7  │     │
│  │                 │  │ ✓ 3 unidades    │  │ ✓ Ilimitado     │     │
│  │ [Assinar]       │  │ [Assinar]       │  │ [Contato]       │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│       ↑ Card3D            ↑ Card3D + Glow      ↑ Card3D            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Caracteristicas Visuais

```text
Cards 3D:
├── Sombras em multiplas camadas
├── Hover com lift (translateY -8px)
├── Border gradient no plano popular
├── Glow pulse no badge "Popular"
├── Icones com animacao check
└── Botao com gradiente + hover effect

Background:
├── Gradiente radial sutil
├── Pattern de pontos (dot grid)
├── Glassmorphism no header
└── Transicoes suaves
```

---

## 4. Componentes a Criar

### 4.1 PricingCard

```text
PricingCard
├── Props: tier, price, features, popular, currentPlan
├── Visual 3D com hover effects
├── Badge "Seu Plano" se ativo
├── Badge "Popular" se destacado
├── Botao contextual (Assinar/Gerenciar/Contato)
└── Loading state durante checkout
```

### 4.2 SubscriptionBadge

```text
SubscriptionBadge (para sidebar/header)
├── Mostra tier atual
├── Cor por tier (verde/azul/roxo)
├── Link para pagina de pricing
├── Tooltip com data de renovacao
└── Animacao pulse se proximo do vencimento
```

### 4.3 SubscriptionGate

```text
SubscriptionGate (HOC para protecao)
├── Verifica tier minimo requerido
├── Mostra modal de upgrade se necessario
├── Redirect para pricing se nao assinante
└── Loading skeleton durante verificacao
```

---

## 5. Integracao na Sidebar

### Menu de Assinatura

```text
AppSidebar (atualizado):
├── [Existing menu items...]
├── ───────────────────────
├── [💳 Planos] → /pricing
├── [👤 Minha Conta] → customer-portal
└── [Subscription Badge] no footer
```

---

## 6. Pagina de Sucesso

### /subscription-success

```text
┌─────────────────────────────────────────────┐
│                                             │
│         ✨ Parabens! ✨                     │
│                                             │
│   Sua assinatura foi ativada com sucesso.  │
│                                             │
│   Plano: Pro                                │
│   Proxima cobranca: 01/03/2026             │
│                                             │
│   [🏠 Ir para Dashboard]                    │
│   [⚙️ Gerenciar Assinatura]                │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 7. Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/functions/create-checkout/index.ts` | Criar | Edge function checkout |
| `supabase/functions/check-subscription/index.ts` | Criar | Edge function verificacao |
| `supabase/functions/customer-portal/index.ts` | Criar | Edge function portal |
| `src/contexts/AuthContext.tsx` | Modificar | Adicionar estado de assinatura |
| `src/pages/Pricing.tsx` | Criar | Pagina de planos 3D |
| `src/pages/SubscriptionSuccess.tsx` | Criar | Pagina de sucesso |
| `src/components/subscription/PricingCard.tsx` | Criar | Card de plano 3D |
| `src/components/subscription/SubscriptionBadge.tsx` | Criar | Badge de tier |
| `src/components/subscription/SubscriptionGate.tsx` | Criar | HOC de protecao |
| `src/hooks/useSubscription.ts` | Criar | Hook de assinatura |
| `src/lib/subscription-tiers.ts` | Criar | Constantes dos planos |
| `src/App.tsx` | Modificar | Adicionar rotas |
| `src/components/layout/AppSidebar.tsx` | Modificar | Adicionar menu assinatura |

---

## 8. Constantes dos Planos

```typescript
// src/lib/subscription-tiers.ts
export const SUBSCRIPTION_TIERS = {
  starter: {
    name: "Starter",
    productId: "prod_Ttv3LNr32ThW8G",
    priceId: "price_1Sw7D7KBKtRrb6BSDHI3wTSm",
    price: 99,
    features: [
      "PDV completo",
      "Cardapio Digital",
      "KDS basico",
      "1 unidade",
      "Suporte por email"
    ],
    limits: { units: 1, delivery: false, whatsapp: false }
  },
  pro: {
    name: "Pro",
    productId: "prod_Ttv5fsMXdkwI7k",
    priceId: "price_1Sw7F8KBKtRrb6BSXgHeKCsG",
    price: 199,
    popular: true,
    features: [
      "Tudo do Starter",
      "Modulo Delivery",
      "Relatorios avancados",
      "Integracao WhatsApp",
      "Ate 3 unidades",
      "Suporte prioritario"
    ],
    limits: { units: 3, delivery: true, whatsapp: true }
  },
  enterprise: {
    name: "Enterprise",
    productId: "prod_Ttv6ifEGhgCeOI",
    priceId: "price_1Sw7GEKBKtRrb6BSdkqlVaLt",
    price: 399,
    features: [
      "Tudo do Pro",
      "Unidades ilimitadas",
      "API personalizada",
      "Suporte 24/7",
      "Gerente de conta dedicado",
      "Treinamento personalizado"
    ],
    limits: { units: Infinity, delivery: true, whatsapp: true }
  }
};
```

---

## 9. Fluxo de Usuario

```text
1. Usuario faz login
   └─> check-subscription automatico
   
2. Se nao assinante:
   └─> Pode acessar paginas basicas
   └─> Modal de upgrade em features premium
   
3. Clica em "Assinar":
   └─> Seleciona plano
   └─> create-checkout (edge function)
   └─> Redirect para Stripe Checkout
   
4. Paga no Stripe:
   └─> Redirect para /subscription-success
   └─> check-subscription atualiza estado
   
5. Gerenciamento:
   └─> Clica em "Gerenciar Assinatura"
   └─> customer-portal (edge function)
   └─> Abre Stripe Customer Portal
```

---

## 10. Ordem de Implementacao

1. Criar constantes dos planos (`subscription-tiers.ts`)
2. Criar edge functions (create-checkout, check-subscription, customer-portal)
3. Atualizar AuthContext com estado de assinatura
4. Criar hook useSubscription
5. Criar componentes (PricingCard, SubscriptionBadge)
6. Criar pagina Pricing com visual 3D
7. Criar pagina SubscriptionSuccess
8. Adicionar rotas no App.tsx
9. Atualizar AppSidebar com menu de assinatura
10. Criar SubscriptionGate para protecao de features
11. Testar fluxo completo de assinatura

---

## 11. Resultado Visual Esperado

| Elemento | Descricao |
|----------|-----------|
| Pricing Page | Cards 3D com hover lift, gradientes, glassmorphism |
| Card Popular | Borda luminosa, badge pulsante, destaque visual |
| Botoes | Gradiente primario, shadow 3D, hover scale |
| Success Page | Confetti animation, card central glass |
| Sidebar Badge | Tier colorido, tooltip interativo |
| Gate Modal | Blur backdrop, card 3D, CTA claro |
