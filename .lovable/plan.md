

# Correção: Cardápio WhatsApp Repetido

## Problema

Quando o cliente pede o cardápio, o bot envia duas vezes:
1. O cardápio formatado corretamente (via `sendMultipleWhatsAppMessages`) -- este e o formato desejado (segunda imagem)
2. A IA gera uma SEGUNDA resposta reescrevendo o cardápio inteiro

O filtro atual (linhas 1904-1906) tenta detectar respostas duplicadas mas so verifica frases especificas como "aqui esta o cardapio", enquanto a IA pode usar variações diferentes.

## Solução

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

**Mudança 1 - Instrução clara no resultado da tool (linha ~426-428)**

Alterar o texto retornado ao AI para ser mais explicito:

```typescript
return {
  text: `[CARDÁPIO JÁ ENVIADO AO CLIENTE. NÃO repita os itens do cardápio na sua resposta. O cardápio completo já foi enviado em mensagens separadas. Apenas pergunte o que o cliente gostaria de pedir, sem listar produtos novamente.]`,
  multipleMessages: menuResult.messages
};
```

**Mudança 2 - Filtro mais robusto para suprimir resposta duplicada (linhas 1903-1909)**

Quando `menuMessages` foi enviado, suprimir QUALQUER resposta da IA que contenha indicadores de cardápio (preços, categorias, listas de produtos):

```typescript
// If menu was already sent via separate messages, suppress AI response entirely
// and just send a short follow-up if needed
if (menuMessages && menuMessages.length > 0) {
  // Don't send the AI response at all - the menu messages are sufficient
  // The last menu message already contains "O que você gostaria de pedir?"
  console.log("[MENU] Menu sent separately, suppressing AI duplicate response");
} else {
  // Normal flow - send AI response
  sentMessageId = await sendWhatsAppMessage(...);
  await supabase.from("whatsapp_messages").insert({...});
}
```

**Mudança 3 - Adicionar instrução no system prompt (linhas 2045-2048)**

Reforçar no prompt da ETAPA 3:

```
ETAPA 3 - ESCOLHA DOS ITENS:
Quando usar listar_cardapio, o cardápio já será enviado automaticamente ao cliente em mensagens formatadas.
NÃO repita o cardápio na sua resposta. Apenas pergunte o que o cliente gostaria de pedir.
```

## Resultado Esperado

- Cardapio enviado UMA vez, no formato organizado da segunda imagem (com categorias separadas, emojis, linhas horizontais)
- Sem duplicação de mensagens
- Bot pergunta "O que voce gostaria de pedir?" sem repetir itens

## Arquivos Alterados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/whatsapp-webhook/index.ts` | Corrigir tool result, filtro e system prompt |

