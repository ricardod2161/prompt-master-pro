
## Diagnóstico Preciso

O print mostra: bot conduziu o pedido perfeitamente (coletou nome, itens, endereço, pagamento, confirmação), chamou `confirmar_pedido`, **o pedido FOI criado no banco** (sem erro de DB), mas o cliente recebeu a mensagem de erro genérica.

**Causa raiz:** A função `confirmar_pedido` retorna uma string **enorme** (~800-1200 caracteres) contendo: código Pix EMV completo + link Stripe + link de rastreamento. Essa string entra no contexto do AI como `tool_result`. O AI então tenta gerar uma resposta final — nesse momento o contexto total fica enorme, somado ao fato que o `confirmarPedido` ainda faz chamadas externas (Stripe, Pix) que consomem tempo — causando timeout da Edge Function de 30s ou erro de `max_tokens`. O `catch` captura esse erro e envia a mensagem genérica ao cliente, mesmo que o pedido já esteja registrado.

**Problemas adicionais identificados:**
1. O `max_tokens: 2000` pode não ser suficiente para processar o enorme resultado de `confirmar_pedido` + gerar resposta
2. A geração de link Stripe via fetch externo dentro de `confirmarPedido` pode demorar 5-15s, contribuindo para o timeout
3. Quando `confirmar_pedido` retorna sucesso, a IA não precisa gerar nova resposta — o resultado já É a mensagem para o cliente

**Correção em 3 partes em `supabase/functions/whatsapp-webhook/index.ts`:**

### Parte 1 — Enviar confirmação diretamente, sem reprocessar pelo AI
No `processWithAI`, após executar `confirmar_pedido`, detectar que o resultado é uma confirmação de pedido (começa com `✅ *PEDIDO CONFIRMADO!*`) e retornar imediatamente sem nova iteração do AI:

```typescript
// No loop de tool_calls, após executeTool:
if (toolCall.function.name === "confirmar_pedido" && toolResult.text.startsWith("✅ *PEDIDO CONFIRMADO!*")) {
  // Retornar diretamente sem chamar AI novamente
  return { response: toolResult.text, menuMessages: pendingMenuMessages };
}
```

### Parte 2 — Aumentar max_tokens para 3000 e adicionar timeout explícito
O modelo precisa de mais tokens quando o contexto inclui o resultado longo do `confirmar_pedido`. Aumentar de 2000 para 3000.

### Parte 3 — Mover geração do link Stripe para fora do caminho crítico (async)
A chamada a `create-order-payment` (Stripe) dentro de `confirmarPedido` é síncrona e pode demorar. Movê-la para uma Promise não-bloqueante ou adicionar timeout de 5s.

### Parte 4 — Adicionar tratamento especial para "pedido já criado"
Se o erro ocorre DEPOIS que o pedido foi criado (ex: timeout após `confirmar_pedido`), o bot deve enviar uma mensagem informando que o pedido foi recebido, em vez da mensagem de erro genérica. Adicionar detecção de `confirmarPedido` bem-sucedido antes do throw.

### Arquivo modificado:
- `supabase/functions/whatsapp-webhook/index.ts`
  - Linha ~1791: adicionar early return após `confirmar_pedido` bem-sucedido
  - Linha ~1729: aumentar `max_tokens` de 2000 para 3000  
  - Linha ~1211: adicionar `Promise.race` com timeout de 5s na chamada Stripe
