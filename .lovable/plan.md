
## Análise Técnica Completa — Página de Mesas (Tables.tsx)

### Diagnóstico do estado atual (970 linhas)

**Problemas encontrados após leitura completa do código:**

---

**BUG CRÍTICO 1 — `onCloseBill` está com stub vazio (linhas 961-963)**
```tsx
onCloseBill={async (phone) => {
  toast({ title: "Conta fechada!", description: `Resumo enviado para ${phone}` });
}}
closingBill={false}
billClosed={false}
```
O hook `useTableBill` existe e está completo em `src/hooks/useTableBill.ts` — fecha pedidos, atualiza status da mesa, notifica WhatsApp e tem controle de estado próprio. Mas a página `Tables.tsx` **nunca chama esse hook**. O botão "Fechar Conta" na prática não faz nada além de mostrar um toast. O `TableBillSheet` recebe dados calculados manualmente da página ao invés de usar o hook dedicado.

**BUG CRÍTICO 2 — `useOrders()` sem filtro de data na página Tables.tsx (linha 635)**
Chama `useOrders()` sem nenhum filtro, buscando os últimos 200 pedidos de toda a história da unidade para montar o mapa de pedidos ativos por mesa. Deveria filtrar apenas pedidos de hoje com status ativos. Um restaurante movimentado terá mesas com pedidos de dias anteriores erroneamente exibidos como ativos.

**BUG CRÍTICO 3 — `useTables` usa `refetchQueries` ao invés de `invalidateQueries` no Realtime**
```ts
queryClient.refetchQueries({ queryKey: ["tables", selectedUnit.id] });
```
A chave correta seria `["tables", selectedUnit?.id]` — a inconsistência entre `selectedUnit.id` (sem `?`) e `["tables", selectedUnit?.id]` (com `?`) pode causar falha no invalidate quando a unidade muda.

---

**MELHORIAS OPERACIONAIS IMPORTANTES:**

**1. Sem ação direta de "Novo Pedido" no card da mesa**
Quando a mesa está "Livre" ou "Ocupada", não há botão rápido para abrir o PDV com a mesa pré-selecionada. O operador precisa ir para o PDV e reselecionar a mesa. Adicionar um botão "+ Pedido" que navega para `/pos?table=<id>` no card economiza 3 cliques por pedido.

**2. Tempo de ocupação usando `updated_at` é impreciso**
`updated_at` muda a cada qualquer atualização da mesa — inclusive quando o status volta de `occupied` para `free` e depois para `occupied` novamente. O tempo exibido fica incorreto. A solução correta é adicionar um campo `occupied_at` no banco que só é preenchido ao mudar para `occupied`/`pending_order` e é limpo ao liberar.

**3. Botão "Liberar" mesa sem pedir confirmação quando há pedidos ativos**
Se a mesa tem pedidos com status `pending`/`preparing`, o botão "Liberar" a libera imediatamente sem aviso. Isso é perigoso — pedidos ficam órfãos. Deve verificar `activeOrders.length > 0` e exibir um `AlertDialog` de confirmação antes de liberar.

**4. Filtro de status usa `<Select>` quando seria melhor como chips inline**
Com apenas 4 opções (Todas, Livre, Ocupada, Aguardando), chips/tabs horizontais são mais rápidos de operar que um dropdown — especialmente no celular, onde o dropdown fecha o teclado virtual e requer dois taps.

**5. Sem indicador de "tempo médio de ocupação" no card de métricas**
A variável `avgOccupiedTime` é calculada (linhas 679-687) e passada para `TableMetrics`, mas **não é renderizada** no componente `TableMetrics` — o prop existe na interface mas o array `metricsData` não o usa. É um dado útil que está sendo descartado.

**6. `handleToggleStatus` cicla pelos 3 estados de forma confusa para o usuário**
Clicar no card alterna: `free → occupied → pending_order → free`. Um operador clicando sem querer pode colocar a mesa em `pending_order` quando queria só marcar como ocupada. Deveria ser um menu de contexto ou botões explícitos ao invés de ciclo cego.

**7. Viewport atual (715px) — grid `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`**
No viewport atual de 715px o breakpoint é `sm` (640px), então exibe 2 colunas. Com 4+ mesas, cada card fica com ~330px — aceitável, mas as métricas ficam em `grid-cols-2` (2 linhas de 2 + 1 sobrando), o que é desnecessário. `grid-cols-3 md:grid-cols-5` seria melhor.

**8. `pixConfig` sempre passado como `undefined` para `TableBillSheet`**
O componente aceita `pixConfig` para mostrar QR Code do Pix, mas a página não busca as configurações de Pix da unidade. O `useTableBill` também não retorna `pixConfig`. Resultado: o QR Code Pix **nunca é exibido** no fechar conta mesmo que o restaurante tenha configurado a chave Pix.

**9. `useTables` Realtime usa nome de canal fixo "tables-realtime"**
Se houver duas unidades abertas em abas diferentes, ambas criarão o canal com o mesmo nome e haverá conflito. Deve ser `tables-realtime-${selectedUnit.id}`.

**10. Ação de deletar mesa sem verificar pedidos ativos**
O `AlertDialog` de exclusão diz "Pedidos vinculados serão desassociados" mas não avisa quantos pedidos ativos existem. Deveria mostrar: "Esta mesa possui 2 pedidos ativos (R$ 87,50). Confirmar remoção?"

---

## Plano de Implementação

### Arquivos a modificar:

**`src/pages/Tables.tsx`**
- Substituir o stub `onCloseBill` pelo hook `useTableBill(billSheetTable.id, selectedUnit?.id)` corretamente
- Passar `closingBill`, `billClosed` e `closeBill` reais do hook para o `TableBillSheet`
- Buscar `pixConfig` da tabela `unit_settings` via query para passar ao `TableBillSheet`
- Corrigir `useOrders()` para filtrar apenas hoje + status ativos: `useOrders({ date: new Date() })`
- Adicionar confirmação no botão "Liberar" quando há pedidos ativos
- Adicionar botão "+ Pedido" no card (navega para `/pos?tableId=<id>`)
- Renderizar `avgOccupiedTime` no componente `TableMetrics` como 6ª métrica
- Trocar o `<Select>` de filtro de status por chips/tabs inline
- Adicionar aviso de pedidos ativos no `AlertDialog` de exclusão

**`src/hooks/useTables.ts`**
- Corrigir nome do canal Realtime para `tables-realtime-${selectedUnit.id}`
- Trocar `refetchQueries` por `invalidateQueries` com chave consistente

**`src/pages/POS.tsx`** (pequena adição)
- Ler parâmetro `?tableId=` da URL e pré-selecionar a mesa ao carregar, fechando o loop com o botão "+ Pedido"

### O que NÃO muda:
- Layout visual dos cards (já está bom)
- `TableBillSheet`, `SplitBillSheet`, `TableQRCodeDialog` — componentes prontos e funcionais
- `CreateTablesDialog` — está correto
- Lógica de alertas de tempo (1h/2h) — está implementada e funcionando
