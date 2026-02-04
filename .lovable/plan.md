
# Notificação Automática de Pix via WhatsApp para Pedidos de Mesa

## Objetivo

Quando o cliente da mesa enviar o pedido com telefone cadastrado, ele receberá automaticamente uma mensagem WhatsApp com:
- Confirmação do pedido
- Número do pedido e mesa
- Valor total
- **Código Pix copia e cola** destacado para pagamento imediato

## Arquitetura da Solução

```text
┌─────────────────────┐
│  Cliente na Mesa    │
│  (CustomerOrder)    │
└─────────┬───────────┘
          │ 1. Enviar Pedido
          ▼
┌─────────────────────┐
│  useCustomerOrder   │──► 2. INSERT orders
│  (Hook)             │
└─────────┬───────────┘
          │ 3. onSuccess
          ▼
┌─────────────────────┐
│ send-order-         │──► 4. Gera código Pix EMV
│ notification        │
└─────────┬───────────┘
          │ 5. Evolution API
          ▼
┌─────────────────────┐
│  WhatsApp Cliente   │
│  📱 Código Pix      │
└─────────────────────┘
```

## Mensagem WhatsApp Enviada

```
✅ *Pedido Confirmado!*

Olá João! Seu pedido *#42* na *Mesa 5* foi recebido!

💰 *Valor Total: R$ 67,90*

📱 *Pague via Pix:*
Copie o código abaixo e cole no seu app de banco:

```00020126580014br.gov.bcb.pix0136...```

⏱️ Tempo estimado: 15-20 min

Agradecemos a preferência! 💚
```

## Alterações Necessárias

### 1. `src/hooks/useCustomerOrder.ts`

Adicionar chamada à edge function após criar o pedido com sucesso:

```typescript
// No onSuccess da mutation
onSuccess: (order) => {
  // Feedback háptico
  if (navigator.vibrate) {
    navigator.vibrate(200);
  }
  
  setOrderSuccess(true);
  setOrderNumber(order.order_number);
  setOrderId(order.id);
  
  // NOVO: Enviar notificação WhatsApp com Pix
  if (customerInfo.phone && unitId) {
    supabase.functions.invoke("send-order-notification", {
      body: {
        orderId: order.id,
        status: "confirmed",
        unitId: unitId,
      },
    }).catch((err) => {
      console.log("Notification skipped:", err);
    });
  }
  
  clearCart();
  // ...
}
```

## Fluxo Completo do Cliente

1. Cliente abre cardápio da mesa via QR Code
2. Adiciona itens ao carrinho
3. Preenche nome e **telefone**
4. Seleciona forma de pagamento (Pix, Dinheiro ou Cartão)
5. Clica "Enviar Pedido"
6. **Recebe WhatsApp com código Pix** (se telefone informado)
7. Abre página de tracking com QR Code para escanear
8. Paga pelo app do banco
9. Pedido aparece no KDS da cozinha

## Responsividade

A implementação usa a edge function existente que já é:
- **Segura**: Usa service role key no servidor
- **Assíncrona**: Não bloqueia o fluxo do cliente
- **Silenciosa**: Erros são logados mas não mostrados ao cliente

## Detalhes Técnicos

- A edge function `send-order-notification` já implementa toda a lógica de geração de código Pix EMV
- O código Pix é gerado com os dados da configuração da unidade (`pix_key`, `pix_merchant_name`, `pix_merchant_city`)
- A mensagem usa formatação Markdown do WhatsApp (negrito com asteriscos, código com crases)
- Se o cliente não informar telefone ou WhatsApp não estiver configurado, a notificação é silenciosamente ignorada, nao quero esse pix que esta vindo nele quero o que eu adicionar
