
## Análise Técnica Completa — Página de Pedidos (Orders.tsx)

### Diagnóstico (915 linhas lidas integralmente)

---

**BUG CRÍTICO 1 — `OrderMetrics` filtra "hoje" no cliente com dados históricos do servidor (linhas 57-73)**

O `useOrders()` na linha 635 é chamado SEM filtro de data — ele busca até 200 pedidos históricos. A `OrderMetrics` então filtra por `today` no front-end:
```tsx
const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
```
Problemas:
- Restaurante com mais de 200 pedidos históricos: métricas incorretas (pedidos de hoje podem ser cortados pelo `limit(200)`)
- Tráfego desnecessário: baixa 200 pedidos quando só precisa dos de hoje para métricas
- Correto seria: `useOrders({ date: new Date() })` passando a data de hoje

**BUG CRÍTICO 2 — `MobileOrderCard` conta `order.order_items?.length` em vez de quantidade total**
```tsx
{order.order_items?.length || 0} itens
```
Um pedido com 3x X-Burguer e 2x Coca-Cola aparece como "2 itens" em vez de "5 itens". O `OrderKanbanCard` tem o mesmo bug (linha 174). Ambos devem usar `reduce((s,i) => s+i.quantity, 0)`.

**BUG CRÍTICO 3 — `extractChangeInfo` faz regex em `order.notes` mas o campo não existe mais**

A função (linha 306) procura "Troco para" no campo `notes`:
```ts
const match = notes.match(/Troco para:?\s*R?\$?\s*([\d.,]+)/i);
```
Mas o `change_for` agora é uma coluna dedicada na tabela `orders` (confirmado no schema). O troco NUNCA será exibido porque está procurando no lugar errado. Deveria usar `order.change_for` diretamente.

**BUG CRÍTICO 4 — Kanban não atualiza o pedido selecionado após mutação**
Quando o usuário muda o status de um pedido no modal e o `useOrders` refetch acontece, o `selectedOrder` state ainda aponta para o objeto antigo (stale). O modal exibe o status antigo com o botão "ativo" incorreto até fechar e reabrir. Deve ser corrigido via `useEffect` que sincroniza `selectedOrder` com a lista atualizada.

**BUG CRÍTICO 5 — `handleStatusChange` chama `printKitchenTicket` diretamente ignorando `auto_print_enabled`**

Na linha 679-681:
```ts
if (order && status === "preparing" && previousStatus !== "preparing") {
  await printKitchenTicket(order); // ← sempre imprime!
}
```
Mas `usePrintOrder` exporta `printOnPreparing` que verifica `settings.auto_print_enabled`. O `handleStatusChange` ignora essa verificação e imprime sempre — um bug de integração entre os dois hooks.

---

**PROBLEMAS DE UX/OPERACIONAIS:**

**1. Sem ação rápida de status no Kanban sem abrir modal**
No Kanban view, para avançar um pedido de "Pendente" → "Preparando" → "Pronto" o operador deve: clicar no card → aguardar modal abrir → clicar no botão de status → fechar modal. São 4 cliques por transição. Em um restaurante movimentado com 10-15 pedidos simultâneos, isso é crítico. Solução: botão de "avançar status" diretamente no `OrderKanbanCard` (ação primária) sem precisar abrir o modal.

**2. Filtros de Status e Canal são `<Select>` — lento para operar**
Idêntico ao problema já corrigido em Tables e POS: chips inline com contador são 2x mais rápidos. Ex: "Pendentes (3)" em chip é mais informativo e rápido que um dropdown "Pendente" sem contagem.

**3. Sem indicador de urgência/tempo no Kanban**
Cards no Kanban mostram "Há X minutos" mas não há distinção visual para pedidos atrasados (ex: pendente há mais de 15 min → borda vermelha, preparando há mais de 30 min → borda laranja). O KDS já tem essa lógica — deveria ser reutilizada.

