
# Plano: Incluir Código Pix na Notificação de Pedido Pronto

## Problema Identificado

Atualmente, quando o status do pedido muda para "ready" (pronto), a mensagem do WhatsApp não inclui o código Pix para pagamento. Conforme a imagem compartilhada, a mensagem atual é muito simples:

```
🎉 Olá Ricardo!
Seu pedido #17 está PRONTO! ✅
Agradecemos a preferência! 💚
```

## Solução

Modificar a edge function `send-order-notification` para incluir o código Pix na mensagem de "pedido pronto", permitindo que o cliente pague no momento que for notificado.

## Nova Mensagem Proposta

```
🎉 Olá Ricardo!

Seu pedido #17 na Mesa 5 está PRONTO! ✅

🍽️ Já estamos levando até você!

💰 Valor Total: R$ 45,90

📱 Pague via Pix:
Copie o código abaixo e cole no seu app de banco:

00020126580014BR.GOV.BCB.PIX0136...

Agradecemos a preferência! 💚
```

## Alteração Necessária

**Arquivo:** `supabase/functions/send-order-notification/index.ts`

**Modificação no case "ready"** (linhas 313-336):

Adicionar o valor total e o código Pix em todas as variações de mensagem de "pedido pronto":
- Pedido de mesa
- Pedido delivery
- Pedido balcão
- Outros pedidos

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Mensagem simples sem valor | Inclui valor total do pedido |
| Sem código Pix | QR Code Pix "copia e cola" |
| Cliente não sabe quanto pagar | Cliente pode pagar imediatamente |
