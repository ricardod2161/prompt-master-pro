
# Auditoria Completa do Sistema - GastroHub/RestaurantOS

## Resumo Executivo

Apos uma analise detalhada do codigo frontend, backend (edge functions), banco de dados e politicas de seguranca, identifiquei **18 problemas** categorizados por severidade. Abaixo esta o plano completo de correcoes e melhorias.

---

## CRITICOS (Devem ser corrigidos imediatamente)

### 1. Dashboard calcula receita excluindo pedidos "completed"
**Arquivo:** `src/hooks/useDashboard.ts` (linha 147)
**Problema:** O filtro `o.status !== "cancelled" && o.status !== "completed"` exclui pedidos finalizados do calculo de receita. Pedidos completados (mesa fechada) nao contam no faturamento diario.
**Correcao:** Alterar para excluir apenas `cancelled`:
```typescript
const validOrders = todayOrders?.filter((o) => o.status !== "cancelled") || [];
```

### 2. Inventory movement sem protecao de race condition
**Arquivo:** `src/hooks/useInventory.ts` (linhas 139-174)
**Problema:** A leitura do estoque atual e a atualizacao sao feitas em dois comandos separados. Se dois usuarios moverem estoque ao mesmo tempo, os valores ficam inconsistentes.
**Correcao:** Criar uma database function RPC `add_inventory_movement` que faz SELECT + INSERT + UPDATE de forma atomica dentro de uma transacao.

### 3. Edge Function `check-subscription` usa `getUser()` em vez de `getClaims()`
**Arquivo:** `supabase/functions/check-subscription/index.ts` (linha 44)
**Problema:** Inconsistente com a politica documentada de usar `getClaims()` para validacao JWT. `getUser()` faz uma chamada extra ao servidor.
**Correcao:** Substituir `getUser()` por `getClaims()` e obter email via claims ou lookup separado quando necessario.

### 4. Edge Function `customer-portal` usa `getUser()` em vez de `getClaims()`
**Arquivo:** `supabase/functions/customer-portal/index.ts` (linha 42)
**Problema:** Mesmo problema do item 3.

### 5. Edge Function `create-checkout` usa `getUser()` via `SUPABASE_ANON_KEY`
**Arquivo:** `supabase/functions/create-checkout/index.ts` (linhas 20-24, 40)
**Problema:** Usa anon key para criar o client e depois `getUser()`. Deveria usar service role key com `getClaims()` para consistencia e seguranca.

### 6. Politicas RLS com `WITH CHECK (true)` em tabelas sensiveis
**Tabelas afetadas:** `leads` (2x INSERT), `admin_logs` (INSERT), `pix_transactions` (INSERT anon), `orders` (INSERT public), `units` (INSERT)
**Problema:** O linter identificou 7 politicas permissivas. Embora algumas sejam intencionais (leads, orders de mesa), a politica de INSERT anonimo em `pix_transactions` permite que qualquer pessoa insira transacoes falsas.
**Correcao:** Revisar e restringir `pix_transactions` INSERT anonimo para exigir que `order_id` exista e pertenca a um pedido valido via subquery.

---

## ALTOS (Devem ser corrigidos em breve)

### 7. `useSplitBill` usa REST API direto com anon key hardcoded
**Arquivo:** `src/hooks/useSplitBill.ts` (linhas 55-68, 131-153)
**Problema:** Em vez de usar o client Supabase, faz `fetch()` direto com a anon key. Isso ignora o interceptor de autenticacao e a tipagem TypeScript. Se a tabela `bill_payments` nao existir, falha silenciosamente.
**Correcao:** Migrar para `supabase.from("bill_payments")` quando a tabela estiver nos tipos, ou usar `supabase.rpc()`.

### 8. Subscription check a cada 60 segundos
**Arquivo:** `src/contexts/AuthContext.tsx` (linha 106)
**Problema:** Polling a cada minuto para verificar subscription faz chamadas desnecessarias ao Stripe. Isso pode gerar rate limiting.
**Correcao:** Aumentar intervalo para 5-10 minutos e usar `visibilitychange` event para verificar quando o usuario volta a aba.

### 9. `useWhatsAppChat` tem console.log em producao
**Arquivo:** `src/hooks/useWhatsAppChat.ts` (linhas 109, 129, 210, 221, 234)
**Problema:** Multiplos `console.log` de debug que vazam dados de conversas no console do usuario.
**Correcao:** Remover ou substituir por logging condicional (`if (import.meta.env.DEV)`).

