

## Melhorias no Footer e Exclusao de Pedidos Entregues

### 1. Footer - Estado visual desabilitado para links inativos

**Arquivo: `src/components/landing/LandingFooter.tsx`**

Atualmente, links sem destino (`href="#"`) ja renderizam como `<span>` com `opacity-50 cursor-default`, mas falta:
- Um indicador visual mais claro (ex: tag "Em breve" ou icone de cadeado)
- Tambem aplicar aos links sociais (Facebook, Instagram, etc.) que apontam para `#`

Solucao:
- Adicionar um badge "Em breve" discreto ao lado dos links inativos
- Aplicar `opacity-40` e `pointer-events-none` nos icones sociais que apontam para `#`
- Adicionar `line-through` sutil ou tooltip nos links inativos

### 2. Pedidos - Opcao de excluir pedidos entregues

**Arquivo: `src/hooks/useOrders.ts`**
- Criar hook `useDeleteOrder` que deleta o pedido e seus registros relacionados (`order_items`, `order_payments`, `delivery_orders`) via cascade ou manualmente

**Arquivo: `src/pages/Orders.tsx`**
- No modal `OrderDetailsModal`: adicionar botao "Excluir Pedido" (vermelho, com icone Trash2) visivel apenas quando `order.status === "delivered" || order.status === "completed" || order.status === "cancelled"`
- Adicionar dialogo de confirmacao (AlertDialog) antes de excluir: "Tem certeza que deseja excluir o pedido #XXX? Esta acao nao pode ser desfeita."
- Na table view: adicionar botao de excluir na coluna de acoes para pedidos entregues/cancelados
- Nos cards mobile e kanban: adicionar botao de excluir para pedidos entregues

### Detalhes Tecnicos

**Hook `useDeleteOrder`:**
```typescript
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      // Deletar order_items, order_payments, delivery_orders primeiro
      await supabase.from("order_items").delete().eq("order_id", orderId);
      await supabase.from("order_payments").delete().eq("order_id", orderId);
      await supabase.from("delivery_orders").delete().eq("order_id", orderId);
      const { error } = await supabase.from("orders").delete().eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["orders"] });
      toast({ title: "Pedido excluido com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir pedido", description: error.message, variant: "destructive" });
    },
  });
}
```

**Modal de confirmacao:** Usar `AlertDialog` do shadcn com titulo "Excluir Pedido", descricao com numero do pedido, botao "Cancelar" e botao "Excluir" vermelho com estado de loading.

**Footer links inativos:** Renderizar badge "Em breve" inline com `text-[10px] bg-muted px-1.5 py-0.5 rounded-full` ao lado do texto do link desabilitado.

