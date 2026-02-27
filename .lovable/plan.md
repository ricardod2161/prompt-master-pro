
## Análise de Engenharia — Sistema de Assinaturas

### Bugs Identificados

**BUG CRÍTICO #1 — `SubscriptionBadge` não usa `React.forwardRef`**
Console logs mostram DOIS warnings:
- `Warning: Function components cannot be given refs. Check the render method of Pricing. at SubscriptionBadge`
- `Warning: Function components cannot be given refs. Check the render method of Pricing. at PricingCard`

O `SubscriptionBadge` usa `<Tooltip><TooltipTrigger asChild>` — o `asChild` passa a ref para o filho (`<div>`), mas `<div>` não é um componente React que precisa de `forwardRef`. O problema real é que `TooltipTrigger asChild` requer que o filho aceite `ref`. **Correção**: remover `asChild` do `TooltipTrigger` ou encapsular o `div` interno.

No `PricingCard`, o `Settings` icon é importado no final do arquivo (linha 151) após o `export`, o que funciona em runtime mas é má prática e pode causar issues em strict mode. O warning vem de `PricingCard` porque ele usa componentes internos sem `forwardRef`.

**BUG CRÍTICO #2 — Trial de 14 dias NÃO está configurado no `create-checkout`**
A função `create-checkout` cria o checkout SEM parâmetro `subscription_data.trial_period_days`. O trial de 14 dias existe no Stripe mas NÃO é ativado via código — ele só funciona se configurado no Stripe Dashboard diretamente no plano. Para garantir consistência programática, o checkout deve passar `subscription_data: { trial_period_days: 14 }`.

**BUG #3 — `check-subscription` usa API version `2023-10-16` mas `create-checkout` usa `2025-08-27.basil`**
Inconsistência de versão da Stripe API entre as duas edge functions. Deve ser uniformizado para `2025-08-27.basil`.

**BUG #4 — `AppLayout` bloqueia acesso mesmo durante trial**
Linha 62: `if (status && status !== 'active' && status !== 'trialing')` — isso parece correto, mas há um edge case: quando a assinatura ainda não foi checada (`status === null`) e o usuário acaba de se registrar, ele não é bloqueado. Porém, usuários sem assinatura alguma (`subscribed: false`, `status: null`) passam livremente. Isso é intencional (acesso gratuito ilimitado) ou um bug? Com base na lógica atual, parece intencional — mas precisa ser documentado.

**BUG #5 — `SubscriptionBadge` sem período trial**
O badge não diferencia entre "ativo" e "em trial". Quando o usuário está em trial, o badge mostra "Pro" sem indicar que é um teste. O `AppLayout` já tem `TrialBanner` mas o badge não reflete o estado.

### Correções a implementar

1. **`supabase/functions/check-subscription/index.ts`**: Atualizar API version para `2025-08-27.basil`
2. **`supabase/functions/create-checkout/index.ts`**: Adicionar `subscription_data: { trial_period_days: 14 }` no `stripe.checkout.sessions.create`
3. **`src/components/subscription/SubscriptionBadge.tsx`**: Corrigir o warning do `TooltipTrigger asChild` — remover `asChild` e usar wrapper correto
4. **`src/components/subscription/PricingCard.tsx`**: Mover import do `Settings` para o topo do arquivo, e verificar se há ref issue
5. **`src/components/subscription/SubscriptionBadge.tsx`**: Adicionar suporte visual para status `isTrialing` — mostrar badge diferenciado "Pro (Trial)" ou similar

### Arquivos modificados
| Arquivo | Correção |
|---------|---------|
| `supabase/functions/check-subscription/index.ts` | Atualizar Stripe API version para `2025-08-27.basil` |
| `supabase/functions/create-checkout/index.ts` | Adicionar `trial_period_days: 14` no checkout |
| `src/components/subscription/SubscriptionBadge.tsx` | Corrigir ref warning + indicador visual de trial |
| `src/components/subscription/PricingCard.tsx` | Mover import `Settings` para o topo, corrigir estrutura |
