
# Plano: Correção do WhatsApp - Status de Entrega, Áudio e Melhorias

## Problemas Identificados

### 1. Status de Entrega (✓✓) não funciona
O webhook está falhando com erro `Cannot read properties of undefined (reading 'id')` porque:
- **Esperado:** `payload.data.key.id` e `payload.data.status` (número)
- **Recebido:** `payload.data.messageId` e `payload.data.status` ("DELIVERY_ACK"/"READ")

### 2. Transcrição de Áudio falha
O bot responde "não consigo processar esse tipo de conteúdo" porque:
- O formato `input_audio` não é suportado pela Lovable AI Gateway
- A transcrição falha silenciosamente e retorna string vazia

### 3. Presença (digitando/gravando) não atualiza
O evento `presence.update` também usa formato de payload incorreto

---

## Correções a Implementar

### 1. Corrigir Parsing do `messages.update`

```text
ANTES (incorreto):
const messageId = payload.data.key.id;
const status = payload.data.status;
if (status === 2) → "delivered"
if (status === 3) → "read"

DEPOIS (correto):
const messageId = payload.data.messageId || payload.data.keyId || payload.data.key?.id;
const statusRaw = payload.data.status;
if (statusRaw === "DELIVERY_ACK" || statusRaw === 2) → "delivered"
if (statusRaw === "READ" || statusRaw === 3) → "read"
```

### 2. Corrigir Transcrição de Áudio com OpenAI GPT-5

A Lovable AI Gateway suporta modelos OpenAI. Usaremos GPT-5 com input multimodal para processar áudios:

```text
Novo fluxo de transcrição:
1. Baixar áudio da Evolution API (base64)
2. Enviar para GPT-5 como conteúdo multimodal
3. Modelo processa e transcreve
4. Retornar texto transcrito
```

### 3. Corrigir Análise de Imagem

Manter Gemini 2.5 Flash para imagens (já funciona), mas garantir fallback.

### 4. Corrigir Parsing do `presence.update`

```text
ANTES (incorreto):
const phone = payload.data.key.remoteJid.replace("@s.whatsapp.net", "");

DEPOIS (correto):
const remoteJid = payload.data.remoteJid || payload.data.key?.remoteJid;
const phone = remoteJid?.replace("@s.whatsapp.net", "").replace("@lid", "");
```

---

## Arquivo a Modificar

### `supabase/functions/whatsapp-webhook/index.ts`

**Seção 1: Corrigir `messages.update` (linhas ~990-1005)**

```typescript
// Handle message status updates (delivered/read)
if (payload.event === "messages.update") {
  // Suporte a múltiplos formatos da Evolution API
  const messageId = payload.data.messageId || 
                    payload.data.keyId || 
                    payload.data.key?.id;
  const statusRaw = payload.data.status;
  
  if (!messageId) {
    console.log("No message ID found in status update");
    return new Response(JSON.stringify({ status: "no_message_id" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  // Mapear status (suporta strings e números)
  let status: "delivered" | "read" | null = null;
  if (statusRaw === "DELIVERY_ACK" || statusRaw === 2 || statusRaw === "delivered") {
    status = "delivered";
  } else if (statusRaw === "READ" || statusRaw === 3 || statusRaw === "read") {
    status = "read";
  }
  
  if (status) {
    await updateMessageStatus(supabase, messageId, status);
    console.log(`Message ${messageId} status updated to: ${status}`);
  }
  
  return new Response(JSON.stringify({ status: "status_updated" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

**Seção 2: Corrigir `presence.update` (linhas ~1007-1041)**

```typescript
// Handle presence updates (typing/recording)
if (payload.event === "presence.update") {
  const remoteJid = payload.data.remoteJid || payload.data.key?.remoteJid;
  if (!remoteJid) {
    return new Response(JSON.stringify({ status: "no_remote_jid" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
  const presence = payload.data.presence || payload.data.action;
  // ...resto
}
```

**Seção 3: Corrigir Transcrição de Áudio (linhas ~675-727)**

```typescript
// Transcribe audio using OpenAI GPT-5 multimodal
async function transcribeAudio(audioBase64: string, mimetype: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    return "";
  }

  try {
    console.log("Transcribing audio with GPT-5...");
    
    // Usar GPT-5 com capacidades multimodais para transcrição
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5",
          messages: [
            {
              role: "system",
              content: "Você é um transcritor de áudio. Transcreva o áudio fornecido em português brasileiro. Retorne APENAS o texto transcrito, sem explicações."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Transcreva este áudio:"
                },
                {
                  type: "input_audio",
                  input_audio: {
                    data: audioBase64,
                    format: mimetype.includes("ogg") ? "ogg" : 
                            mimetype.includes("mp4") ? "mp4" :
                            mimetype.includes("mp3") ? "mp3" : "wav"
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Transcription error:", response.status, errorText);
      
      // Fallback: tentar com Gemini multimodal
      return await transcribeWithGemini(audioBase64, mimetype);
    }

    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content || "";
    console.log("Transcription result:", transcription.substring(0, 100));
    return transcription;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return await transcribeWithGemini(audioBase64, mimetype);
  }
}

// Fallback: transcrição com Gemini
async function transcribeWithGemini(audioBase64: string, mimetype: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return "";

  try {
    console.log("Fallback: Transcribing with Gemini...");
    
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: `[Áudio recebido - duração aproximada]. Por favor, informe ao cliente que você recebeu o áudio mas não conseguiu transcrever automaticamente. Peça gentilmente que ele repita por texto.`
            }
          ],
          max_tokens: 200,
        }),
      }
    );

    if (!response.ok) return "";
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Gemini fallback error:", error);
    return "";
  }
}
```

---

## Melhorias Adicionais

### 1. Logs Mais Detalhados

Adicionar logs em pontos críticos para debug:
- Payload recebido (já existe)
- Tipo de mídia detectado
- Resultado da transcrição
- Status de envio

### 2. Tratamento de Erros Robusto

```typescript
// Wrapper para operações críticas
async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    return fallback;
  }
}
```

### 3. Melhorar Resposta para Áudio Não Transcrito

Atualizar o system prompt para lidar melhor:

```text
🎤 MENSAGENS DE ÁUDIO:
- Se receber "[Áudio transcrito]: texto", trate o texto normalmente
- Se receber "[O cliente enviou um áudio que não pôde ser transcrito]":
  → Responda: "Recebi seu áudio! 🎤 Infelizmente não consegui entender completamente. Poderia repetir por texto, por favor?"
- NUNCA diga que não consegue processar áudio
```

---

## Melhorias na Interface (ChatView)

### 1. Indicador de Status Visual

Garantir que o componente `MessageStatus` mostre corretamente:
- ✓ cinza = enviado (sent)
- ✓✓ cinza = entregue (delivered)  
- ✓✓ azul = lido (read)

### 2. Player de Áudio Melhorado

- Waveform animado durante reprodução
- Mostrar transcrição quando disponível
- Indicador de duração

---

## Ordem de Implementação

1. **Corrigir webhook** - Parsing de `messages.update` e `presence.update`
2. **Corrigir transcrição** - Nova função com GPT-5 e fallback
3. **Atualizar system prompt** - Melhor tratamento de áudio
4. **Deploy e teste** - Verificar logs em produção

---

## Resultado Esperado

| Feature | Antes | Depois |
|---------|-------|--------|
| Status ✓✓ | Erro no webhook | Funciona corretamente |
| Digitando | Erro no webhook | Mostra indicador |
| Áudio | "Não consigo processar" | Transcreve ou pede texto |
| Imagem | Funciona | Continua funcionando |
| Logs | Básicos | Detalhados para debug |
