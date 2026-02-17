
# Log de Debug na Reativacao + Confirmacao do Isolamento por Cliente

## Situacao Atual

O bot ja funciona de forma isolada por cliente -- cada conversa (numero de telefone) tem seu proprio campo `is_bot_active`. Se o cliente A pede atendimento humano, apenas a conversa do cliente A e desativada. O cliente B que mandar mensagem continua sendo atendido normalmente pelo bot.

O que precisa ser adicionado e um **log de debug mais detalhado** no momento da reativacao automatica, incluindo o ID da conversa e timestamp.

## Alteracao Tecnica

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

No bloco de reativacao automatica (linhas 1879-1881), melhorar o log para incluir mais informacoes de debug:

```typescript
if (shouldReactivateBot) {
  const now = new Date().toISOString();
  console.log(`[AUTO-REACTIVATE] Bot reactivated | conversation_id=${conversation.id} | phone=${phone} | last_message_at=${conversation.last_message_at} | reactivated_at=${now} | inactivity_minutes=${Math.round((Date.now() - lastMessageAt) / 60000)}`);
}
```

Isso gera logs como:
```
[AUTO-REACTIVATE] Bot reactivated | conversation_id=db967645-... | phone=559882549505 | last_message_at=2026-02-17T10:00:00Z | reactivated_at=2026-02-17T10:15:00Z | inactivity_minutes=15
```

## Sobre o Isolamento por Cliente

Nenhuma alteracao de codigo e necessaria para isso -- o sistema ja funciona assim:

- Cada numero de telefone tem sua propria conversa (`whatsapp_conversations`) com seu proprio `is_bot_active`
- Quando o cliente A pede atendimento humano, so a conversa dele e desativada (`is_bot_active = false`)
- Se o cliente B manda mensagem, a conversa dele tem `is_bot_active = true` e o bot responde normalmente
- A funcao `escalateToHuman` (linha 200) desativa o bot usando `.eq('id', conversationId)` -- apenas aquela conversa especifica

## Resumo

- 1 alteracao pequena no log de debug (mais detalhado com conversation_id, phone, timestamps e minutos de inatividade)
- Zero alteracoes na logica de isolamento por cliente (ja funciona corretamente)
