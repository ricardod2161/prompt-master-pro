
# Correção: Notificação WhatsApp não chega no cliente

## Problema Identificado

O log da Evolution API mostra:
```json
{"status":400,"error":"Bad Request","response":{"message":[{"jid":"5584998570652@s.whatsapp.net","exists":false}]}}
```

A API retorna `exists: false` porque o número está sendo enviado no formato incorreto.

### Comparação de Código

| Função | Campo `number` | Resultado |
|--------|----------------|-----------|
| `whatsapp-webhook` (funciona) | `5584998570652` | ✅ Sucesso |
| `send-order-notification` (falha) | `5584998570652@s.whatsapp.net` | ❌ Bad Request |

## Solução

Remover o sufixo `@s.whatsapp.net` do campo `number` na requisição da Evolution API.

### Alteração no Código

**Arquivo:** `supabase/functions/send-order-notification/index.ts`

**Antes (linhas 394-417):**
```typescript
// Format phone number for WhatsApp
let phone = order.customer_phone.replace(/\D/g, "");
if (!phone.startsWith("55")) {
  phone = "55" + phone;
}
const remoteJid = `${phone}@s.whatsapp.net`;  // ← PROBLEMA

// ...
body: JSON.stringify({
  number: remoteJid,  // ← Enviando formato errado
  text: message,
}),
```

**Depois:**
```typescript
// Format phone number for WhatsApp
let phone = order.customer_phone.replace(/\D/g, "");
if (!phone.startsWith("55")) {
  phone = "55" + phone;
}
// Removido: const remoteJid = `${phone}@s.whatsapp.net`;

// ...
body: JSON.stringify({
  number: phone,  // ← Apenas o número, sem sufixo
  text: message,
}),
```

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/send-order-notification/index.ts` | Remover `@s.whatsapp.net` do campo `number` |

## Fluxo Após Correção

```text
1. Cliente faz pedido na mesa com telefone
2. Estabelecimento marca pedido como "Pronto"
3. Sistema envia número: "5584998570652" (sem sufixo)
4. Evolution API encontra o número no WhatsApp
5. Mensagem entregue ao cliente ✅
```

## Observação Importante

O erro `exists: false` também pode ocorrer se o número do cliente realmente não estiver cadastrado no WhatsApp. Porém, o formato incorreto está causando falhas mesmo para números válidos.
