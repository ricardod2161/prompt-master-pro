
# Correção dos Problemas: Delivery + WhatsApp Chat

## Problemas Identificados

### 1. Botão "Entregar" Não Funciona na Tela de Delivery

**Causa Raiz:**
- O pedido #7 está com status `pending`, mas os botões "Despachar" e "Entregue" só aparecem na aba "Prontos" (pedidos com status `ready`)
- Na aba "Preparando" não há nenhum botão de ação disponível
- Além disso, o hook `useMarkDelivered` tenta atualizar `delivery_orders` primeiro, mas se não existe registro (porque o entregador nunca foi atribuído), o update silenciosamente não encontra nada para atualizar

**Fluxo Atual Quebrado:**
```text
Pedido pending → Aba "Preparando" → SEM BOTÕES → Usuário não consegue avançar
```

### 2. Conversas do WhatsApp Não Aparecem

**Causa Raiz:**
- As conversas existem no banco de dados e estão na unidade `Restaurante Demo` (ID: `00000000-0000-0000-0000-000000000001`)
- **NENHUM usuário** está associado a essa unidade na tabela `user_units`
- A política RLS (`has_unit_access`) bloqueia o acesso porque o usuário não tem permissão para essa unidade
- Provavelmente o usuário está logado em outra unidade (como "paulo" ou "dantas lima")

---

## Solução Proposta

### Parte 1: Melhorar Fluxo de Delivery

#### 1.1 Adicionar Botões de Ação em Todas as Abas
Na página `src/pages/Delivery.tsx`, os pedidos em preparo também precisam de botões:

| Aba | Status | Botões Disponíveis |
|-----|--------|-------------------|
| Preparando | pending/preparing | **"Marcar Pronto"** (novo) |
| Prontos | ready | "Despachar", "Entregue" |
| Entregues | delivered | (nenhum - histórico) |

#### 1.2 Corrigir Hook `useMarkDelivered`
Modificar para:
1. Verificar se existe registro em `delivery_orders`
2. Se não existir, apenas atualizar o status do pedido para `delivered`
3. Se existir, atualizar `delivery_time` e o status

#### 1.3 Adicionar Hook para Marcar como Pronto
Criar `useMarkReady` que:
- Atualiza o status do pedido para `ready`
- Opcionalmente envia notificação ao cliente

#### 1.4 Melhorar Feedback Visual
- Adicionar estado de loading nos botões
- Mostrar toast de sucesso/erro claro
- Destacar pedidos prontos para despacho

---

### Parte 2: Corrigir WhatsApp Chat

#### 2.1 Diagnóstico
O usuário precisa:
- Estar logado na unidade correta (`Restaurante Demo`)
- Ou criar conversas na unidade em que está atualmente

#### 2.2 Verificar Seleção de Unidade
Adicionar log/debug no hook `useWhatsAppConversationsRealtime` para verificar qual unidade está selecionada.

#### 2.3 Solução Recomendada
- Se o usuário quer usar o WhatsApp na unidade atual, as conversas precisam ser associadas a essa unidade
- Se quer usar a unidade Demo, precisa ter acesso a ela em `user_units`

---

## Alterações Técnicas

### Arquivo 1: `src/hooks/useDelivery.ts`

**Novo hook `useMarkReady`:**
```typescript
export function useMarkReady() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "ready" })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      toast({ title: "Pedido pronto para entrega!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao marcar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
```

**Corrigir `useMarkDelivered`:**
```typescript
export function useMarkDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // Tenta atualizar delivery_orders SE existir
      const { data: existing } = await supabase
        .from("delivery_orders")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("delivery_orders")
          .update({ delivery_time: new Date().toISOString() })
          .eq("order_id", orderId);
      }

      // Sempre atualiza o status do pedido
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "delivered" })
        .eq("id", orderId);

      if (orderError) throw orderError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      toast({ title: "Entrega confirmada!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao confirmar entrega",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
```

### Arquivo 2: `src/pages/Delivery.tsx`

**Adicionar botões na aba "Preparando":**
```typescript
// Na aba "pending" (Preparando), adicionar botão para marcar como pronto
<TabsContent value="pending">
  {pendingOrders.map((order) => (
    <OrderCard
      key={order.id}
      order={order}
      onMarkReady={() => markReady.mutate(order.id)} // NOVO
    />
  ))}
</TabsContent>
```

**Atualizar componente OrderCard:**
```typescript
function OrderCard({
  order,
  onMarkReady,  // NOVO
  onAssign,
  onDeliver,
}) {
  return (
    <Card3D>
      {/* ... conteúdo existente ... */}
      <div className="flex gap-2">
        {onMarkReady && (
          <Button onClick={onMarkReady}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Pronto
          </Button>
        )}
        {onAssign && (
          <Button variant="outline" onClick={onAssign}>
            <Truck className="h-4 w-4 mr-1" />
            Despachar
          </Button>
        )}
        {onDeliver && (
          <Button onClick={onDeliver}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Entregue
          </Button>
        )}
      </div>
    </Card3D>
  );
}
```

### Arquivo 3: `src/hooks/useWhatsAppChat.ts`

**Adicionar debug para verificar unidade:**
```typescript
export function useWhatsAppConversationsRealtime() {
  const { selectedUnit } = useUnit();
  
  // Debug: verificar qual unidade está selecionada
  useEffect(() => {
    console.log("WhatsApp Chat - Selected Unit:", selectedUnit?.id, selectedUnit?.name);
  }, [selectedUnit]);

  const query = useQuery({
    queryKey: ["whatsapp-conversations-rt", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) {
        console.warn("WhatsApp Chat: No unit selected");
        return [];
      }
      // ... resto da query
    },
  });
}
```

---

## Fluxo de Delivery Corrigido

```text
ANTES:
Pedido pending → Aba "Preparando" → SEM BOTÕES → ❌ Bloqueado

DEPOIS:
Pedido pending → Aba "Preparando" → [Botão "Pronto"] → 
  ↓
Pedido ready → Aba "Prontos" → [Despachar] [Entregue] →
  ↓
Pedido delivered → Aba "Entregues" → Histórico ✓
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useDelivery.ts` | Novo hook `useMarkReady`, corrigir `useMarkDelivered` |
| `src/pages/Delivery.tsx` | Adicionar botão "Pronto" na aba Preparando, melhorar OrderCard |
| `src/hooks/useWhatsAppChat.ts` | Adicionar log de debug para verificar unidade |

---

## Ação Necessária do Usuário

Para resolver o problema do WhatsApp Chat:
1. Verificar qual unidade está selecionada (canto superior esquerdo)
2. Se as conversas estão em "Restaurante Demo", precisa trocar para essa unidade
3. Ou configurar o WhatsApp na unidade em que está atualmente

---

## Resultado Esperado

1. **Delivery:** Botões de ação visíveis em todas as etapas do fluxo
2. **Delivery:** Botão "Entregue" funcionará mesmo sem entregador atribuído
3. **WhatsApp:** Com o debug, será possível identificar se o problema é a unidade selecionada
