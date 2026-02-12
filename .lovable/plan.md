

# Cardapio Profissional - Drag-and-Drop, Variacoes e Melhorias Extras

## Resumo

Tres grandes frentes de melhorias: reordenacao de categorias por drag-and-drop, sistema de variacoes de produtos (tamanhos/sabores com precos diferentes), e melhorias adicionais para tornar o sistema completo e profissional.

---

## 1. Drag-and-Drop de Categorias

### O que muda
Os chips de categorias poderao ser arrastados para reordenar. A nova ordem e salva automaticamente no banco (campo `sort_order` ja existe na tabela `categories`).

### Implementacao
- Usar HTML5 Drag and Drop API nativo (sem biblioteca extra)
- Ao soltar, atualizar `sort_order` de todas as categorias afetadas via batch update
- Indicador visual durante o arrasto (borda pontilhada, opacidade)
- Feedback "Ordem salva!" via toast

### Arquivo
- `src/components/menu/CategoryChips.tsx` - adicionar handlers de drag

---

## 2. Variacoes de Produtos (P/M/G)

### Nova tabela: `product_variations`

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | Identificador |
| product_id | uuid (FK -> products) | Produto pai |
| name | text | Nome da variacao (ex: "Grande", "500ml") |
| price | numeric | Preco desta variacao |
| delivery_price | numeric (nullable) | Preco delivery |
| available | boolean (default true) | Disponibilidade |
| sort_order | integer (default 0) | Ordem de exibicao |
| created_at | timestamptz | Data de criacao |

RLS: mesmas politicas dos produtos (acesso via `unit_id` do produto pai usando subquery).

### Fluxo no Admin (Menu.tsx)
- No dialog de produto, nova secao "Variacoes" abaixo dos campos de preco
- Botao "+ Adicionar Variacao" com campos inline: nome e preco
- Ao salvar o produto, salva as variacoes junto
- Se o produto tem variacoes, o preco base fica como "a partir de R$ X"
- Pode remover variacoes individuais

### Fluxo no Cardapio Digital (CustomerOrder.tsx)
- Ao clicar em "Adicionar" num produto com variacoes, abre um mini-dialog para selecionar qual variacao
- Cada variacao vira um item separado no carrinho com o preco correto
- O `order_items` recebe um novo campo `variation_name` (text, nullable) para registro

### ProductCard
- Se o produto tem variacoes, mostrar "A partir de R$ X" em vez do preco fixo
- Badge indicando "X opcoes" ao lado do preco

---

## 3. Melhorias Extras Profissionais

### 3a. Duplicar Produto
- Botao "Duplicar" no ProductCard (icone Copy)
- Cria uma copia do produto com nome "Copia de [nome]"
- Copia tambem as variacoes
- Util para criar produtos similares rapidamente

### 3b. Filtro por Disponibilidade
- Adicionar filtro "Todos / Disponiveis / Indisponiveis" na barra de filtros
- Permite ao gestor ver rapidamente o que esta desativado

### 3c. Acao em Lote (Bulk Actions)
- Checkbox nos ProductCards para selecao multipla
- Barra de acoes: "Ativar Selecionados", "Desativar Selecionados", "Excluir Selecionados"
- Aparece apenas quando ha itens selecionados

### 3d. Contagem de Pedidos por Produto
- Exibir badge discreto no ProductCard mostrando quantas vezes o produto foi pedido (dados da tabela `order_items`)
- Ajuda o gestor a identificar produtos mais populares

### 3e. Exportar Cardapio
- Botao "Exportar" no header que gera um CSV com todos os produtos
- Campos: Nome, Categoria, Preco, Preco Delivery, Disponivel, Variacoes

---

## Arquivos a Serem Criados/Modificados

| Arquivo | Alteracao |
|---|---|
| Migracao SQL | Tabela `product_variations`, campo `variation_name` em `order_items` |
| `src/components/menu/CategoryChips.tsx` | Drag-and-drop para reordenar categorias |
| `src/components/menu/ProductCard.tsx` | Botao duplicar, checkbox selecao, badge de pedidos, exibir variacoes |
| `src/pages/Menu.tsx` | Secao de variacoes no form, filtro disponibilidade, bulk actions, exportar CSV, duplicar produto |
| `src/pages/CustomerOrder.tsx` | Dialog de selecao de variacao ao adicionar produto com variacoes |
| `src/hooks/useCustomerOrder.ts` | Suporte a `variation_name` no carrinho e no insert de order_items |

---

## Detalhes Tecnicos

### Drag-and-Drop (CategoryChips)
Usando `draggable`, `onDragStart`, `onDragOver`, `onDrop` nativos do HTML5:
- Cada chip recebe `draggable="true"`
- Ao arrastar, armazena o indice de origem
- Ao soltar, recalcula `sort_order` e faz batch update no banco
- Animacao de transicao CSS durante o arrasto

### Variacoes - Migracao SQL

```text
product_variations
  id UUID PK
  product_id UUID FK -> products ON DELETE CASCADE
  name TEXT NOT NULL
  price NUMERIC NOT NULL
  delivery_price NUMERIC
  available BOOLEAN DEFAULT true
  sort_order INTEGER DEFAULT 0
  created_at TIMESTAMPTZ DEFAULT now()

order_items
  + variation_name TEXT (nullable) -- novo campo
```

### Bulk Actions
- Estado `selectedProducts: Set<string>` no Menu.tsx
- Checkbox no canto superior esquerdo de cada ProductCard
- Barra flutuante na parte inferior quando ha selecao ativa
- Chamadas em batch via Promise.all para performance

### Exportar CSV
- Gerar string CSV no frontend com `products` + `product_variations`
- Download via `Blob` e `URL.createObjectURL`
- Sem necessidade de backend

