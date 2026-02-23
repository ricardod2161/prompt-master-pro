

# Auditoria Completa: Seguranca, Engenharia e Design

## Resumo Executivo

Apos analise detalhada de todo o sistema (edge functions, RLS policies, frontend, hooks e fluxos publicos), identifiquei **12 problemas** que precisam ser corrigidos antes da implementacao no restaurante do cliente. Os problemas estao classificados por severidade.

---

## CRITICO - Seguranca

### 1. Edge Function `purchase-credits` usa `getUser()` em vez de `getClaims()`

**Arquivo:** `supabase/functions/purchase-credits/index.ts` (linha 29)

**Problema:** Usa `anonClient.auth.getUser(token)` que faz chamada extra ao servidor auth, violando o padrao do projeto (tech/auth-claims-standard). Alem disso, nao valida adequadamente o token.

**Correcao:** Trocar para `getClaims()` como nas demais edge functions.

### 2. Edge Function `generate-marketing-image` usa `getUser()` em vez de `getClaims()`

**Arquivo:** `supabase/functions/generate-marketing-image/index.ts` (linha 49)

**Problema:** Mesmo problema acima. Inconsistencia de autenticacao.

**Correcao:** Trocar para `getClaims()`.

### 3. Edge Function `test-evolution-connection` sem autenticacao

**Arquivo:** `supabase/functions/test-evolution-connection/index.ts`

**Problema:** Aceita qualquer requisicao sem validar JWT. Permite que qualquer pessoa teste conexoes com URLs arbitrarias, podendo ser usado como proxy SSRF (Server-Side Request Forgery).

**Correcao:** Adicionar validacao de JWT e verificar que o usuario tem acesso a uma unidade.

### 4. Politicas RLS excessivamente permissivas na tabela `leads`

**Linter detectou 6 warnings de `USING (true)` / `WITH CHECK (true)`:**

- `leads`: "Allow authenticated users to read leads" com `USING (true)` - qualquer usuario autenticado pode ler TODOS os leads. Deveria ser restrito a developers.
- `leads`: "Allow authenticated users to update leads" com `USING (true)` - qualquer usuario pode atualizar leads.
- `leads`: "Allow public insert" + "Anon can insert leads" - duplicadas, 2 policies fazem a mesma coisa.
- `admin_logs`: "System can insert logs" com `WITH CHECK (true)` - necessario para triggers, aceitavel.
- `units`: "Authenticated users can create units" com `WITH CHECK (true)` - necessario para onboarding.

**Correcao:** Remover policies duplicadas de `leads` e restringir read/update para developers apenas.

### 5. Creditos de marketing sao adicionados via URL query parameter sem verificacao de pagamento

**Arquivo:** `src/pages/MarketingStudio.tsx` (linhas 134-154)

**Problema CRITICO:** Quando o usuario retorna do Stripe, o codigo le `credits_purchased` e `unit_id` da URL e chama `add_marketing_credits` diretamente. Um usuario malicioso pode simplesmente navegar para `/marketing?credits_purchased=100&unit_id=XXX` e receber 100 creditos gratis sem pagar.

**Correcao:** Mover a logica de confirmacao de compra para uma edge function que valida a sessao do Stripe Checkout antes de creditar. Ou usar um webhook do Stripe para adicionar creditos automaticamente apos confirmacao de pagamento.

---

## ALTO - Engenharia

### 6. Sequencia de pedidos `orders_order_number_seq` e global, nao por unidade

**Problema:** O `reset_order_counter` e `reset_unit_data` resetam a sequencia global. Se houver 2 restaurantes no sistema, resetar o contador de um afeta todos. Pedidos de diferentes unidades podem ter numeros duplicados.

**Correcao:** Documentar esta limitacao explicitamente na UI (aviso de que afeta todas as unidades). Em producao multi-tenant real, considerar campo separado por unidade.

### 7. `send-order-notification` fallback de `frontendUrl` e fragil

**Arquivo:** `supabase/functions/send-order-notification/index.ts` (linha 384)

**Problema:** O fallback tenta construir a URL a partir da URL do Supabase com replace, o que pode gerar URLs invalidas. O secret `FRONTEND_URL` pode nao estar configurado.

**Correcao:** Verificar se `FRONTEND_URL` esta nos secrets e adiciona-lo se nao estiver. Usar fallback para a URL publicada conhecida (`https://restauranteos.lovable.app`).

### 8. `create-order-payment` nao valida autenticacao

**Arquivo:** `supabase/functions/create-order-payment/index.ts`

**Problema:** Nao ha nenhuma validacao de JWT nem verificacao de acesso. Qualquer pessoa com um `orderId` e `unitId` validos pode gerar sessoes de pagamento Stripe.

**Correcao:** Adicionar validacao hibrida (staff autenticado OU verificar que o pedido pertence ao par orderId/unitId, o que ja e feito parcialmente).

---

## MEDIO - Engenharia e Robustez

