
# Correção: Fechar Conta com Limpeza Profissional da Mesa

## Problema Identificado

Quando o cliente fecha a conta:
1. ✅ Mesa é atualizada para "free"
2. ❌ Pedidos permanecem com status "pending/preparing/ready/delivered"
3. ❌ Na próxima sessão, os pedidos antigos podem aparecer

## Solução Proposta

### 1. Atualizar Status dos Pedidos ao Fechar

No hook `useTableBill.ts`, ao fechar a conta:
- Marcar todos os pedidos da mesa como "completed" (finalizado)
- Isso garante que não apareçam na conta de um próximo cliente

### 2. Invalidar Queries Corretamente

Após fechar:
- Invalidar a query de pedidos da mesa
- Limpar estados locais

### 3. Feedback Visual Profissional

- Mostrar confirmação de sucesso
- Limpar a interface após 2-3 segundos
- Permitir nova sessão de consumo

## Alterações Técnicas

### Arquivo: `src/hooks/useTableBill.ts`

```typescript
// Dentro da mutação closeBill, após atualizar a mesa:

// 1. Marcar todos os pedidos como completados
const orderIds = orders.map(o => o.id);
await supabase
  .from("orders")
  .update({ status: "completed" })
  .in("id", orderIds);

// 2. Atualizar mesa para livre
await supabase
  .from("tables")
  .update({ status: "free" })
  .eq("id", tableId);
```

### Arquivo: `src/components/customer-order/TableBillSheet.tsx`

Melhorias na UI:
- Auto-fechar o sheet após sucesso com delay
- Limpar o campo de telefone após sucesso
- Adicionar animação de feedback

## Fluxo Final

```text
Cliente na Mesa
      │
      ├──► Pedido 1 (R$ 35,00) → status: pending → preparing → ready
      ├──► Pedido 2 (R$ 22,50) → status: pending → preparing
      │
      ▼
Clica "Ver Conta" → Vê total R$ 57,50
      │
      ▼
Clica "Fechar Conta"
      │
      ├──► WhatsApp enviado com resumo + Pix
      ├──► Pedidos atualizados para "completed"
      ├──► Mesa atualizada para "free"
      │
      ▼
Mesa limpa para próximo cliente
```

## Resultado Esperado

1. Conta mostra corretamente todos os pedidos acumulados
2. Ao fechar, cliente recebe resumo no WhatsApp
3. Todos os pedidos são marcados como "completed"
4. Mesa fica livre e limpa para próximo cliente
5. Interface profissional com feedback visual adequado
