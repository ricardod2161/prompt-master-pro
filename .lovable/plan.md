
# Plano: Corrigir Scroll e Melhorar Carrinho do Pedido Digital

## Problema Identificado

O Sheet "Seu Pedido" tem problemas de layout onde:
1. O conteudo aparece fixo e nao rola adequadamente
2. A estrutura flexbox nao esta configurada corretamente para permitir scroll
3. O `ScrollArea` precisa de `min-h-0` para funcionar em contexto flex

## Solucao Tecnica

### Estrutura Atual (Problema)

```text
SheetContent (h-[85vh] flex flex-col)
├── SheetHeader (flex-shrink-0) ✓
├── ScrollArea (flex-1)         ✗ Falta min-h-0 e overflow
└── SheetFooter (flex-shrink-0) ✓
```

### Estrutura Corrigida

```text
SheetContent (h-[85vh] flex flex-col overflow-hidden)
├── SheetHeader (flex-shrink-0) 
├── ScrollArea (flex-1 min-h-0 overflow-hidden)
│   └── Content with proper padding
└── SheetFooter (flex-shrink-0)
```

---

## Melhorias Adicionais

### 1. Layout Responsivo Aprimorado

- Usar altura responsiva `h-[90vh] sm:h-[85vh]` para melhor uso do espaco em mobile
- Adicionar `rounded-t-xl` para visual mais elegante
- Safe area padding para dispositivos com notch

### 2. Cart Item Melhorado

- Imagem miniatura do produto no carrinho
- Preco unitario e subtotal separados
- Animacao suave ao adicionar/remover itens
- Feedback visual ao alterar quantidade

### 3. Secao de Identificacao Aprimorada

- Icones nos campos de input
- Validacao visual do telefone
- Texto explicativo mais claro
- Background sutil para destaque

### 4. Footer Otimizado

- Resumo expandido (subtotal + quantidade de itens)
- Botao com estado de hover melhorado
- Indicador de pedido minimo (se aplicavel)

### 5. Empty State Melhorado

- Animacao sutil
- Call-to-action para voltar ao menu
- Ilustracao mais atraente

---

## Arquivos a Modificar

### `src/pages/CustomerOrder.tsx`

Alteracoes principais:
1. Adicionar `overflow-hidden` no SheetContent
2. Adicionar `min-h-0` no ScrollArea
3. Melhorar CartItemRow com imagem e layout
4. Aprimorar secao de identificacao
5. Melhorar empty state do carrinho
6. Adicionar badge de quantidade no header do sheet

### `src/components/ui/scroll-area.tsx` (opcional)

Garantir que o Viewport tenha overflow correto

---

## Codigo da Correcao Principal

```typescript
// SheetContent com overflow correto
<SheetContent 
  side="bottom" 
  className="h-[90vh] sm:h-[85vh] flex flex-col p-0 rounded-t-2xl overflow-hidden"
>
  {/* Header fixo */}
  <SheetHeader className="px-4 py-4 border-b flex-shrink-0">
    ...
  </SheetHeader>

  {/* Area rolavel - CORRECAO PRINCIPAL */}
  <ScrollArea className="flex-1 min-h-0 overflow-hidden">
    <div className="px-4 py-2">
      {/* Cart items */}
    </div>
  </ScrollArea>

  {/* Footer fixo */}
  <SheetFooter className="flex-shrink-0 px-4 py-4 border-t">
    ...
  </SheetFooter>
</SheetContent>
```

---

## Melhorias Visuais

### Cart Item Redesenhado

```text
┌──────────────────────────────────────────┐
│ [IMG] Acai 300ml                    [-] 1 [+] │
│       R$ 16,90 cada                  [🗑]    │
│       Subtotal: R$ 16,90                    │
└──────────────────────────────────────────┘
```

### Identificacao Aprimorada

```text
┌──────────────────────────────────────────┐
│ 👤 Identificacao (opcional)              │
│    Para chamarmos quando estiver pronto  │
├──────────────────────────────────────────┤
│ [👤] Seu nome                            │
│ [📱] (00) 00000-0000                     │
└──────────────────────────────────────────┘
```

### Footer Expandido

```text
┌──────────────────────────────────────────┐
│ 1 item no carrinho                       │
│ ─────────────────────────────────────── │
│ Total                       R$ 16,90    │
│                                          │
│ [    ✓ Enviar Pedido para Cozinha    ]  │
└──────────────────────────────────────────┘
```

---

## Resultado Esperado

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Scroll do carrinho | Fixo/travado | Rola suavemente |
| Layout em mobile | Corta conteudo | Responsivo perfeito |
| Visual dos itens | Basico | Profissional com imagens |
| Identificacao | Campos simples | Secao destacada |
| Feedback visual | Minimo | Animacoes suaves |
