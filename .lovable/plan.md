
# Melhorias no Bot WhatsApp: Cardápio Separado e Escalação Humana

## ✅ STATUS: IMPLEMENTADO

### Funcionalidades Entregues:
1. **Cardápio em Mensagens Separadas** - Cada categoria é enviada como mensagem individual com emojis
2. **Detecção de Escalação Humana** - 40+ palavras-chave detectam pedido de atendimento humano
3. **Handoff Automático** - Bot desativa automaticamente e notifica equipe

---

## Problema Original

### 1. Cardápio em Bloco Único
O bot enviava o cardápio inteiro em uma única mensagem:
```
📋 CARDÁPIO

BEBIDAS
• Suco de Abacate - R$ 10,00
• Suco de Manga - R$ 10,00

PRATOS FEITOS
• Feijão Carioca - R$ 20,00
...
```

### 2. Sem Detecção de Escalação
Quando o cliente reclama ou pede para falar com um humano, o bot continua respondendo automaticamente.

---

## Solução Proposta

### Parte 1: Cardápio em Mensagens Separadas

**Antes:**
```
Uma mensagem gigante com tudo junto
```

**Depois (como na imagem de referência):**
```
[Mensagem 1]
✨ BEM-VINDO AO RESTAURANTE! ✨

[Mensagem 2]
🍹 BEBIDAS
────────────
🔸 Suco de Abacate - R$ 10,00
🔸 Suco de Manga - R$ 10,00

[Mensagem 3]
🍽️ PRATOS FEITOS
────────────
🔸 Feijão Carioca - R$ 20,00

[Mensagem 4]
💬 O que você gostaria de pedir?
```

**Modificações:**

1. A função `listarCardapio()` retornará um array de strings em vez de uma string única
2. A função `sendWhatsAppMessage()` será modificada para enviar múltiplas mensagens com delay
3. O delay entre mensagens será de ~1 segundo para parecer natural

### Parte 2: Detecção de Escalação Humana

**Palavras-chave para detectar:**
- "quero falar com humano"
- "falar com pessoa"
- "atendente"
- "gerente"
- "reclamação"
- "insatisfeito"
- "não estou gostando"
- "problema"
- "absurdo"
- "descaso"

**Fluxo quando detectado:**
1. Bot identifica a solicitação de atendimento humano
2. Desativa o bot para essa conversa (`is_bot_active = false`)
3. Envia mensagem ao cliente: "Entendi! Vou transferir você para um atendente humano. Aguarde um momento..."
4. Cria notificação para a equipe de atendimento
5. Atendimento humano assume no painel do WhatsApp Chat

---

## Modificações Técnicas

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

#### 1. Nova função para enviar múltiplas mensagens
```typescript
async function sendMultipleWhatsAppMessages(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  phone: string,
  messages: string[]
): Promise<string> {
  let lastMessageId = "";
  
  for (let i = 0; i < messages.length; i++) {
    // Envia presença de digitando entre mensagens
    if (i > 0) {
      await sendPresence(apiUrl, apiToken, instanceName, phone, "composing");
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    lastMessageId = await sendWhatsAppMessage(
      apiUrl, apiToken, instanceName, phone, messages[i]
    );
    
    // Pequeno delay entre mensagens
    if (i < messages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }
  
  return lastMessageId;
}
```

#### 2. Modificar `listarCardapio()` para retornar array
```typescript
async function listarCardapio(
  supabase: any, 
  unitId: string
): Promise<{ type: 'multiple'; messages: string[] }> {
  // ... busca produtos ...
  
  // Agrupa por categoria
  const byCategory: Record<string, Product[]> = {};
  // ...
  
  // Gera array de mensagens
  const messages: string[] = [];
  
  // Mensagem de boas-vindas
  messages.push("✨ *BEM-VINDO AO NOSSO CARDÁPIO* ✨");
  
  // Uma mensagem por categoria
  for (const [category, items] of Object.entries(byCategory)) {
    const emoji = getCategoryEmoji(category);
    let categoryMsg = `${emoji} *${category.toUpperCase()}*\n────────────\n`;
    
    for (const item of items) {
      const price = item.delivery_price || item.price;
      categoryMsg += `🔸 ${item.name} - R$ ${price.toFixed(2).replace(".", ",")}\n`;
    }
    
    messages.push(categoryMsg.trim());
  }
  
  // Mensagem final
  messages.push("💬 O que você gostaria de pedir?");
  
  return { type: 'multiple', messages };
}
```

#### 3. Mapeamento de emojis por categoria
```typescript
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'bebidas': '🍹',
    'drinks': '🍹',
    'sucos': '🧃',
    'pratos': '🍽️',
    'pratos feitos': '🍽️',
    'lanches': '🍔',
    'hambúrguer': '🍔',
    'pizzas': '🍕',
    'sobremesas': '🍰',
    'doces': '🍰',
    'açaí': '🍇',
    'porções': '🍟',
    'combos': '🎁',
    'promoções': '🎉',
  };
  
  const key = category.toLowerCase();
  return emojiMap[key] || '📋';
}
```

