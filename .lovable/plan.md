
# Corrigir Pedidos Nao Aparecendo sem Atualizar Pagina

## Problema

Ao criar um pedido (ex: pelo PDV), ele nao aparece imediatamente na lista de pedidos (/orders). O usuario precisa recarregar a pagina manualmente para ve-lo.

## Causa Raiz

Quando o `useCreateOrder` finaliza com sucesso, ele chama `invalidateQueries({ queryKey: ["orders"] })`. Porem, isso apenas *marca* a query como "stale" (obsoleta) e dispara um refetch em background. Se a pagina de pedidos nao esta montada naquele momento (usuario navega depois), a invalidacao nao tem efeito visivel. Alem disso, o canal realtime pode sofrer latencia ou falhar silenciosamente.

A solucao e garantir um refetch imediato e confiavel, combinando:

1. **Refetch forcado no `onSuccess` do mutation** usando `refetchQueries` em vez de apenas `invalidateQueries`
2. **Refetch ao montar a pagina de pedidos** para sempre buscar dados frescos
3. **Corrigir nome do canal realtime** para evitar conflitos quando multiplas instancias do hook sao usadas

## Alteracoes

### 1. `src/hooks/useOrders.ts` - useCreateOrder

No `onSuccess`, trocar `invalidateQueries` por `refetchQueries` para forcar busca imediata:

```typescript
onSuccess: () => {
  queryClient.refetchQueries({ queryKey: ["orders"] });
  toast({ title: "Pedido criado com sucesso!" });
},
```

### 2. `src/hooks/useOrders.ts` - useOrders

- Reduzir `staleTime` para 0 (padrao) para que a query sempre refaça busca quando invalidada
- Usar um nome de canal realtime unico baseado no `unit_id` para evitar conflitos:

```typescript
const channel = supabase
  .channel(`orders-realtime-${selectedUnit.id}`)
```

- Na callback do realtime, usar `refetchQueries` para busca imediata:

```typescript
() => {
  queryClient.refetchQueries({ queryKey: ["orders", selectedUnit.id] });
}
```

### 3. `src/pages/Orders.tsx` - Refetch ao montar

Adicionar `refetchOnMount: "always"` ou chamar `refetch()` via `useEffect` para garantir dados frescos ao abrir a pagina. Isso sera feito passando a opcao no hook ou chamando refetch no componente.

## Resultado Esperado

- Pedidos aparecem instantaneamente apos criacao, sem necessidade de recarregar a pagina
- O canal realtime sincroniza mudancas de outros dispositivos/abas
- A pagina de pedidos sempre mostra dados atualizados ao ser aberta
