
# Correção: Botão "Voltar" na Tela de Acompanhamento

## Problema Identificado

Na tela de acompanhamento do pedido (`OrderTracking`), o botão "Voltar" usa `navigate(-1)` para voltar no histórico. Porém, quando o pedido é finalizado em `CustomerOrder`, a navegação usa `replace: true`, que **substitui** a entrada do histórico ao invés de adicionar uma nova.

**Resultado:** O histórico não tem a página anterior, então `navigate(-1)` não funciona ou vai para uma página inesperada.

## Fluxo Correto Esperado

```text
Cliente na Mesa → Faz Pedido 1 → Acompanha Pedido 1
       ↑                              │
       └────── Clica "Voltar" ────────┘
       │
       ├──► Faz Pedido 2 → Acompanha Pedido 2
       │                        │
       └─── Clica "Voltar" ─────┘
       │
       └──► Fecha Conta (soma todos pedidos)
```

## Solução

### 1. Arquivo: `src/pages/OrderTracking.tsx`

Mudar o botão "Voltar" para navegar diretamente para `/order/:tableId` ao invés de usar `navigate(-1)`:

**De:**
```typescript
<Button onClick={() => navigate(-1)}>
  Voltar
</Button>
```

**Para:**
```typescript
<Button onClick={() => {
  if (order?.table_id) {
    navigate(`/order/${order.table_id}`);
  } else {
    navigate(-1);
  }
}}>
  Voltar
</Button>
```

Isso garante que:
- Se o pedido for de mesa → volta para o cardápio da mesa
- Se não for de mesa → usa o histórico normal

### 2. Arquivo: `src/hooks/useOrderTracking.ts`

Verificar se o hook já retorna o `table_id` do pedido. Se não retornar, adicionar.

## Resultado Esperado

- Cliente faz pedido na mesa
- É redirecionado para tela de acompanhamento
- Clica em "Voltar"
- Volta para o cardápio da mesa `/order/:tableId`
- Pode fazer novos pedidos
- Todos os pedidos acumulam na conta
- Quando quiser, fecha a conta pelo botão "Ver Conta"

## Alterações Técnicas

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/OrderTracking.tsx` | Ajustar botão Voltar para navegar para `/order/:tableId` |
| `src/hooks/useOrderTracking.ts` | Garantir que `table_id` está disponível no retorno |
