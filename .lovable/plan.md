
# Plano: Melhorias no Layout da Página de Mesas

## Problemas Identificados

Analisando a imagem e o código, identifiquei os seguintes problemas:

1. **Grid muito denso**: 6 colunas em telas grandes comprimem os cards
2. **Padding muito reduzido**: Cards com `p-3` ficam apertados
3. **Textos muito pequenos**: Uso de `text-[10px]` dificulta leitura
4. **Métricas compactas**: Cards de métricas com pouco espaço
5. **Botões de ação pequenos**: Difíceis de tocar em mobile

---

## Melhorias Propostas

### 1. Grid de Cards - Mais Espaçoso

**Antes:**
```
grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
```

**Depois:**
```
grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
```

Resultado: Cards maiores e mais legíveis.

### 2. Cards de Mesa - Mais Espaço Interno

| Elemento | Antes | Depois |
|----------|-------|--------|
| Padding do card | `p-3 sm:p-4` | `p-4 sm:p-5` |
| Título da mesa | `text-lg sm:text-xl` | `text-xl sm:text-2xl` |
| Badge de status | `text-[10px] sm:text-xs` | `text-xs sm:text-sm` |
| Info do pedido | `text-[10px]` | `text-xs` |
| Botões de ação | `h-8 sm:h-9` | `h-9 sm:h-10` |

### 3. Métricas no Topo - Mais Destaque

| Elemento | Antes | Depois |
|----------|-------|--------|
| Padding | `p-3 sm:p-4` | `p-4 sm:p-5` |
| Ícone | `h-4 w-4 sm:h-5 sm:w-5` | `h-5 w-5 sm:h-6 sm:w-6` |
| Número | `text-xl sm:text-2xl` | `text-2xl sm:text-3xl` |
| Label | `text-xs` | `text-sm` |

### 4. Seção de Info do Pedido Ativo

- Aumentar padding interno de `p-2.5` para `p-3`
- Aumentar tamanho das fontes
- Adicionar mais espaçamento entre elementos

### 5. Gap Entre Cards

- Aumentar de `gap-3 sm:gap-4` para `gap-4 sm:gap-5`

---

## Visualização do Resultado

```text
┌────────────────────────────────────────────────────────────┐
│  GESTÃO DE MESAS                          [↻] [+ Nova Mesa]│
├────────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │  📊    │ │  ✓     │ │  🍽️    │ │  ⏳    │              │
│  │   5    │ │   3    │ │   1    │ │   1    │              │
│  │ Total  │ │ Livres │ │Ocupadas│ │Aguard. │              │
│  └────────┘ └────────┘ └────────┘ └────────┘              │
├────────────────────────────────────────────────────────────┤
│  [🔍 Buscar mesa...        ] [Filtrar status ▼]           │
│                                                            │
│  ○ Livre   ○ Ocupada   ○ Aguardando                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   MESA 1        │  │   MESA 2        │                 │
│  │   ────────      │  │   ────────      │                 │
│  │   🟢 Livre      │  │   🔵 Ocupada    │                 │
│  │                 │  │                 │                 │
│  │                 │  │ Pedido #127     │                 │
│  │                 │  │ R$ 45,90        │                 │
│  │                 │  │ 14:32 ● Preparo │                 │
│  │                 │  │                 │                 │
│  │ [QR Code] [🗑️]  │  │ [QR] [👁️] [🗑️] │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   MESA 3        │  │   MESA 4        │                 │
│  │   ────────      │  │   ────────      │                 │
│  │   🟡 Aguardando │  │   🟢 Livre      │                 │
│  │                 │  │                 │                 │
│  │ [QR Code] [🗑️]  │  │ [QR Code] [🗑️]  │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/Tables.tsx` | Modificar | Todas as melhorias de layout |

---

## Detalhes Técnicos

### Componente TableMetrics (linhas 70-102)
- Aumentar padding: `p-3 sm:p-4` → `p-4 sm:p-5`
- Aumentar ícones: `h-4 w-4 sm:h-5 sm:w-5` → `h-5 w-5 sm:h-6 sm:w-6`
- Aumentar números: `text-xl sm:text-2xl` → `text-2xl sm:text-3xl`
- Aumentar labels: `text-xs` → `text-sm`

### Componente TableCard (linhas 104-309)
- Aumentar padding geral: `p-3 sm:p-4` → `p-4 sm:p-5`
- Título da mesa: `text-lg sm:text-xl` → `text-xl sm:text-2xl`
- Badge de status: `text-[10px] sm:text-xs` → `text-xs sm:text-sm`
- Área de pedido ativo: aumentar padding e fontes
- Botões: `h-8 sm:h-9` → `h-9 sm:h-10`

### Grid principal (linha 687)
- De: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`
- Para: `grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`
- Gap: `gap-3 sm:gap-4` → `gap-4 sm:gap-5`

---

## Resultado Esperado

- Cards de mesa significativamente maiores e mais legíveis
- Métricas com mais destaque visual
- Melhor experiência em dispositivos móveis
- Layout mais profissional e espaçoso
- Botões de ação mais fáceis de tocar