**4. Sem campo de busca por telefone no Kanban**
A busca filtra `filteredOrders` que é a lista completa. No modo Kanban, todos os 4 grupos são afetados. Mas no modo Tabela, não há busca por `order.notes` (ex: buscar pelo endereço de entrega). Pequena lacuna.

**5. Sem ação de notificação manual no modal (só notifica automaticamente em "Pronto")**
Se o operador quiser enviar uma notificação extra (ex: pedido atrasando), não há botão. Outros sistemas como iFood têm "Notificar cliente" como ação explícita.

**6. Botão "Excluir" disponível para `delivered` e `completed` — risco operacional**
O botão aparece em qualquer pedido com status `delivered/completed/cancelled`. Um operador pode excluir acidentalmente um pedido pago sem querer. Deveria exigir role `admin` ou pelo menos um campo de confirmação com o número do pedido digitado.

**7. Vista Tabela não tem ordenação por coluna**
Clicar no header "Total" ou "Data/Hora" não ordena — os dados ficam na ordem do servidor. Seria simples adicionar `useState` de sortField + sortOrder e `useMemo` para ordenar client-side.

**8. Modal de detalhes sem ação de "Abrir no PDV" para mesas**
Se o pedido é de canal `table`, não há link rápido para a tela de Mesas para ver o status da mesa. Útil para o operador verificar se a mesa já foi fechada.

**9. `useOrders` cria canal Realtime que escuta QUALQUER atualização de `orders` mas não atualiza `selectedOrder`**
O canal Realtime (linha 99-118 em useOrders.ts) refaz a query e atualiza a lista, mas o `selectedOrder` no modal fica stale. O operador vê o status antigo no modal enquanto a lista em background já atualizou.

**10. Impressão via `printOnPreparing` não é chamada corretamente**
`printOnPreparing` recebe `(order, newStatus, previousStatus)` mas na linha 679-681 de Orders.tsx, o código chama `printKitchenTicket(order)` diretamente sem passar pelo wrapper `printOnPreparing`. A configuração `auto_print_enabled` é completamente ignorada.

---

## Plano de Implementação

### Arquivos a modificar:

**`src/pages/Orders.tsx`** — foco total aqui
1. **Corrigir métricas**: chamar `useOrders({ date: new Date() })` para as métricas + `useOrders(filtros_do_usuário)` para a lista (duas queries separadas — uma pequena, uma filtrada pelo usuário)
2. **Corrigir `change_for`**: substituir `extractChangeInfo(order.notes)` por `order.change_for` diretamente
3. **Corrigir contagem de itens**: `reduce((s,i) => s+i.quantity, 0)` em Kanban Card e Mobile Card
4. **Corrigir auto-print**: substituir `printKitchenTicket(order)` por `printOnPreparing(order, status, previousStatus)` em `handleStatusChange`
5. **Sync `selectedOrder`**: adicionar `useEffect` que, quando `orders` atualizar, sincroniza o `selectedOrder` com o dado mais recente da lista
6. **Botão de avançar status no Kanban Card**: ícone "→" no card que avança diretamente para o próximo status (pending→preparing→ready→delivered) sem abrir modal
7. **Indicador de urgência visual**: cor de borda no card do Kanban baseada no tempo de espera (>15min pendente = amarelo intenso, >30min = vermelho)
8. **Filtros como chips inline**: substituir os dois `<Select>` de status e canal por chips com contador em tempo real
9. **Ordenação na vista tabela**: clicar nos headers Data, Total e Status para ordenar

### O que NÃO muda:
- `useOrders` hook — estrutura correta
- `OrderDetailsModal` — estrutura boa, apenas corrigir o `change_for` e sync de estado
- `usePrintOrder` — correto, apenas corrigir quem o chama
- Vista Kanban geral — layout está bom
- Vista Tabela — layout está bom, apenas adicionar ordenação