### 10. WhatsApp send message nao envia via Evolution API
**Arquivo:** `src/hooks/useWhatsAppChat.ts` (linhas 159-176)
**Problema:** O comentario diz "This would need to integrate with Evolution API". Mensagens enviadas pelo admin sao apenas inseridas no banco, mas nao chegam ao WhatsApp do cliente.
**Correcao:** Criar edge function `send-whatsapp-message` que receba o conteudo e envie via Evolution API, e chama-la aqui.

---

## MEDIOS (Melhorias de robustez)

### 11. `useOrders` - delete cascade manual fragil
**Arquivo:** `src/hooks/useOrders.ts` (linhas 182-188)
**Problema:** A exclusao de pedidos faz 4 deletes sequenciais sem transacao. Se o segundo falhar, dados ficam orfaos.
**Correcao:** Criar uma RPC `delete_order_cascade` que faca tudo em uma transacao.

### 12. `UnitContext` - `fetchUnits` nao esta em `useCallback`
**Arquivo:** `src/contexts/UnitContext.tsx` (linha 29)
**Problema:** A funcao `fetchUnits` e recriada a cada render, causando o warning de dependencia do `useEffect` (linha 62).
**Correcao:** Envolver `fetchUnits` em `useCallback` com `[user]` como dependencia.

### 13. QueryClient sem configuracao de retry e error handling global
**Arquivo:** `src/App.tsx` (linha 40)
**Problema:** `new QueryClient()` sem configuracao. Isso usa 3 retries padrao que podem causar spam de requisicoes em erro.
**Correcao:** Configurar com retry inteligente:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if ((error as any)?.status === 403 || (error as any)?.status === 401) return false;
        return failureCount < 2;
      },
      staleTime: 30 * 1000,
    },
  },
});
```

### 14. `send-order-notification` CORS headers incompletos
**Arquivo:** `supabase/functions/send-order-notification/index.ts` (linha 7)
**Problema:** Headers CORS nao incluem os headers extras do Supabase client (`x-supabase-client-platform`, etc.), diferente das outras edge functions.
**Correcao:** Atualizar para usar os mesmos headers CORS padrao.

### 15. Tracking URL gerada com logica fragil
**Arquivo:** `supabase/functions/send-order-notification/index.ts` (linha 384)
**Problema:** A URL de tracking e construida com `replace('.supabase.co', '.lovable.app')` que so funciona no ambiente Lovable preview. Em producao com dominio customizado, a URL sera invalida.
**Correcao:** Usar uma variavel de ambiente `FRONTEND_URL` ou o origin da request.

---

## BAIXOS (Melhorias de qualidade)

### 16. Login permite signup sem confirmacao de email
**Arquivo:** `src/pages/Login.tsx` (linha 86-88)
**Problema:** Apos signup, navega direto para `/select-unit` sem esperar confirmacao de email.
**Correcao:** Mostrar mensagem "Verifique seu email para confirmar sua conta" em vez de navegar.

### 17. `useDashboard` nao usa React Query
**Arquivo:** `src/hooks/useDashboard.ts`
**Problema:** Usa `useState` + `useEffect` manual em vez de `useQuery`. Isso perde cache, deduplicacao de requests, e error handling do React Query.
**Correcao:** Refatorar para usar `useQuery` com queryKey baseado em `selectedUnit.id` e data.

### 18. `config.toml` - `create-checkout` e `customer-portal` faltam entry
**Arquivo:** `supabase/config.toml`
**Problema:** As functions `create-checkout`, `customer-portal` e `check-subscription` nao estao listadas no config.toml. Embora funcionem com o default (`verify_jwt = true`), isso causa erro com signing-keys.
**Correcao:** Adicionar entries com `verify_jwt = false` e validar JWT no codigo (ja fazem isso parcialmente).

---

## Ordem de Implementacao Sugerida

1. **Fase 1 - Criticos** (itens 1-6): Corrigir dashboard, race condition de estoque, padronizar auth em edge functions, e revisar RLS
2. **Fase 2 - Altos** (itens 7-10): Migrar split bill, otimizar polling, limpar logs, implementar envio real de mensagens
3. **Fase 3 - Medios** (itens 11-15): Melhorar cascading deletes, QueryClient, CORS, tracking URL
4. **Fase 4 - Baixos** (itens 16-18): Fluxo de signup, refatorar dashboard, config.toml

Cada item pode ser implementado de forma independente. Posso comecar por qualquer fase ou item especifico que voce preferir.
