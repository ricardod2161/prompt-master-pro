

# Plano: Atualizar Preços no Stripe

## Situação Atual

Os preços atuais no Stripe são:
- **Starter**: R$ 99,00 (price_1Sw7D7KBKtRrb6BSDHI3wTSm)
- **Pro**: R$ 199,00 (price_1Sw7F8KBKtRrb6BSXgHeKCsG)
- **Enterprise**: R$ 399,00 (price_1Sw7GEKBKtRrb6BSdkqlVaLt)

Nenhum tem trial period configurado.

---

## O Que Será Feito

### Criar 3 Novos Preços no Stripe

Usarei a ferramenta do Stripe para criar novos preços com os valores corretos e período de trial:

| Plano | Produto | Novo Preço | Trial |
|-------|---------|------------|-------|
| Starter | prod_Ttv3LNr32ThW8G | R$ 100/mês | 14 dias |
| Pro | prod_Ttv5fsMXdkwI7k | R$ 150/mês | 14 dias |
| Enterprise | prod_Ttv6ifEGhgCeOI | R$ 200/mês | 14 dias |

### Atualizar Código com Novos Price IDs

Após criar os preços, atualizarei o arquivo `src/lib/subscription-tiers.ts` com os novos `price_id` gerados.

---

## Limitação Importante

A ferramenta de criação de preços não permite configurar `trial_period_days` automaticamente. Por isso:

1. Criarei os preços com os valores corretos
2. Você precisará adicionar o trial de 14 dias manualmente no Stripe Dashboard:
   - Acesse cada preço
   - Em "Free trial" configure 14 dias

---

## Arquivos a Modificar

1. `src/lib/subscription-tiers.ts` - Atualizar os novos `priceId`

---

## Resultado Esperado

Após a implementação:
- Checkout usará preços de R$ 100, R$ 150 e R$ 200
- Clientes terão 14 dias de trial antes da primeira cobrança

