
# Plano: Corrigir Erro 404 e Melhorar Pagina de Mesas

## Problema Identificado

### Erro 404 ao Abrir Link
O QR Code gera um link para `/order/:tableId`, porem **nao existe esta rota** no App.tsx. Quando o cliente ou admin clica em "Abrir Link", recebe 404.

```text
Atual:
QR Code → /order/c63dda1d-b20a-4... → 404 (rota inexistente)

Esperado:
QR Code → /order/c63dda1d-b20a-4... → Pagina publica de pedidos
```

---

## Solucao Proposta

### 1. Criar Pagina Publica de Pedidos para Clientes

Nova pagina `src/pages/CustomerOrder.tsx` que sera acessada via QR Code:

```text
CustomerOrder.tsx (Pagina Publica)
├── Header com logo e nome do restaurante
├── Numero da mesa (obtido via tableId)
├── Menu de produtos por categoria
│   ├── Cards de produtos com imagem, nome, preco
│   ├── Botao de adicionar ao carrinho
│   └── Modal de detalhes do produto
├── Carrinho lateral/inferior
│   ├── Itens selecionados com quantidade
│   ├── Total do pedido
│   └── Botao "Enviar Pedido"
├── Formulario de identificacao
│   ├── Nome do cliente
│   └── Telefone (opcional)
└── Confirmacao de pedido enviado
```

### 2. Adicionar Rota Publica no App.tsx

```typescript
// Adicionar ANTES das rotas protegidas
<Route path="/order/:tableId" element={<CustomerOrder />} />
```

### 3. Melhorar Layout da Pagina de Mesas

Ajustes para garantir scroll adequado e responsividade:

```text
Melhorias Tables.tsx
├── Adicionar ScrollArea do Radix para scroll suave
├── Garantir altura maxima nos dialogs
├── Melhorar espacamento em mobile
├── Adicionar animacoes sutis nos cards
└── Otimizar grid para diferentes tamanhos de tela
```

---

## Arquitetura da Pagina CustomerOrder

### Fluxo do Cliente

```text
1. Cliente escaneia QR Code
   └── Abre /order/:tableId no celular

2. Sistema carrega dados
   ├── Busca mesa pelo ID (obtem unit_id)
   ├── Busca dados do restaurante (nome, logo)
   └── Busca produtos ativos da unidade

3. Cliente navega no cardapio
   ├── Filtra por categoria
   ├── Ve detalhes do produto
   └── Adiciona itens ao carrinho

4. Cliente finaliza pedido
   ├── Informa nome e telefone (opcional)
   ├── Confirma itens
   └── Envia pedido

5. Sistema cria pedido
   ├── Insere em orders (channel: 'qrcode')
   ├── Insere items em order_items
   ├── Atualiza status da mesa para 'occupied'
   └── Exibe confirmacao ao cliente
```

### Estrutura de Componentes

```text
src/pages/CustomerOrder.tsx
├── useCustomerOrder.ts (hook para logica)
│   ├── fetchTable() - busca mesa e unit_id
│   ├── fetchProducts() - lista produtos ativos
│   ├── fetchCategories() - lista categorias
│   └── createOrder() - cria pedido no banco
├── CustomerHeader - header com nome restaurante
├── CategoryTabs - abas de categorias
├── ProductGrid - grid de produtos
├── ProductCard - card individual
├── CartSheet - carrinho lateral
└── OrderConfirmation - tela de sucesso
```

---

## Detalhamento Tecnico

### Arquivos a Criar

1. **`src/pages/CustomerOrder.tsx`**
   - Pagina publica completa
   - Nao requer autenticacao
   - Layout responsivo mobile-first

2. **`src/hooks/useCustomerOrder.ts`**
   - Logica de busca de dados sem autenticacao
   - Criacao de pedido via anon key
   - Gerenciamento do carrinho

### Arquivos a Modificar

1. **`src/App.tsx`**
   - Adicionar rota `/order/:tableId`
   - Rota FORA do AppLayout (publica)

2. **`src/pages/Tables.tsx`**
   - Pequenos ajustes de scroll e responsividade

### Consideracoes de Seguranca

```text
Acesso Publico (sem auth)
├── Leitura: tables, products, categories, units
├── Escrita: orders, order_items
└── RLS: Permitir insert em orders/order_items para anon
```

---

## Interface da Pagina de Pedidos

### Layout Mobile (Prioridade)

```text
┌─────────────────────────┐
│  🍔 RestaurantOS        │
│  Mesa 4                 │
├─────────────────────────┤
│ [Todos] [Lanches] [Beb] │ ← Tabs categorias
├─────────────────────────┤
│ ┌─────┐ ┌─────┐        │
│ │ 🍔  │ │ 🍕  │        │
│ │ Burg│ │Pizza│        │ ← Grid 2 cols
│ │R$25 │ │R$35 │        │
│ └─────┘ └─────┘        │
│ ┌─────┐ ┌─────┐        │
│ │ 🥤  │ │ 🍟  │        │
│ │Refri│ │Batata│       │
│ │R$8  │ │R$15 │        │
│ └─────┘ └─────┘        │
├─────────────────────────┤
│ 🛒 Carrinho (3)  R$68  │ ← Botao fixo inferior
└─────────────────────────┘
```

### Carrinho (Sheet/Drawer)

```text
┌─────────────────────────┐
│ Seu Pedido        [X]   │
├─────────────────────────┤
│ 2x Burger      R$ 50,00 │
│ 1x Pizza       R$ 35,00 │
│ 1x Refrigerante R$ 8,00 │
├─────────────────────────┤
│ Total          R$ 93,00 │
├─────────────────────────┤
│ Nome: ________________  │
│ Tel:  ________________  │
├─────────────────────────┤
│  [  Enviar Pedido  ]    │
└─────────────────────────┘
```

---

## Sequencia de Implementacao

1. Criar hook `useCustomerOrder.ts`
2. Criar pagina `CustomerOrder.tsx`
3. Adicionar rota em `App.tsx`
4. Verificar/ajustar RLS para permitir pedidos anonimos
5. Testar fluxo completo
6. Ajustar detalhes de scroll na pagina Tables

---

## Resultado Esperado

| Acao | Antes | Depois |
|------|-------|--------|
| Clicar "Abrir Link" | Erro 404 | Abre cardapio digital |
| Cliente escaneia QR | Pagina inexistente | Ve menu do restaurante |
| Cliente faz pedido | Impossivel | Pedido criado no sistema |
| Scroll em Tables | Funciona | Mais suave e responsivo |
