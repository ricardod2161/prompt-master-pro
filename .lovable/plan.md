# Reativacao Automatica do Bot no WhatsApp

## Problema Identificado

Quando o bot e desativado para uma conversa (seja por escalacao para atendente humano ou por toggle manual), ele **nunca mais e reativado automaticamente**. O trecho do webhook que atualiza conversas existentes (linha 1872-1879) apenas atualiza `customer_name`, `last_message` e `last_message_at`, mas nao reativa o `is_bot_active`.

Isso significa que, apos qualquer desativacao, o cliente fica sem resposta ate que alguem va manualmente reativar o bot.

## Solucao Proposta

Implementar **reativacao automatica por tempo de inatividade**. Se a ultima mensagem da conversa foi ha mais de **30 minutos**, o bot sera automaticamente reativado quando o cliente enviar uma nova mensagem. Isso garante que:

1. Conversas escaladas para humano continuam sob controle humano enquanto estao ativas
2. Apos um periodo de inatividade, o bot volta a funcionar sem intervencao manual
3. Novas conversas continuam sendo criadas com o bot ativo (ja funciona assim)

## Alteracoes Tecnicas

### 1. Edge Function `whatsapp-webhook/index.ts`

No bloco de atualizacao de conversa existente (linha 1872-1879), adicionar logica de reativacao:

```typescript
// Quando conversa existente recebe nova mensagem
} else {
  // Auto-reactivate bot if conversation has been inactive for 30+ minutes
  const lastMessageAt = conversation.last_message_at 
    ? new Date(conversation.last_message_at).getTime() 
    : 0;
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
  const shouldReactivateBot = !conversation.is_bot_active && lastMessageAt < thirtyMinutesAgo;

  if (shouldReactivateBot) {
    console.log(`[AUTO-REACTIVATE] Bot reactivated for conversation ${conversation.id} after inactivity`);
  }

  await supabase
    .from("whatsapp_conversations")
    .update({
      customer_name: customerName,
      last_message: messageText,
      last_message_at: new Date().toISOString(),
      ...(shouldReactivateBot ? { is_bot_active: true } : {}),
    })
    .eq("id", conversation.id);

  // Update local reference if reactivated
  if (shouldReactivateBot) {
    conversation.is_bot_active = true;
  }
}
```

### 2. Impacto

- **Sem risco de loop**: a protecao `fromMe: true` continua ativa
- **Respeita o atendimento humano**: se o atendente esta respondendo (ultimos 30 min), o bot nao interfere
- **Transparente**: um log e gerado cada vez que o bot e reativado automaticamente
- **Sem mudanca no banco**: nenhuma migracao necessaria, apenas logica no webhook

### Resumo do Fluxo

1. Cliente envia mensagem
2. Webhook verifica se conversa existe
3. Se existe e bot esta desativado: verifica tempo desde ultima mensagem
4. Se inativo ha mais de 30 minutos: reativa o bot automaticamente
5. Bot processa e responde normalmente  
quero que ative em 10 minutos nao 30, e que interrompa somente por cliente, se um outro estiver mandando mensagem responda.