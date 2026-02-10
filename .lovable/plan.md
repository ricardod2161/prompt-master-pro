

# Imprimir endereco de entrega na comanda

## O que sera feito

Quando um pedido de delivery ficar pronto e for impresso, a comanda incluira o endereco de entrega em destaque, tornando o processo mais profissional para o entregador.

## Detalhes tecnicos

**Arquivo**: `src/hooks/usePrintOrder.ts`

1. Adicionar campo `deliveryAddress` na interface `PrintTicketData`
2. Na funcao `formatTicketText`, apos a secao do cliente/mesa, adicionar uma secao de endereco de entrega destacada:

```text
================================
       COMANDA #42
================================
Data: 10/02/2026 14:30
Canal: DELIVERY
Cliente: Ricardo
--------------------------------
       ** ENDERECO **
Rua das Flores, 123
Bairro Centro - Apto 4B
--------------------------------
       ** ITENS **
...
```

3. Na funcao `printKitchenTicket`, passar o endereco da `delivery_order` para o ticket:

```typescript
deliveryAddress: order.delivery_order?.address || null,
```

O endereco aparecera com destaque visual (entre divisores) apenas para pedidos de delivery que tenham endereco cadastrado. Pedidos de balcao, mesa ou sem endereco nao serao afetados.
