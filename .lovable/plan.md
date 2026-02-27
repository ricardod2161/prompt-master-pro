
## Auditoria Completa — Sistema de Planos

### O que está funcionando
- Produtos e prices no Stripe batem exatamente com `subscription-tiers.ts`
- `check-subscription` detecta `trialing` vs `active` corretamente
- `create-checkout` envia `trial_period_days: 14`
- `AppLayout` exibe `TrialBanner` durante trial
- `customer-portal` funciona corretamente

### Bugs reais encontrados (sem inventar)

**BUG 1 — `Pricing.tsx` não passa `isTrialing`/`trialEnd` para `SubscriptionBadge`**
Na linha 74-77 de `Pricing.tsx`, o `SubscriptionBadge` é renderizado sem as props `isTrialing` e `trialEnd`. O badge mostra "Pro" em vez de "Pro · Trial" quando o usuário está em período de teste.
```tsx
// ATUAL (errado)
<SubscriptionBadge tier={subscription.tier} subscriptionEnd={subscription.subscriptionEnd} />

// CORRETO
<SubscriptionBadge 
  tier={subscription.tier} 
  subscriptionEnd={subscription.subscriptionEnd}
  isTrialing={subscription.isTrialing}
  trialEnd={subscription.trialEnd}
/>
```

**BUG 2 — `create-checkout` não bloqueia usuário em `trialing`**
A linha 68-83 de `create-checkout/index.ts` verifica apenas `status: "active"`. Um usuário em trial (status `trialing`) pode abrir um novo checkout e criar conflito.
```typescript
// ATUAL — busca só active
status: "active"

// CORRETO — buscar active E trialing
status: "all" + filtrar active|trialing
```

**BUG 3 — `SubscriptionSuccess` não tem retry quando Stripe ainda não processou**
A página chama `checkSubscription()` uma vez imediatamente após o redirect. Se o Stripe ainda não processou o evento, a subscription retorna vazia e a tela fica em branco (sem plano exibido). Precisa de retry com delay de 2s, até 3 tentativas.

**BUG 4 — `SubscriptionSuccess` é rota pública mas usa `useAuth` sem garantia de usuário logado**
A rota `/subscription-success` está fora do `AppLayout` — qualquer pessoa pode acessar sem estar logada. Isso é aceitável como design mas o `openCustomerPortal` vai falhar sem auth. Adicionar guard.

### Correções

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Pricing.tsx` | Passar `isTrialing` e `trialEnd` ao `SubscriptionBadge` |
| `supabase/functions/create-checkout/index.ts` | Bloquear checkout se já tem subscription `active` OU `trialing` |
| `src/pages/SubscriptionSuccess.tsx` | Adicionar retry com 3 tentativas (2s de intervalo) ao verificar assinatura |
