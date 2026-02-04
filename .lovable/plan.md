
# Plano: Correção do Fluxo de Pedidos via QR Code + Notificações WhatsApp

## Problema Identificado

O cliente consegue abrir o cardápio digital e adicionar itens ao carrinho, mas quando clica em "Enviar Pedido para Cozinha", o pedido **não é criado no banco de dados** devido a problemas de permissão (RLS).

### Diagnóstico Técnico

Ao analisar as políticas de segurança do banco de dados, encontrei o seguinte:

| Tabela | Permissão INSERT (anon) | Permissão SELECT (anon) |
|--------|-------------------------|-------------------------|
| orders | ✅ Sim (channel='table') | ❌ **NÃO** |
| order_items | ✅ Sim (mas depende de SELECT em orders) | ❌ **NÃO** |

**Causa Raiz:**
1. O código faz `.insert().select().single()` - precisa de SELECT para retornar o pedido criado
2. A política de `order_items` verifica se o pedido existe com `EXISTS (SELECT FROM orders...)` - sem SELECT no orders, sempre falha
3. Resultado: pedido não é criado, itens não são inseridos, cliente vê tela de sucesso falsa

---

## Solução Proposta

### 1. Adicionar Políticas de Leitura para Clientes Anônimos

Permitir que clientes anônimos possam:
- Ver seus próprios pedidos (channel = 'table')
- Ver os itens dos pedidos de mesa

```text
┌──────────────────────────────────────────────────────────┐
│  ANTES (Bloqueado)                                       │
│  Cliente → INSERT order → SELECT order → ❌ ERRO         │
│  Cliente → INSERT order_items → EXISTS check → ❌ ERRO   │
├──────────────────────────────────────────────────────────┤
│  DEPOIS (Funcionando)                                    │
│  Cliente → INSERT order → SELECT order → ✅ Retorna ID   │
│  Cliente → INSERT order_items → EXISTS check → ✅ OK     │
│  KDS → Recebe pedido em tempo real                       │
└──────────────────────────────────────────────────────────┘
```

### 2. Melhorar Tratamento de Erros no Frontend

Adicionar feedback visual quando algo der errado para que o cliente saiba que precisa tentar novamente.

### 3. Adicionar Mensagem Específica para Pedidos de Mesa

Melhorar a mensagem do WhatsApp quando o pedido de mesa estiver pronto:
- Informar número da mesa
- Tom amigável e profissional

---

## Alterações Necessárias

### Banco de Dados (Migration SQL)

```sql
-- Permitir que clientes anônimos vejam pedidos de mesa
CREATE POLICY "Public can read table orders"
ON public.orders
FOR SELECT
TO anon
USING (channel = 'table');

-- Permitir que clientes anônimos vejam itens de pedidos de mesa
CREATE POLICY "Public can read table order items"
ON public.order_items
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.channel = 'table'
  )
);
```

### Frontend - Tratamento de Erros

**Arquivo:** `src/pages/CustomerOrder.tsx`

Adicionar exibição de erros para o cliente:
- Toast de erro quando a submissão falhar
- Estado de erro visual no botão
- Mensagem clara explicando o problema

### Edge Function - Mensagem de Mesa

**Arquivo:** `supabase/functions/send-order-notification/index.ts`

Adicionar tratamento especial para pedidos de mesa:
```javascript
case "ready":
  if (order.channel === "table") {
    message = `🎉 *Olá ${customerName}!*\n\n` +
      `Seu pedido *#${order.order_number}* na *Mesa ${tableNumber}* está *PRONTO*! ✅\n\n` +
      `Já estamos levando até você!\n` +
      `Agradecemos a preferência! 💚`;
  }
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/new_migration.sql` | Adicionar políticas SELECT para anon |
| `src/pages/CustomerOrder.tsx` | Adicionar tratamento de erros |
| `src/hooks/useCustomerOrder.ts` | Adicionar onError handler |
| `supabase/functions/send-order-notification/index.ts` | Melhorar mensagem para mesas |

---

## Fluxo Completo Após Correção

```text
┌─────────────────────────────────────────────────────────────────┐
│  1. CLIENTE ESCANEIA QR CODE                                    │
│     └→ Abre cardápio digital (/order/:tableId)                  │
├─────────────────────────────────────────────────────────────────┤
│  2. CLIENTE FAZ PEDIDO                                          │
│     └→ Adiciona itens, nome e telefone                          │
│     └→ Clica "Enviar Pedido para Cozinha"                       │
├─────────────────────────────────────────────────────────────────┤
│  3. SISTEMA PROCESSA                                            │
│     └→ Cria pedido (orders) com channel='table'                 │
│     └→ Cria itens do pedido (order_items)                       │
│     └→ Atualiza mesa para status='occupied'                     │
│     └→ Trigger dispara notificação no sistema                   │
├─────────────────────────────────────────────────────────────────┤
│  4. KDS RECEBE PEDIDO (Realtime)                                │
│     └→ Pedido aparece em "Pendentes" com som de alerta          │
│     └→ Cozinha clica "Iniciar Preparo" → status='preparing'     │
│     └→ Marca itens como prontos                                 │
│     └→ Clica "Pronto" → status='ready'                          │
├─────────────────────────────────────────────────────────────────┤
│  5. NOTIFICAÇÃO WHATSAPP                                        │
│     └→ Edge function verifica se cliente tem telefone           │
│     └→ Envia mensagem personalizada via Evolution API           │
│     └→ "Seu pedido #X na Mesa Y está PRONTO! ✅"                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Melhorias Adicionais

1. **Toast de sucesso/erro** mais visíveis para o cliente
2. **Vibração do dispositivo** ao enviar pedido (feedback háptico)
3. **Animação de confete** na tela de sucesso
4. **Estimativa de tempo** mais precisa baseada nos itens
5. **Acompanhamento em tempo real** - cliente pode ver status do pedido

---

## Resultado Esperado

- ✅ Pedidos via QR Code funcionando corretamente
- ✅ Pedidos aparecem no KDS em tempo real
- ✅ Cliente recebe notificação quando pedido estiver pronto
- ✅ Mesa atualiza status automaticamente
- ✅ Feedback claro em caso de erros