### 9. `CustomerOrder` nao sanitiza input do nome do cliente

**Arquivo:** `src/pages/CustomerOrder.tsx` e `src/hooks/useCustomerOrder.ts`

**Problema:** O nome do cliente e telefone sao inseridos diretamente no banco sem validacao de comprimento ou caracteres especiais.

**Correcao:** Adicionar validacao com zod para `customer_name` (max 100 chars) e `customer_phone` (formato brasileiro).

### 10. `purchase-credits` usa versao inconsistente da API Stripe

**Arquivo:** `supabase/functions/purchase-credits/index.ts` (linha 47)

**Problema:** Usa `apiVersion: "2025-08-27.basil"` enquanto `create-order-payment` usa `apiVersion: "2023-10-16"`. Inconsistencia pode causar bugs.

**Correcao:** Padronizar a versao da API Stripe em todas as edge functions.

### 11. `whatsapp-webhook` e muito grande (2713 linhas) em arquivo unico

**Problema de manutenibilidade:** Arquivo com quase 3000 linhas e dificil de depurar e manter. Nao e possivel dividir em subpastas nas edge functions, mas pode-se refatorar logica em funcoes mais claras.

**Nota:** Isso e uma melhoria futura, nao um blocker para deploy.

### 12. Falta pagina `/reset-password` para o fluxo de recuperacao de senha

**Problema:** O `AuthContext` configura `redirectTo: window.location.origin + '/reset-password'` mas nao ha rota `/reset-password` no `App.tsx`. Quando o usuario clica no link de recuperacao, cai no `NotFound`.

**Correcao:** Criar pagina simples de redefinicao de senha.

---

## Plano de Implementacao

### Fase 1 - Correcoes Criticas (Prioridade Maxima)

| # | Correcao | Arquivo |
|---|----------|---------|
| 5 | Remover logica de creditos por URL; criar webhook Stripe ou validacao server-side | `MarketingStudio.tsx` + nova edge function |
| 1 | `getClaims()` em `purchase-credits` | `supabase/functions/purchase-credits/index.ts` |
| 2 | `getClaims()` em `generate-marketing-image` | `supabase/functions/generate-marketing-image/index.ts` |
| 3 | Auth em `test-evolution-connection` | `supabase/functions/test-evolution-connection/index.ts` |
| 4 | Limpar RLS duplicadas e restritivas em `leads` | Migracao SQL |

### Fase 2 - Correcoes Altas

| # | Correcao | Arquivo |
|---|----------|---------|
| 6 | Aviso na UI sobre sequencia global | `DangerZoneSection.tsx` |
| 7 | Configurar `FRONTEND_URL` e melhorar fallback | `send-order-notification/index.ts` |
| 8 | Validacao de acesso em `create-order-payment` | `supabase/functions/create-order-payment/index.ts` |
| 12 | Criar pagina `/reset-password` | Novo arquivo `src/pages/ResetPassword.tsx` + rota |

### Fase 3 - Melhorias de Robustez

| # | Correcao | Arquivo |
|---|----------|---------|
| 9 | Validacao de input no pedido do cliente | `useCustomerOrder.ts` |
| 10 | Padronizar versao Stripe API | Todas edge functions com Stripe |

---

## Detalhes Tecnicos das Correcoes

### Correcao 5 - Creditos via URL (MAIS CRITICA)

Remover completamente o bloco `useEffect` que le `credits_purchased` da URL. Em vez disso, criar uma edge function `confirm-credit-purchase` que:
1. Recebe o `session_id` do Stripe
2. Valida a sessao com `stripe.checkout.sessions.retrieve()`
3. Verifica que `payment_status === 'paid'`
4. Verifica nos metadados o `unit_id`, `user_id` e `credits`
5. Chama `add_marketing_credits` apenas se a sessao for valida
6. Retorna os creditos adicionados

O `success_url` do Stripe mudara para `/marketing?session_id={CHECKOUT_SESSION_ID}` e o frontend chamara a edge function para confirmar.

### Correcao 12 - Pagina Reset Password

Criar `src/pages/ResetPassword.tsx` com:
- Deteccao de `type=recovery` no hash da URL
- Formulario para nova senha + confirmacao
- Chamada a `supabase.auth.updateUser({ password })`
- Redirecionar para `/login` apos sucesso

Adicionar rota publica em `App.tsx`:
```
<Route path="/reset-password" element={<ResetPassword />} />
```

### Correcao 4 - RLS Leads

```sql
-- Remover policies duplicadas e permissivas
DROP POLICY IF EXISTS "Allow authenticated users to read leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users to update leads" ON leads;
DROP POLICY IF EXISTS "Anon can insert leads" ON leads;
-- Manter: "Allow public insert on leads" (para formulario landing)
-- Manter: "Only developers can read leads" (ja existe)

-- Adicionar update apenas para developers
CREATE POLICY "Only developers can update leads" ON leads
FOR UPDATE USING (is_developer(auth.uid()));
```

