

# Plano de Implementacao Completa - RestaurantOS

## Resumo

Implementacao de todos os modulos funcionais do sistema com atualizacao em tempo real, design responsivo profissional e todas as funcionalidades de gestao.

---

## Modulos a Implementar

### 1. PDV - Ponto de Venda (`/pos`)

**Interface:**
- Grade visual de produtos organizados por categoria (estilo tablet-friendly)
- Barra de busca inteligente com resultados instantaneos
- Carrinho lateral com ajuste de quantidade e observacoes
- Selecao de canal (Balcao, Mesa, Delivery, WhatsApp)
- Modal de finalizacao com multiplas formas de pagamento
- Botao de impressao termica (preparado para integracao)

**Funcionalidades:**
- Filtro por categoria com scroll horizontal
- Calculo automatico de totais
- Selecao de mesa (quando canal = mesa)
- Campo de cliente e telefone (opcional)
- Split de pagamento (ex: parte PIX, parte dinheiro)

---

### 2. KDS - Kitchen Display System (`/kds`)

**Interface:**
- Layout em 3 colunas: Pendente | Em Preparo | Pronto
- Cards de pedido com temporizador visual
- Destaque visual para pedidos atrasados (>15min)
- Interface touch-friendly para telas grandes
- Som de notificacao para novos pedidos

**Funcionalidades:**
- Atualizacao em tempo real via Supabase Realtime
- Botoes de acao: "Iniciar Preparo" e "Marcar Pronto"
- Filtro por tipo de item (bebidas, comidas)
- Exibicao de observacoes do cliente
- Tempo de espera calculado automaticamente

---

### 3. Gestao de Pedidos (`/orders`)

**Interface:**
- Tabela completa com paginacao
- Filtros: status, canal, periodo, busca
- Badge de status colorido
- Modal de detalhes com timeline do pedido

**Funcionalidades:**
- Atualizacao em tempo real
- Edicao de status do pedido
- Visualizacao de itens e pagamentos
- Historico de alteracoes
- Exportacao para Excel (futuro)

---

### 4. Controle de Caixa (`/cashier`)

**Interface:**
- Card de status do caixa (aberto/fechado)
- Formulario de abertura com valor inicial
- Lista de movimentacoes do dia
- Resumo financeiro em tempo real

**Funcionalidades:**
- Abertura de caixa com valor inicial
- Registro de sangrias e suprimentos
- Fechamento com conferencia automatica
- Calculo de diferenca (esperado vs real)
- Historico de caixas anteriores

---

### 5. Gestao de Mesas (`/tables`)

**Interface:**
- Grid visual das mesas com status colorido
- Indicadores: Livre (verde), Ocupada (azul), Pedido Pendente (amarelo)
- Botao de geracao de QR Code

**Funcionalidades:**
- CRUD de mesas
- Geracao de QR Code unico por mesa
- Vinculacao de pedido a mesa
- Status atualizado em tempo real

---

### 6. Gestao de Estoque (`/inventory`)

**Interface:**
- Tabela de insumos com estoque atual
- Indicador visual de estoque baixo (vermelho)
- Modal de entrada/saida manual
- Fichas tecnicas (produto -> insumos)

**Funcionalidades:**
- CRUD de insumos
- Movimentacoes manuais com justificativa
- Alertas de estoque minimo
- Vincular produtos a ingredientes
- Historico de movimentacoes

---

### 7. Relatorios (`/reports`)

**Interface:**
- Seletor de periodo
- Cards de resumo (faturamento, pedidos, ticket medio)
- Graficos de vendas por periodo
- Ranking de produtos mais vendidos

**Funcionalidades:**
- Filtro por periodo customizado
- Grafico de vendas por canal
- Top 10 produtos vendidos
- Comparativo com periodo anterior
- Exportacao PDF/Excel (estrutura)

---

### 8. Delivery (`/delivery`)

**Interface:**
- Lista de pedidos aguardando despacho
- Cadastro de entregadores
- Card de atribuicao de motoboy

**Funcionalidades:**
- CRUD de entregadores
- Atribuir pedido a entregador
- Status de entrega (despachado, entregue)
- Tempo de entrega estimado

---

## Configuracoes Tecnicas

### Tempo Real (Supabase Realtime)

Habilitar realtime nas tabelas:
- `orders` - novos pedidos e mudancas de status
- `order_items` - status da cozinha
- `tables` - status das mesas
- `cash_registers` - caixa aberto/fechado

### Hooks e Componentes Reutilizaveis

- `useOrders()` - hook para pedidos com realtime
- `useProducts()` - hook para produtos
- `useCashRegister()` - hook para caixa do dia
- `OrderCard` - componente de card de pedido
- `ProductGrid` - grade de produtos
- `StatusBadge` - badge de status reutilizavel

---

## Melhorias de UX

1. **Loading States** - Skeletons em todas as listagens
2. **Empty States** - Ilustracoes quando nao ha dados
3. **Error Handling** - Toasts com mensagens claras
4. **Confirmacoes** - Dialogs para acoes destrutivas
5. **Responsividade** - Mobile-first em todas as telas
6. **Atalhos de Teclado** - PDV e KDS (ex: Enter para finalizar)
7. **Feedback Visual** - Animacoes suaves em acoes

---

## Estrutura de Arquivos

```text
src/
├── pages/
│   ├── POS.tsx           # Ponto de Venda
│   ├── KDS.tsx           # Monitor de Cozinha
│   ├── Orders.tsx        # Gestao de Pedidos
│   ├── Cashier.tsx       # Controle de Caixa
│   ├── Tables.tsx        # Gestao de Mesas
│   ├── Inventory.tsx     # Gestao de Estoque
│   ├── Reports.tsx       # Relatorios
│   └── Delivery.tsx      # Gestao de Delivery
├── components/
│   ├── pos/
│   │   ├── ProductGrid.tsx
│   │   ├── Cart.tsx
│   │   └── CheckoutDialog.tsx
│   ├── kds/
│   │   ├── KDSColumn.tsx
│   │   └── KDSOrderCard.tsx
│   ├── orders/
│   │   ├── OrdersTable.tsx
│   │   └── OrderDetailsDialog.tsx
│   └── shared/
│       ├── StatusBadge.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useOrders.ts
│   ├── useProducts.ts
│   ├── useRealtime.ts
│   └── useCashRegister.ts
```

---

## Ordem de Implementacao

1. **Hooks e Componentes Base** - Estrutura reutilizavel
2. **PDV** - Sistema de vendas completo
3. **KDS** - Monitor de cozinha com realtime
4. **Gestao de Pedidos** - Tabela e detalhes
5. **Controle de Caixa** - Abertura/fechamento
6. **Mesas e QR Codes** - Gestao visual
7. **Estoque** - Insumos e movimentacoes
8. **Relatorios** - Dashboards e graficos
9. **Delivery** - Entregadores e despacho

---

## Secao Tecnica

### Migracao SQL para Realtime

```sql
-- Habilitar realtime nas tabelas principais
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
```

### Hook de Realtime (useRealtime)

```typescript
const channel = supabase
  .channel('orders-realtime')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => handleOrderChange(payload)
  )
  .subscribe()
```

### Integracao Impressao Termica

Interface preparada para chamar API local:
```typescript
const printReceipt = async (order: Order) => {
  // POST para localhost:3001/print
  // Pode ser integrado com ESC/POS ou sistema proprio
}
```

