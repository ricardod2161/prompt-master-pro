
# Plano: Correção Completa do WhatsApp - Presence, Status e Áudio

## Análise dos Problemas Identificados

### 1. Indicador "Digitando/Gravando" NÃO aparece no WhatsApp do cliente

**Causa raiz encontrada:** O endpoint de presence está INCORRETO na Evolution API.

```text
CÓDIGO ATUAL (errado):
URL: ${apiUrl}/chat/presence/${instanceName}
Body: { number: phone, presence: "composing" }

CÓDIGO CORRETO (conforme documentação Evolution API):
URL: ${apiUrl}/chat/sendPresence/${instanceName}
Body: { number: phone, options: { presence: "composing", delay: 1200 } }
```

### 2. Status ✓✓ (risquinhos) - Esclarecimento IMPORTANTE

Os risquinhos (✓✓) no WhatsApp do CLIENTE são controlados **automaticamente pelo WhatsApp**, não pelo nosso sistema. O fluxo é:

```text
1. Bot envia mensagem → WhatsApp mostra ✓ (enviado)
2. Mensagem chega no celular do cliente → WhatsApp mostra ✓✓ (entregue)
3. Cliente abre a conversa → WhatsApp mostra ✓✓ azul (lido)
```

**O que nosso sistema faz:**
- Recebe eventos `messages.update` da Evolution API com status `DELIVERY_ACK` ou `READ`
- Atualiza o banco de dados local
- Mostra os risquinhos na NOSSA interface (ChatView)

**Os logs confirmam que está funcionando:**
```
Message cml49xpgi00sbs64ccubsaeif status updated to: delivered
Message cml49xpgi00sbs64ccubsaeif status updated to: read
```

### 3. Transcrição de Áudio - Análise

Os logs mostram que a transcrição **ESTÁ funcionando**:
```
Gemini Pro transcription successful: "Mande os códigos do sistema...."
```

A resposta "não consigo prosseguir o atendimento por áudio" na imagem pode ser de uma versão anterior do código. O fluxo atual está correto.

---

## Correções a Implementar

### Correção 1: Endpoint sendPresence (CRÍTICO)

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

**Função sendPresence atual (linhas 908-931):**
```typescript
async function sendPresence(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  phone: string,
  presence: "composing" | "recording" | "paused"
): Promise<void> {
  try {
    await fetch(`${apiUrl}/chat/presence/${instanceName}`, {  // ❌ ERRADO
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiToken,
      },
      body: JSON.stringify({
        number: phone,
        presence,  // ❌ ERRADO
      }),
    });
  } catch (error) {
    console.error("Error sending presence:", error);
  }
}
```

**Correção:**
```typescript
async function sendPresence(
  apiUrl: string,
  apiToken: string,
  instanceName: string,
  phone: string,
  presence: "composing" | "recording" | "paused"
): Promise<void> {
  try {
    console.log(`Sending presence ${presence} to ${phone}...`);
    
    const response = await fetch(
      `${apiUrl}/chat/sendPresence/${instanceName}`,  // ✅ CORRETO
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiToken,
        },
        body: JSON.stringify({
          number: phone,
          options: {  // ✅ CORRETO
            delay: 1200,  // Duração do indicador em ms
            presence: presence,
          },
        }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Presence error:", response.status, errorText);
    } else {
      console.log(`Presence ${presence} sent successfully to ${phone}`);
    }
  } catch (error) {
    console.error("Error sending presence:", error);
  }
}
```

### Correção 2: Múltiplas Chamadas de Presence

O indicador "digitando" deve ser enviado **múltiplas vezes** durante o processamento da IA, pois expira após alguns segundos:

```typescript
// Antes de processar com IA, iniciar interval para manter presence
const presenceInterval = setInterval(async () => {
  await sendPresence(
    settings.api_url,
    settings.api_token,
    instanceName,
    phone,
    "composing"
  );
}, 10000); // A cada 10 segundos

try {
  // Enviar presence inicial
  await sendPresence(..., "composing");
  
  // Processar com IA
  assistantMessage = await processWithAI(...);
} finally {
  // Limpar interval
  clearInterval(presenceInterval);
  
  // Enviar "paused" para limpar o indicador
  await sendPresence(..., "paused");
}
```

### Correção 3: Melhorar Logs de Debug

Adicionar logs mais detalhados em pontos críticos:

```typescript
// No recebimento do webhook
console.log(`[${payload.event}] Processing event...`);

// No envio de presence
console.log(`[PRESENCE] Sending ${presence} to ${phone}`);

// No update de status
console.log(`[STATUS] Message ${messageId}: ${status}`);

// Na transcrição
console.log(`[AUDIO] Transcription result: ${transcription?.substring(0, 50)}...`);
```

---

## Estrutura de Código Corrigida

```text
whatsapp-webhook/index.ts
├── sendPresence()        ← CORRIGIR endpoint e body
├── sendWhatsAppMessage() ← OK, já retorna message_id
├── transcribeAudio()     ← OK, funcionando com Gemini Pro
├── updateMessageStatus() ← OK, atualiza no banco
├── updateTypingStatus()  ← OK, atualiza no banco (para nossa UI)
└── serve() handler
    ├── messages.update   ← OK, parsing correto
    ├── presence.update   ← OK, parsing correto
    └── messages.upsert
        ├── sendPresence("composing") ← CORRIGIR
        ├── processWithAI()
        └── sendPresence("paused")    ← ADICIONAR
```

---

## Resultado Esperado

| Feature | Antes | Depois |
|---------|-------|--------|
| "Digitando" no WhatsApp | Não aparece | ✅ Aparece para o cliente |
| "Gravando" no WhatsApp | Não aparece | ✅ Aparece para o cliente |
| Status ✓✓ (nossa UI) | Funciona | ✅ Continua funcionando |
| Transcrição de áudio | Funciona | ✅ Continua funcionando |
| Logs de debug | Básicos | ✅ Detalhados |

---

## Ordem de Implementação

1. **Corrigir função `sendPresence()`** - Mudar endpoint e formato do body
2. **Adicionar interval para manter presence** - Durante processamento longo
3. **Adicionar `sendPresence("paused")`** - Após enviar resposta
4. **Melhorar logs** - Para facilitar debug futuro
5. **Deploy e teste** - Enviar mensagem e verificar "digitando"
