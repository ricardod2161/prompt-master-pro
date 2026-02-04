

# Plano: Preços Atualizados e Trial de 14 Dias

## 1. Novos Preços Confirmados

| Plano | Novo Preço |
|-------|------------|
| Starter | R$ 100/mês |
| Pro | R$ 150/mês |
| Enterprise | R$ 200/mês |

---

## 2. O Que Será Implementado

### Fase 1: Atualizar Preços no Código
- Modificar `src/lib/subscription-tiers.ts` com os novos valores
- Atualizar a página de Pricing para exibir os preços corretos

### Fase 2: Edge Function - Retornar Status do Trial
- Atualizar `check-subscription` para retornar:
  - `status` (trialing, active, past_due, canceled)
  - `isTrialing` (boolean)
  - `trialEnd` (data de término do trial)

### Fase 3: AuthContext - Gerenciar Estado do Trial
- Adicionar campos `isTrialing`, `trialEnd`, `status` ao estado de subscription
- Atualizar a verificação para considerar status de trial

### Fase 4: Componente TrialBanner
- Criar banner que mostra dias restantes do trial
- Exibir no topo do app quando usuário está em período de teste

### Fase 5: Bloqueio de Acesso
- No `AppLayout`, verificar se assinatura está válida
- Se trial expirado e sem pagamento → redirecionar para `/pricing`
- Mensagem clara explicando que o período de teste acabou

---

## 3. Fluxo de Acesso

```text
Usuário inicia trial
       ↓
  Dia 1-14: Acesso liberado + Banner "X dias restantes"
       ↓
  Dia 15 (sem pagamento): Bloqueio → Redireciona para /pricing
       ↓
  Usuário paga → Acesso restaurado
```

---

## 4. Ação Manual Necessária no Stripe

Como não posso criar preços automaticamente, você precisará criar 3 novos preços no Stripe Dashboard com:
- **trial_period_days: 14** em cada preço
- Valores: R$ 100, R$ 150, R$ 200

Depois me informe os novos `price_id` para eu atualizar no código.

---

## 5. Arquivos a Serem Modificados

1. `src/lib/subscription-tiers.ts` - Novos preços
2. `supabase/functions/check-subscription/index.ts` - Retornar trial status
3. `src/contexts/AuthContext.tsx` - Gerenciar estado do trial
4. `src/components/subscription/TrialBanner.tsx` - NOVO: Banner de dias restantes
5. `src/components/layout/AppLayout.tsx` - Bloqueio de acesso
6. `src/pages/Pricing.tsx` - Exibir novos preços

