
## Análise Completa da Página PDV

### O que existe hoje (diagnóstico honesto):

**Estado atual do POS.tsx:**
- 429 linhas — arquivo único misturando UI, lógica de estado e checkout
- Grid de produtos: 2 colunas mobile / 3 sm / 4 lg — mas o carrinho fica embaixo em mobile, empurrado para fora da tela
- Carrinho: painel lateral fixo de `w-96` — em mobile vira um bloco vertical abaixo do grid, muito ruim UX
- Badge do carrinho exibe `cart.length` (número de itens únicos) — **deveria ser a quantidade total de peças**
- `cartTotal` correto via useMemo, mas não tem desconto, coupon, taxa de serviço
- Produtos sem imagem: apenas nome e preço. Sem descrição truncada, sem foto miniatura
- **Pagamento em dinheiro**: não há cálculo de troco. Se o cliente paga R$50 num pedido de R$37, o sistema não pede o valor recebido
- **Notas por item individual**: a interface do carrinho não permite adicionar observação por item (ex: "sem cebola") — só tem observação geral do pedido
- `channel` selecionado SOMENTE no checkout dialog — o fluxo ideal seria definir o canal ANTES (balcão vs mesa vs delivery muda o comportamento)
- Mesa selecionável apenas no dialog — se canal "table" e não selecionar mesa, bloqueia o botão mas não orienta o usuário
- Dialog de checkout: `<Select>` para pagamento — em um PDV real deveria ser botões visuais grandes (mais rápido de operar)
- Sem atalhos de teclado — operadores de caixa usam teclado; Enter para confirmar, Escape para cancelar etc.
- Sem histórico de pedidos recentes no PDV — o caixa precisa ver os últimos 5 pedidos registrados
- Sem indicador de estoque no card do produto — produto sem estoque pode aparecer disponível
- `useProducts()` já filtra `available: true`, mas não verifica estoque (`stock_quantity`)
- O `handleCheckout` não tem try/catch próprio — o erro vai para `createOrder.onError` mas o dialog não fecha em erro, ok. Mas não limpa o estado se ocorrer erro parcial
- Sem confirmação de pedido duplicado — se clicar "Confirmar Pedido" duas vezes rápido, pode criar dois pedidos (o `disabled={createOrder.isPending}` protege mas só após o primeiro ciclo)
- **Layout mobile completamente quebrado**: `h-[calc(100vh-8rem)] flex flex-col lg:flex-row` — em mobile fica tudo espremido verticalmente sem scroll adequado

### Melhorias identificadas (priorizadas):

**CRÍTICO — UX/Operacional:**
1. **Layout mobile-first com drawer do carrinho** — em telas < lg, o carrinho vira um Sheet/Drawer inferior com botão flutuante mostrando total + quantidade. No desktop, mantém o painel lateral.
2. **Cálculo de troco para dinheiro** — quando método = "cash", exibir campo "Valor recebido" e calcular troco automaticamente (`troco = valorRecebido - total`)
3. **Observação por item no carrinho** — botão de lápis em cada item do carrinho abre um popover/inline input para adicionar observação específica (ex: "sem cebola")
4. **Badge do carrinho com quantidade total** — trocar `cart.length` por `cart.reduce((s,i) => s+i.quantity, 0)`
5. **Botões visuais de pagamento** — substituir o `<Select>` por grid de botões com ícones (Dinheiro, Crédito, Débito, PIX, Vale) — muito mais rápido em operação

**IMPORTANTE — Funcional:**
6. **Seletor de canal ANTES do grid** — adicionar chips/tabs de canal (Balcão / Mesa / Delivery) na parte superior, logo após a busca. Quando "Mesa" for selecionado, mostrar seletor de mesa inline antes do grid, não só no checkout
7. **Últimos pedidos no PDV** — painel compacto mostrando os últimos 5 pedidos do dia com status, ideal para o caixa confirmar que o pedido foi registrado
8. **Confirmação visual pós-pedido** — após `createOrder.mutateAsync` sucesso, exibir uma animação/toast mais proeminente com o número do pedido criado, não apenas o toast genérico

**BÔNUS — Qualidade:**
9. **Shortcut Teclado** — `Enter` no campo de busca limpa e foca no primeiro produto; `F2` abre checkout; `Escape` cancela
10. **Indicador de quantidade no card** — se o item já está no carrinho, mostrar badge com a quantidade diretamente no card do produto (feedback visual imediato)

---

## Plano de Implementação

### Arquivos a modificar:
- **`src/pages/POS.tsx`** — reescrever com todas as melhorias

### O que será feito em detalhes:

**1. Layout responsivo corrigido**
- Desktop (lg+): layout atual de `flex-row` mantido
- Mobile/tablet: carrinho se torna um `Sheet` (drawer bottom) acionado por um botão flutuante fixo no canto inferior direito mostrando: ícone carrinho + badge com total de itens + total em R$

**2. Seletor de canal inline (acima do grid)**
- 4 chips horizontais: Balcão | Mesa | Delivery | WhatsApp
- Quando "Mesa": aparece um segundo row com botões das mesas livres para seleção rápida
- Isso elimina a redundância do campo "Canal" no dialog de checkout

**3. Observação por item**
- Cada linha do carrinho ganha um ícone de lápis pequeno
- Ao clicar: expande um `<Input>` inline abaixo do nome do produto (sem modal)
- O valor vai para `item.notes`

**4. Checkout dialog simplificado**
- Remove campo "Canal" (já selecionado antes)
- Remove campo "Mesa" (já selecionado antes)
- Pagamento: grid 2×3 de botões com ícone + label (não mais Select)
- Quando "Dinheiro": aparece campo "Valor recebido" + display "Troco: R$ X,XX"
- Mantém campos de cliente e observação geral

**5. Badge de quantidade correta no carrinho e nos cards**
- Badge no header do carrinho: soma de todas as quantidades
- Badge nos cards do produto: se item está no carrinho, mostra a quantidade em cima do card (canto superior direito, badge primary)

**6. Histórico de pedidos recentes**
- Abaixo do carrinho (ou como seção colapsável no painel lateral): os últimos 5 pedidos do dia
- Mostra: #número, canal, total, status badge colorido
- Usa `useOrders({ date: new Date(), limit: 5 })` — já existe essa funcionalidade no hook
