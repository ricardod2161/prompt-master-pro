
# Plano: Ajuste de Preços e Trial de 14 Dias

## 1. Resumo

Vou criar novos preços no Stripe com trial de 14 dias e atualizar o sistema para bloquear acesso após o período de teste se não houver pagamento.

---

## 2. Sugestão de Novos Preços

Baseado no mercado brasileiro de sistemas para restaurantes, sugiro uma redução:

| Plano | Preço Atual | Preço Sugerido | Redução |
|-------|-------------|----------------|---------|
| Starter | R$ 99 | R$ 69 | -30% |
| Pro | R$ 199 | R$ 149 | -25% |
| Enterprise | R$ 399 | R$ 299 | -25% |

Esses preços ficam competitivos com concorrentes como iFood Gestor, Sischef, etc.

---

## 3. Implementação do Trial de 14 Dias

### O Que Será Feito

1. **Criar novos preços no Stripe** com `trial_period_days: 14`
2. **Atualizar `subscription-tiers.ts`** com os novos IDs de preço
3. **Melhorar o bloqueio de acesso** no `AuthContext` para verificar status de trial

### Como o Trial Funciona

```text
Dia 1-14 (Trial)          Dia 15+ (Sem Pagamento)
+-------------------+     +----------------------+
| Acesso completo   |     | Bloqueio automático  |
| ao plano escolhido| --> | Redireciona para     |
| Sem cobrança      |     | página de pricing    |
+-------------------+     +----------------------+
                                    |
                                    v
                          +----------------------+
                          | Usuário paga         |
                          | Acesso restaurado    |
                          +----------------------+
```

---

## 4. Etapas de Implementação

### Fase 1: Criar Novos Preços no Stripe
- Criar 3 novos preços com valores reduzidos
- Configurar `trial_period_days: 14` em cada preço

### Fase 2: Atualizar Código
- Atualizar `src/lib/subscription-tiers.ts` com novos price IDs
- Atualizar valores exibidos na UI

### Fase 3: Melhorar Controle de Acesso
- Criar componente `TrialBanner` para mostrar dias restantes
- Criar página `TrialExpired` para usuários com trial expirado
- Atualizar `AuthContext` para verificar status de trial via Stripe

---

## 5. Lógica de Bloqueio

Quando o Stripe retorna `subscription.status`:
- `trialing` = acesso liberado, mostrar banner de dias restantes
- `active` = acesso liberado, cliente pagante
- `past_due` = acesso bloqueado, pagamento pendente
- `canceled` = acesso bloqueado
- Sem assinatura = redirecionar para /pricing

---

## 6. Seção Técnica

### Atualização do check-subscription

```typescript
// Retornar status do trial junto com a assinatura
const subscription = subscriptions.data[0];
const isTrialing = subscription.status === 'trialing';
const trialEnd = subscription.trial_end 
  ? new Date(subscription.trial_end * 1000).toISOString() 
  : null;

return {
  subscribed: true,
  tier,
  productId,
  subscriptionEnd,
  status: subscription.status,
  isTrialing,
  trialEnd
};
```

### Componente TrialBanner

```typescript
// Exibir dias restantes do trial
const daysLeft = Math.ceil((new Date(trialEnd) - new Date()) / (1000 * 60 * 60 * 24));
// "Você tem X dias restantes no seu período de teste"
```

### Proteção de Rotas

```typescript
// No AppLayout ou rota protegida
if (!subscription.subscribed && !subscription.isTrialing) {
  return <Navigate to="/pricing" />;
}
```

---

## 7. Confirmação Necessária

Preciso que você confirme os novos valores antes de criar os preços:

| Plano | Novo Preço |
|-------|------------|
| Starter | R$ 69/mês |
| Pro | R$ 149/mês |
| Enterprise | R$ 299/mês |

Esses valores estão ok para você, ou prefere outros?
