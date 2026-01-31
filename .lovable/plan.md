
# Plano: Painel de Acompanhamento em Tempo Real e Melhorias na Página de Pedidos

## Problemas Identificados

### 1. Modal de Detalhes do Pedido
- O conteudo esta fixo e nao rola quando tem muita informacao
- Design basico sem hierarquia visual clara
- Falta endereco de entrega no modal

### 2. Pagina de Pedidos
- Layout funcional mas sem visual profissional
- Falta painel de acompanhamento em tempo real para a equipe
- Tabela basica sem destaque para informacoes importantes

## Solucao Proposta

### Parte 1: Melhorar Modal de Detalhes do Pedido

**Mudancas:**
- Adicionar `ScrollArea` no conteudo do modal para permitir rolagem
- Definir altura maxima `max-h-[80vh]` para funcionar em telas pequenas
- Redesenhar com secoes visuais mais claras
- Mostrar endereco de entrega quando disponivel
- Icones para cada secao (Itens, Pagamento, Endereco)
- Botoes de status com cores mais visiveis

### Parte 2: Painel de Acompanhamento em Tempo Real

**Novo layout da pagina com 2 modos:**

**Modo Tabela (atual melhorado):**
- Header com metricas rapidas (Total hoje, Em preparo, Prontos)
- Tabela responsiva com melhor design
- Cores de status mais visiveis
- Informacao de tempo de espera

**Modo Kanban (novo):**
- Colunas: Pendente | Preparando | Pronto | Entregue
- Cards com informacoes resumidas do pedido
- Drag-and-drop visual (sem funcionalidade real, apenas visual)
- Auto-atualizacao em tempo real (ja implementado)
- Toggle para alternar entre modos

### Parte 3: Melhorias de Responsividade

**Mobile:**
- Cards ao inves de tabela em telas pequenas
- Filtros colapsaveis
- Modal adaptado para tela cheia em mobile

**Tablet/Desktop:**
- Grid de 2-3 colunas no modo Kanban
- Tabela completa com hover states
- Metricas sempre visiveis

## Estrutura do Layout

```
+----------------------------------------------------------+
|  HEADER: Pedidos                                          |
|  [Metricas: Total | Em Preparo | Prontos | Entregues]    |
+----------------------------------------------------------+
|  FILTROS: [Busca] [Status] [Canal] [Data] | [Tabela/Kanban]|
+----------------------------------------------------------+
|                                                           |
|  MODO TABELA:                                             |
|  +------------------------------------------------------+ |
|  | # | Data | Canal | Cliente | Total | Status | Acoes  | |
|  +------------------------------------------------------+ |
|                                                           |
|  MODO KANBAN:                                             |
|  +------------+ +------------+ +------------+             |
|  | PENDENTE   | | PREPARANDO | | PRONTO    |             |
|  |  Card 1    | |  Card 3    | |  Card 5   |             |
|  |  Card 2    | |  Card 4    | |           |             |
|  +------------+ +------------+ +------------+             |
+----------------------------------------------------------+
```

## Modal Melhorado

```
+------------------------------------------+
|  Pedido #123                         [X] |
+------------------------------------------+
| [Delivery] [Pendente]     31/01 18:07    |
+------------------------------------------+
| ScrollArea (rolavel)                     |
| +--------------------------------------+ |
| | CLIENTE                              | |
| | Joao Silva | 11999999999             | |
| +--------------------------------------+ |
| | ENDERECO DE ENTREGA                  | |
| | Rua das Flores, 123 - Centro         | |
| | Ref: Proximo ao mercado              | |
| +--------------------------------------+ |
| | ITENS                                | |
| | 2x X-Bacon ............. R$ 77,80    | |
| | 1x Suco Laranja ....... R$ 12,00     | |
| +--------------------------------------+ |
| | TOTAL ................. R$ 89,80     | |
| +--------------------------------------+ |
| | PAGAMENTO                            | |
| | Dinheiro - R$ 89,80                  | |
| | Troco para: R$ 100,00                | |
| +--------------------------------------+ |
| | ALTERAR STATUS                       | |
| | [Pendente] [Preparando] [Pronto]...  | |
| +--------------------------------------+ |
+------------------------------------------+
```

## Arquivos Modificados

| Arquivo | Mudancas |
|---------|----------|
| `src/pages/Orders.tsx` | Redesign completo com modo Kanban, metricas, modal scrollavel |

## Componentes Novos (dentro do arquivo)

1. **OrderMetrics** - Cards com metricas do dia
2. **OrderKanbanView** - Visualizacao em colunas
3. **OrderCard** - Card para o modo Kanban
4. **OrderDetailsModal** - Modal redesenhado com scroll

## Detalhes Tecnicos

### ScrollArea no Modal
```tsx
<DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
  <DialogHeader>...</DialogHeader>
  <ScrollArea className="flex-1 pr-4">
    {/* Conteudo do pedido */}
  </ScrollArea>
</DialogContent>
```

### Metricas com Realtime
As metricas serao calculadas a partir dos dados ja carregados pelo `useOrders`, que ja possui subscription realtime configurada.

### Toggle de Visualizacao
```tsx
const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
```

## Resultado Esperado

- Modal com scroll funcionando para pedidos longos
- Visualizacao profissional com metricas claras
- Modo Kanban para acompanhamento visual da equipe
- Design responsivo para mobile/tablet/desktop
- Informacoes de endereco e troco visiveis
- Auto-atualizacao em tempo real
