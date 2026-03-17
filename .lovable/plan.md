
## Análise Completa da Página de Cardápio (Menu.tsx)

### Diagnóstico do estado atual (1239 linhas lidas integralmente)

---

**BUG CRÍTICO 1 — `orderCounts` busca TODOS os pedidos históricos sem filtro de unidade ou data (linhas 198-202)**

```ts
supabase
  .from("order_items")
  .select("product_id, quantity")
  .not("product_id", "is", null)
```
Dois problemas gravíssimos:
1. **Sem filtro de `unit_id`**: a query busca order_items de TODAS as unidades do sistema (se RLS permitir). O badge de contagem de um produto pode incluir pedidos de outras unidades.
2. **Sem filtro de data**: o badge mostra pedidos de toda a história, não do dia de hoje. Um produto vendido há 2 anos aparece com count alto, distorcendo completamente o indicador de popularidade.
3. **N+1 implícito**: busca todos os produtos da unidade em uma sub-query dentro do `fetchData`, gerando uma requisição aninhada desnecessária.

Correto seria filtrar apenas pedidos `de hoje` via JOIN com `orders` filtrado por `unit_id` e `created_at >= hoje`.

**BUG CRÍTICO 2 — `avgPrice` calcula a média usando `p.price` que é `0` para produtos com preço variável (linhas 663-666)**

```ts
const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
```
Produtos com `is_variable_price = true` têm `price = 0` no banco (forçado no `baseData`). Isso distorce o preço médio para baixo. Deveria excluir produtos com preço variável do cálculo: `products.filter(p => !p.is_variable_price && p.price > 0)`.

**BUG CRÍTICO 3 — Variações no formulário não têm o campo `delivery_price` visível**

No `handleSaveProduct`, o `varData` inclui `delivery_price` (linha 407-408). Mas no formulário HTML de variações (linhas 987-1022), o campo de input para `delivery_price` **não é renderizado** — só tem `name` e `price`. O usuário não pode definir preço de delivery por variação na interface, apesar do banco e da lógica suportarem isso.

**BUG CRÍTICO 4 — `fetchData` não usa React Query, tornando o cache incoerente**

A página inteira usa `useState + fetchData()` direto (Supabase raw), enquanto o resto do sistema usa React Query com invalidação automática. Isso significa:
- Ao criar um pedido no PDV, os `orderCounts` do cardápio nunca atualizam automaticamente
- Ao editar um produto no cardápio, as queries do PDV (`useProducts`) não são invalidadas
- Ao criar uma categoria, o cache do `useCategories` usado em outros módulos fica stale

**BUG CRÍTICO 5 — Bulk delete sem `AlertDialog` de confirmação**

O botão "Excluir" em seleção múltipla (linha 1159-1168) executa `handleBulkAction("delete")` imediatamente, sem nenhuma confirmação. Um clique acidental em "Excluir" com 10+ produtos selecionados é irreversível.

---

**PROBLEMAS OPERACIONAIS/UX:**

**1. Sem feedback visual de produto com imagem nos cards**
O `ProductCard` não exibe a foto do produto mesmo que `image_url` esteja preenchido. Em um cardápio real, a miniatura da foto acelera a identificação do produto.

**2. `avgPrice` nas métricas não é útil sem contexto**
"R$ 19,34" como Preço Médio não diz nada ao gerente. Seria mais útil mostrar **"Ticket Médio do Dia"** (média dos `total_price` dos pedidos de hoje) — dado de negócio relevante.

**3. Sem indicador de produto "mais vendido hoje" no card**
O badge de orderCount mostra o total histórico (bug já citado), mas mesmo com dado correto (dia atual), não distingue quais são os top 3 do dia. Um ícone de "🔥 Top" no card dos 3 mais vendidos do dia seria útil operacionalmente.

**4. Dialog de produto sem scroll fluido em mobile**
O `DialogContent` tem `max-h-[90vh] overflow-y-auto` (linha 790), mas em telas pequenas (360px) com muitas variações, o scroll fica preso no dialog do Radix UI — não é o comportamento nativo esperado em iOS.

**5. `fetchData` faz uma sub-query inline ineficiente para buscar variações (linhas 191-197)**

```ts
.in("product_id", (await supabase.from("products").select("id")...).data?.map(...) || [])
```
Isso dispara 2 queries sequenciais onde poderia ser 1 query com JOIN: `product_variations` com `products.unit_id = X` usando a RLS existente ou filtrando via join. Impacto em cardápios com 50+ produtos.

