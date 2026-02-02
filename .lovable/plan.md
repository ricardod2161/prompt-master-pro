
# Correção do Bug de Pedidos Duplicados

## Problema Identificado

Ao mudar o método de pagamento de PIX para Dinheiro, o sistema criou dois pedidos separados (#8 e #9) porque **não existe funcionalidade para editar o pagamento** de um pedido existente.

| Pedido | Pagamento | Valor | Status |
|--------|-----------|-------|--------|
| #8 | PIX | R$ 20,00 | pending |
| #9 | Dinheiro | R$ 20,00 | pending |

---

## Solução

### Parte 1: Cancelar o Pedido Duplicado
Cancelar o pedido #8 (o que tinha PIX) mantendo apenas o #9 (Dinheiro).

### Parte 2: Adicionar Edição de Pagamento
Permitir que o usuário altere o método de pagamento de um pedido diretamente na tela de detalhes.

---

## Alterações Técnicas

### 1. Cancelar Pedido #8 (Duplicado)
Atualizar status do pedido #8 para "cancelled" via SQL.

### 2. Novo Hook: `useUpdatePaymentMethod`
Criar hook para atualizar o método de pagamento de um pedido existente.

```typescript
// src/hooks/useOrders.ts
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      newMethod,
    }: {
      orderId: string;
      newMethod: PaymentMethod;
    }) => {
      // Atualiza o método de pagamento existente
      const { error } = await supabase
        .from("order_payments")
        .update({ method: newMethod })
        .eq("order_id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Forma de pagamento atualizada!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
```

### 3. UI: Botão de Editar Pagamento no Modal de Detalhes
Na seção de pagamento do modal, adicionar botão para editar:

```tsx
// src/pages/Orders.tsx - No OrderDetailsModal
{order.order_payments && order.order_payments.length > 0 && (
  <section className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CreditCard className="h-4 w-4 text-primary" />
        <span>Pagamento</span>
      </div>
      {/* NOVO: Botão para editar pagamento */}
      {order.status === "pending" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditingPayment(true)}
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          Editar
        </Button>
      )}
    </div>
    
    {/* Se estiver editando, mostra select */}
    {editingPayment ? (
      <div className="flex gap-2">
        <Select
          value={selectedPaymentMethod}
          onValueChange={setSelectedPaymentMethod}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleSavePayment}
          disabled={updatePayment.isPending}
        >
          Salvar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditingPayment(false)}
        >
          Cancelar
        </Button>
      </div>
    ) : (
      // Mostra pagamento atual
      <Card>...</Card>
    )}
  </section>
)}
```

---

## Fluxo Visual

```text
ANTES (Bug):
Pedido criado → Pagamento errado → Cria novo pedido → 2 pedidos duplicados ❌

DEPOIS (Corrigido):
Pedido criado → Pagamento errado → Clica "Editar" → Muda pagamento → 1 pedido ✓
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| Banco de Dados | Cancelar pedido #8 (duplicado) |
| `src/hooks/useOrders.ts` | Novo hook `useUpdatePaymentMethod` |
| `src/pages/Orders.tsx` | Adicionar UI para editar pagamento no modal |

---

## Prevenção Futura

1. **Botão "Confirmar Pedido"** no POS já está protegido com `disabled={createOrder.isPending}`
2. **Nova funcionalidade de editar pagamento** evitará que usuários criem novos pedidos apenas para corrigir pagamento
3. **Feedback visual** claro quando pagamento é alterado

---

## Resultado Esperado

1. Pedido #8 será cancelado (ficará no histórico como referência)
2. Pedido #9 permanece como o pedido válido
3. Futuramente, usuários poderão editar o pagamento diretamente sem criar duplicatas