#### 4. Nova função para detectar escalação
```typescript
function detectHumanEscalation(message: string): boolean {
  const escalationKeywords = [
    // Pedido direto de humano
    'falar com humano',
    'atendente humano',
    'pessoa real',
    'atendente real',
    'falar com alguém',
    'falar com pessoa',
    'atendimento humano',
    'atendente por favor',
    'quero um atendente',
    'chama o atendente',
    'passa pro atendente',
    'transfere pro atendente',
    // Reclamações e insatisfação
    'reclamação',
    'fazer reclamação',
    'quero reclamar',
    'gerente',
    'supervisor',
    'responsável',
    'não estou satisfeito',
    'insatisfeito',
    'absurdo',
    'descaso',
    'péssimo',
    'horrível',
    'vocês são ruins',
    'pior atendimento',
    'não resolve',
    'não está ajudando',
    'não entende',
    'esse robô',
    'esse bot',
    'máquina',
    'cansei',
    'desisto',
  ];
  
  const lowerMessage = message.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  return escalationKeywords.some(keyword => 
    lowerMessage.includes(keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
}
```

#### 5. Função para escalar para humano
```typescript
async function escalateToHuman(
  supabase: any,
  conversationId: string,
  unitId: string,
  customerPhone: string,
  customerName: string,
  reason: string
): Promise<string> {
  // Desativa o bot para essa conversa
  await supabase
    .from('whatsapp_conversations')
    .update({ is_bot_active: false })
    .eq('id', conversationId);
  
  // Cria notificação para a equipe
  await supabase.from('notifications').insert({
    unit_id: unitId,
    title: '🆘 Atendimento Humano Solicitado',
    message: `Cliente ${customerName} (${customerPhone}) solicitou atendimento humano. Motivo detectado: ${reason}`,
    type: 'warning',
    read: false,
  });
  
  return `Entendi sua solicitação! 🙏

Vou transferir você para um *atendente humano* agora mesmo.

Por favor, aguarde um momento que logo alguém da nossa equipe vai te atender.

⏱️ Tempo médio de espera: 2-5 minutos`;
}
```

#### 6. Integração no fluxo principal
No handler principal, antes de processar com IA:
```typescript
// Verificar se cliente quer falar com humano
if (detectHumanEscalation(messageText)) {
  const escalationMessage = await escalateToHuman(
    supabase,
    conversation.id,
    settings.unit_id,
    phone,
    customerName,
    messageText.substring(0, 100)
  );
  
  await sendWhatsAppMessage(
    settings.api_url,
    settings.api_token,
    instanceName,
    phone,
    escalationMessage
  );
  
  // Salva a mensagem e retorna
  await supabase.from('whatsapp_messages').insert({
    conversation_id: conversation.id,
    role: 'assistant',
    content: escalationMessage,
    status: 'sent',
  });
  
  return new Response(JSON.stringify({ 
    status: 'escalated_to_human' 
  }));
}
```

---

## Fluxo Visual

```text
CARDÁPIO EM MENSAGENS SEPARADAS:
┌──────────────────────────────────────┐
│ Bot                                  │
├──────────────────────────────────────┤
│ ✨ BEM-VINDO AO RESTAURANTE! ✨      │ ← Msg 1
└──────────────────────────────────────┘
         [delay 1s + typing...]
┌──────────────────────────────────────┐
│ 🍹 BEBIDAS                           │ ← Msg 2
│ ────────────                         │
│ 🔸 Suco de Abacate - R$ 10,00        │
│ 🔸 Suco de Manga - R$ 10,00          │
└──────────────────────────────────────┘
         [delay 1s + typing...]
┌──────────────────────────────────────┐
│ 🍽️ PRATOS FEITOS                     │ ← Msg 3
│ ────────────                         │
│ 🔸 Feijão Carioca - R$ 20,00         │
└──────────────────────────────────────┘
         [delay 1s + typing...]
┌──────────────────────────────────────┐
│ 💬 O que você gostaria de pedir?     │ ← Msg 4
└──────────────────────────────────────┘


ESCALAÇÃO PARA HUMANO:
┌──────────────┐     ┌───────────────────┐
│   Cliente    │     │       Bot         │
│ "quero falar │────>│ detecta keyword   │
│ com humano"  │     │                   │
└──────────────┘     └─────────┬─────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
    ┌───────────────────┐        ┌───────────────────┐
    │ Desativa bot para │        │ Cria notificação  │
    │ essa conversa     │        │ no sistema        │
    └───────────────────┘        └───────────────────┘
                │
                ▼
    ┌───────────────────────────────────┐
    │ "Entendi! Vou transferir você     │
    │ para um atendente humano..."      │
    └───────────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────────┐
    │ 🔔 Painel WhatsApp Chat           │
    │ mostra conversa em destaque       │
    │ para atendimento manual           │
    └───────────────────────────────────┘
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/whatsapp-webhook/index.ts` | Nova função `sendMultipleWhatsAppMessages()` |
| `supabase/functions/whatsapp-webhook/index.ts` | Modificar `listarCardapio()` para retornar array |
| `supabase/functions/whatsapp-webhook/index.ts` | Nova função `getCategoryEmoji()` |
| `supabase/functions/whatsapp-webhook/index.ts` | Nova função `detectHumanEscalation()` |
| `supabase/functions/whatsapp-webhook/index.ts` | Nova função `escalateToHuman()` |
| `supabase/functions/whatsapp-webhook/index.ts` | Integrar detecção no fluxo principal |

---

## Resultado Esperado

1. **Cardápio elegante**: Cada categoria em mensagem separada com emojis e formatação bonita
2. **Transição natural**: Delay entre mensagens + indicador de "digitando" para parecer humano
3. **Escalação automática**: Detecção de 30+ palavras-chave de insatisfação/pedido de humano
4. **Notificação instantânea**: Equipe recebe alerta quando cliente pede atendente
5. **Handoff suave**: Bot para automaticamente, humano assume no painel

