# Arquitetura Multi-Wallet de Créditos de IA

Hoje o RestaurantOS (e qualquer sistema futuro) compartilha o mesmo saldo global de créditos do Lovable AI Gateway. Vamos introduzir uma camada de **carteiras isoladas por sistema (system_id)** dentro do próprio banco, sem alterar como o Lovable cobra internamente — o controle passa a ser nosso.

## 1. Conceito

Cada "sistema" (Restaurante, WhatsApp, Clínica, CRM, Financeiro, etc.) vira uma entidade `ai_system` com:
- Wallet própria (saldo, usado, limites diário/mensal)
- Configuração de IA (provedor, modelo padrão, API key opcional)
- Histórico e logs isolados por RLS
- Status ativo/bloqueado

Uma requisição de IA **obrigatoriamente** informa `system_id`. Sem isso, é rejeitada.

## 2. Modelo de Dados (novas tabelas)

```text
ai_systems
├── id (uuid)
├── slug (ex: 'restaurant', 'whatsapp', 'clinic')
├── name, description, icon
├── unit_id (nullable — sistemas podem ser globais ou por unidade)
├── status ('active' | 'blocked' | 'suspended')
├── provider ('lovable' | 'openai' | 'custom')
├── default_model, api_key_secret_name
└── created_at, updated_at

ai_system_wallets
├── id, system_id (unique)
├── available_credits (numeric)
├── used_credits (numeric)
├── monthly_limit, daily_limit (nullable)
├── last_reset_at, last_used_at
└── updated_at

ai_system_transactions   (todo débito/crédito)
├── id, system_id, user_id
├── type ('debit' | 'credit' | 'refund' | 'monthly_reset' | 'admin_adjust')
├── amount (numeric, negativo para débito)
├── model, tokens_input, tokens_output
├── estimated_cost_usd
├── response_time_ms
├── metadata (jsonb)
└── created_at

ai_system_limits_log     (bloqueios por limite)
```

RLS: apenas `developer`/`admin` da unidade veem/gerenciam. Debit/credit só via funções `SECURITY DEFINER`.

## 3. Camada de Débito (RPC atômico)

Duas funções no Postgres:

- `ai_debit_credits(_system_id, _user_id, _amount, _model, _tokens_in, _tokens_out, _response_ms, _metadata)`
  - Lock da wallet (`FOR UPDATE`)
  - Valida status = active
  - Valida limite diário/mensal (SUM das transactions do período)
  - Se saldo insuficiente → RAISE `INSUFFICIENT_CREDITS`
  - Atualiza wallet + insere transaction
- `ai_credit_add(_system_id, _amount, _reason)` para top-ups administrativos

Isolamento garantido: função só toca a linha do `system_id` recebido.

## 4. Wrapper de IA (`_shared/ai-wallet.ts`)

Novo helper em `supabase/functions/_shared/`:

```ts
callAIWithWallet({ systemId, unitId, userId, model, messages })
  → 1. Lê ai_systems + wallet
  → 2. Pré-check saldo (estimativa)
  → 3. Chama Lovable Gateway (ou provider custom se api_key_secret_name)
  → 4. Após resposta: RPC ai_debit_credits com tokens reais
  → 5. Retorna resposta + metadados de billing
```

Todas as edge functions de IA (`whatsapp-webhook`, `generate-prompt`, `marketing-*`, futuras) passarão por este wrapper. **Nenhuma** chamada direta ao gateway sem `systemId`.

O `ai-with-fallback.ts` atual (Lovable→OpenAI) é preservado e envolvido pelo novo wrapper.

## 5. Seed inicial de sistemas

Já cadastrados na migração:
- `restaurant` — módulo de pedidos/menu
- `whatsapp` — bot conversacional
- `marketing` — geração de imagens
- Placeholders inativos: `clinic`, `crm`, `financial`, `realestate`, `legal`, `inventory`, `support`

Cada um recebe wallet inicial com saldo configurável (default 0, admin recarrega).

## 6. Painel Administrativo (`/admin` → nova aba "Carteiras IA")

Componente `AISystemsWalletPanel.tsx`:

- Grid de cards por sistema com: saldo, usado hoje/mês, último uso, modelo mais usado, custo estimado USD
- Ações por sistema: **Adicionar créditos**, **Remover**, **Bloquear/Desbloquear**, **Editar limites**, **Configurar provider/API key**
- Drawer com histórico de transações (tabela paginada)
- Gráfico de consumo diário (últimos 30 dias) por sistema
- Filtros: período, sistema, modelo

Substitui/estende o `AIMetricsPanel` atual (mantém as métricas, adiciona a dimensão wallet).

## 7. Migração dos consumidores atuais

Refatorar (mantendo comportamento):
- `supabase/functions/whatsapp-webhook/index.ts` → passa `systemId: 'whatsapp'`
- `supabase/functions/generate-prompt/index.ts` → `systemId: 'whatsapp'` (é prompt do bot)
- `supabase/functions/generate-marketing-image/*` → `systemId: 'marketing'`
- Qualquer outra chamada ao gateway → recebe systemId apropriado

Erro `INSUFFICIENT_CREDITS` propaga como resposta amigável (WhatsApp responde "sistema temporariamente indisponível", painel mostra alerta).

## 8. Segurança / RLS

- `ai_systems`, `ai_system_wallets`, `ai_system_transactions`: SELECT apenas para admin/developer com `has_unit_access`
- INSERT/UPDATE/DELETE: bloqueado para roles normais; só via RPC SECURITY DEFINER
- API keys custom: nunca em coluna texto — armazenadas como secret do Supabase, tabela guarda só o `secret_name`
- Logs de admin (`admin_logs`) registram toda alteração de saldo/bloqueio

## 9. Validação

- Teste manual: consumir no WhatsApp e conferir que só a wallet `whatsapp` mexeu
- Teste manual: bloquear `marketing` e tentar gerar imagem → erro controlado
- Query de conferência: SUM(transactions) por system_id == wallet.used_credits
- Confirmar que `restaurant` permanece intacto após execução de whatsapp/marketing

## 10. Escopo desta entrega

**Incluído:**
1. Migração completa (tabelas, funções, RLS, seed)
2. Wrapper `_shared/ai-wallet.ts`
3. Refatoração das 3 edge functions ativas de IA
4. Painel admin (`AISystemsWalletPanel`) com todas as ações listadas
5. Hook `useAISystems` no frontend
6. Documentação inline do fluxo para adicionar novo sistema

**Não incluído (fica pronto para expansão):**
- Integração real com billing externo (Stripe) para compra de créditos — botão fica com placeholder de RPC `ai_credit_add`
- Sistemas placeholders (clínica, jurídico, etc.) entram inativos, sem UI dedicada

## Riscos

- Refatorar `whatsapp-webhook` (3400+ linhas) é sensível — faremos alteração cirúrgica **apenas** no ponto de chamada ao gateway, sem mexer na lógica do bot
- Cobrança pós-resposta: se o Postgres cair entre a chamada de IA e o débito, o crédito não é debitado (aceitável; log fica na `ai_provider_logs`)

Aguardando aprovação para executar.