**6. Nenhuma validação no formulário além do `required` do HTML**
- `preparation_time = 0` é aceito (passa `parseInt("0") || 15` = 15... mas `parseInt("0")` = 0, não ativa o fallback `|| 15`)
- `price = -5` é aceito (o HTML tem `min="0"` mas pode ser bypassado)
- Nome com apenas espaços em branco é aceito (falta `.trim()`)
- Sem validação de min_price < max_price em preço variável

**7. Exportação CSV não inclui produtos com preço variável corretamente**
Na linha 558: `p.price.toFixed(2)` retorna `"0.00"` para produtos variáveis. Deveria exportar "Variável (min: X, max: Y)" nesses casos.

**8. Contador "Todos" no CategoryChip some quando não há categorias cadastradas**
A linha 1070 condicionalmente renderiza o `CategoryChips` apenas se `categories.length > 0`. Isso oculta o contador total de produtos quando o restaurante ainda não criou categorias — confuso para novos usuários.

**9. Sem modo de visualização em lista (toggle card/list)**
O grid de cards ultra-compactos é ótimo para densidade, mas em cardápios com 50+ produtos e nomes longos (ex: "Combinado Salmão Grelhado com Batata"), o truncamento impede a leitura. Um toggle "Grid / Lista" (tabela com linhas) permitiria visualização expandida.

**10. Ação de "Mover para categoria" ausente na seleção em lote**
O bulk action bar tem Ativar / Desativar / Excluir, mas não tem "Mover para categoria". Para quem está reorganizando o cardápio, mover 10 produtos de uma vez para uma categoria diferente é uma tarefa comum e hoje exige editar produto a produto.

---

## Plano de Implementação

### Arquivos a modificar:

**`src/pages/Menu.tsx`** — foco principal

1. **Corrigir `orderCounts`**: substituir a query raw por uma query que faz JOIN com `orders` filtrando `unit_id = selectedUnit.id` e `created_at >= início de hoje`. Usar:
```ts
supabase
  .from("order_items")
  .select("product_id, quantity, orders!inner(unit_id, created_at)")
  .eq("orders.unit_id", selectedUnit.id)
  .gte("orders.created_at", startOfToday)
```

2. **Corrigir `avgPrice`**: excluir produtos com `is_variable_price = true` ou `price = 0` do cálculo, e mudar o label do card de "Preço Médio" para "Ticket Médio" usando dados de pedidos de hoje.

3. **Adicionar `delivery_price` por variação no formulário**: inserir campo de input `Preço Delivery` ao lado do campo `Preço` em cada linha de variação.

4. **Confirmar bulk delete**: adicionar `AlertDialog` de confirmação antes de executar `handleBulkAction("delete")`, mostrando quantos produtos serão excluídos.

5. **Badge "Top do Dia" nos cards**: calcular os 3 produtos com maior `orderCounts` do dia e adicionar badge especial (ícone de estrela/fogo) no `ProductCard` para distinguir visualmente.

6. **Invalidar React Query após mutações**: após `fetchData()` nas mutações de create/update/delete, chamar `queryClient.invalidateQueries({ queryKey: ["products"] })` e `queryClient.invalidateQueries({ queryKey: ["categories"] })` para manter o cache dos outros módulos (PDV, Cardápio digital) sincronizados.

7. **Validações no formulário**: 
   - `.trim()` no nome antes de salvar
   - Validar `min_price < max_price` 
   - `preparation_time >= 1`

8. **Corrigir exportação CSV**: exibir "Variável (min-max)" para `is_variable_price = true`.

9. **Mover para categoria no bulk**: adicionar botão "Mover para..." no bulk action bar com `Select` de categorias.

10. **Toggle de visualização Grid/Lista**: adicionar botão de toggle no header da barra de filtros para alternar entre o grid compacto atual e uma visão de tabela com linhas expandidas.

### Arquivos secundários:
- `src/components/menu/ProductCard.tsx` — adicionar badge "Top" e exibir miniatura de imagem (se `image_url` presente)
- `src/components/menu/CategoryChips.tsx` — mostrar o chip "Todos" mesmo sem categorias cadastradas

### O que NÃO muda:
- Drag-and-drop de categorias — implementado e funcionando
- Upload de imagem — funcionando
- Sistema de variações — funcionando (só falta campo delivery_price no form)
- Bulk activate/deactivate — corretos
- Filtros e ordenação — corretos
