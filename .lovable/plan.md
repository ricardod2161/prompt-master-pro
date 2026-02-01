
# Plano: Melhorias Avancadas do WhatsApp - Status de Entrega, Digitando, Audio e Imagens

## Resumo das Melhorias

Este plano implementa um sistema de WhatsApp profissional e completo com:
- Status de entrega de mensagens (dois risquinhos azuis)
- Indicadores de "digitando" e "gravando"
- Processamento de mensagens de audio (transcricao via IA)
- Processamento de imagens (analise visual via IA multimodal)
- Interface de chat elegante estilo WhatsApp
- Melhorias gerais de organizacao e responsividade

---

## 1. Atualizacoes no Banco de Dados

### 1.1 Novos campos na tabela whatsapp_messages

```text
whatsapp_messages (atualizada):
├── id, conversation_id, role, content, created_at (existentes)
├── message_id (TEXT) - ID da mensagem no WhatsApp
├── status (ENUM) - sent, delivered, read
├── media_type (TEXT) - text, audio, image, document
├── media_url (TEXT) - URL do arquivo de midia
├── media_duration (INTEGER) - duracao em segundos (audio)
├── media_caption (TEXT) - legenda da imagem
└── transcription (TEXT) - transcricao do audio
```

### 1.2 Nova tabela para status de digitacao

```text
whatsapp_typing_status:
├── id (UUID)
├── conversation_id (FK)
├── is_typing (BOOLEAN)
├── is_recording (BOOLEAN)
├── updated_at (TIMESTAMP)
└── expires_at (TIMESTAMP)
```

---

## 2. Novos Eventos do Webhook Evolution API

### 2.1 Eventos a processar

```text
Eventos atuais:
└── messages.upsert (mensagem recebida)

Novos eventos a adicionar:
├── messages.update (status de entrega)
│   ├── status: "delivered" (✓✓)
│   └── status: "read" (✓✓ azul)
├── messages.typing (digitando)
│   └── presence: "composing" ou "recording"
└── messages.media (audio/imagem)
    ├── audioMessage
    ├── imageMessage
    └── documentMessage
```

---

## 3. Componentes de UI a Criar

### 3.1 ChatBubble - Bolha de mensagem estilo WhatsApp

```text
ChatBubble
├── Visual diferente para sent/received
├── Timestamp formatado
├── Status indicators:
│   ├── ✓ (enviado/sent)
│   ├── ✓✓ (entregue/delivered)
│   └── ✓✓ (azul/read)
├── Media preview:
│   ├── Image thumbnail com lightbox
│   ├── Audio player com waveform
│   └── Document icon com download
└── Transcricao de audio (expandable)
```

### 3.2 ChatInput - Campo de entrada avancado

```text
ChatInput
├── Input de texto expandivel
├── Botao de gravar audio
├── Botao de anexar imagem
├── Botao de emoji (opcional)
└── Send button com loading state
```

### 3.3 ChatHeader - Cabecalho da conversa

```text
ChatHeader
├── Avatar do cliente
├── Nome do cliente
├── Status (online/offline/digitando/gravando)
├── Telefone
└── Botao toggle bot on/off
```

### 3.4 ChatView - Container principal

```text
ChatView (nova pagina ou modal)
├── ChatHeader
├── ScrollArea com mensagens
│   └── Agrupa mensagens por data
├── TypingIndicator (quando cliente digitando)
├── ChatInput
└── Responsive: sidebar + chat em desktop, fullscreen em mobile
```

---

## 4. Atualizacoes no Webhook

### 4.1 Suporte a Mensagens de Audio

```text
Fluxo de audio:
1. Recebe audioMessage do webhook
2. Baixa arquivo de audio da Evolution API
3. Converte para base64
4. Envia para Gemini multimodal (transcricao)
5. Salva transcricao no banco
6. Processa transcricao como texto normal para IA
```

### 4.2 Suporte a Mensagens de Imagem

```text
Fluxo de imagem:
1. Recebe imageMessage do webhook
2. Baixa imagem da Evolution API
3. Converte para base64
4. Envia para Gemini multimodal (analise)
5. Extrai contexto/descricao
6. Processa com IA (ex: "Vi sua imagem, parece um comprovante de pagamento...")
```

### 4.3 Atualizacao de Status de Entrega

```text
Evento messages.update:
1. Recebe status (delivered/read)
2. Atualiza campo status na whatsapp_messages
3. Emite evento realtime para UI
```

### 4.4 Envio de Indicador "Digitando"

```text
Antes de processar IA:
1. Envia presence "composing" para cliente
2. Processa mensagem com IA
3. Envia resposta
```

---

## 5. Atualizacao do Sistema Prompt da IA

### 5.1 Instrucoes para Imagens

```text
Nova instrucao:
"Quando receber uma imagem:
- Se for comprovante de pagamento Pix, confirme o recebimento
- Se for foto de endereco/mapa, confirme a localizacao
- Se for cardapio de outro local, explique que temos nosso proprio
- Descreva brevemente o que viu e continue o atendimento"
```

### 5.2 Instrucoes para Audio

```text
Nova instrucao:
"Quando receber audio transcrito:
- Trate como mensagem de texto normal
- Se a transcricao estiver confusa, peca gentilmente para repetir
- Continue o fluxo do pedido normalmente"
```

---

## 6. Nova Pagina: Chat do WhatsApp

### 6.1 Layout Desktop

```text
┌─────────────────────────────────────────────────────────────────┐
│ WhatsApp Business           [Status: Conectado]                 │
├─────────────────┬───────────────────────────────────────────────┤
│ CONVERSAS       │ CHAT                                          │
│                 │                                               │
│ ┌─────────────┐ │ ┌─────────────────────────────────────────┐  │
│ │ 👤 Maria    │ │ │ João Silva        digitando...         │  │
│ │ Oi, quero..│ │ ├─────────────────────────────────────────┤  │
│ │ 10:30 ✓✓   │ │ │                                         │  │
│ └─────────────┘ │ │   ┌──────────────────┐                  │  │
│ ┌─────────────┐ │ │   │ Oi! Quero pedir  │ ← cliente        │  │
│ │ 👤 João    ●│ │ │   │ delivery         │                  │  │
│ │ Quero ped..│ │ │   │         10:30    │                  │  │
│ │ 10:28 ✓✓   │ │ │   └──────────────────┘                  │  │
│ └─────────────┘ │ │                                         │  │
│                 │ │ ┌──────────────────┐                    │  │
│                 │ │ │ Claro! 😊        │ ← bot              │  │
│                 │ │ │ Vou mostrar o    │                    │  │
│                 │ │ │ cardápio...      │                    │  │
│                 │ │ │      10:30 ✓✓ 🤖│                    │  │
│                 │ │ └──────────────────┘                    │  │
│                 │ │                                         │  │
│                 │ │   ┌──────────────────────┐              │  │
│                 │ │   │ 🎵 Audio (0:15)      │              │  │
│                 │ │   │ [▶ ▁▂▃▄▅▆▇▆▅▄▃▂▁]   │              │  │
│                 │ │   │ "Quero um x-bacon"   │ transcricao  │  │
│                 │ │   └──────────────────────┘              │  │
│                 │ │                                         │  │
│                 │ │   ┌──────────────────────┐              │  │
│                 │ │   │ 🖼️ [Imagem]          │              │  │
│                 │ │   │ Comprovante Pix     │              │  │
│                 │ │   └──────────────────────┘              │  │
│                 │ │                                         │  │
│                 │ ├─────────────────────────────────────────┤  │
│                 │ │ [📎] [Digite...                    ] [➤]│  │
│                 │ └─────────────────────────────────────────┘  │
└─────────────────┴───────────────────────────────────────────────┘
```

### 6.2 Layout Mobile

```text
┌───────────────────────┐
│ ← João Silva      🤖 │  ← header com toggle bot
│    digitando...       │
├───────────────────────┤
│                       │
│   ┌─────────────────┐ │
│   │ Oi! Quero pedir │ │
│   │ delivery  10:30 │ │
│   └─────────────────┘ │
│                       │
│ ┌─────────────────┐   │
│ │ Claro! Posso    │   │
│ │ ajudar 😊       │   │
│ │ 10:30 ✓✓ 🤖    │   │
│ └─────────────────┘   │
│                       │
├───────────────────────┤
│ [📎] [Mensagem...] [➤]│
└───────────────────────┘
```

---

## 7. Status de Entrega - Visual

### 7.1 Icones de Status

```text
Mensagens ENVIADAS (pelo bot):
├── ✓ cinza    = enviado
├── ✓✓ cinza   = entregue
└── ✓✓ azul    = lido

Mensagens RECEBIDAS (do cliente):
└── Sem icone de status (apenas timestamp)
```

### 7.2 CSS para Status

```css
.message-status {
  display: inline-flex;
  margin-left: 4px;
}

.status-sent { color: gray; }
.status-delivered { color: gray; }
.status-read { color: #53bdeb; } /* WhatsApp blue */
```

---

## 8. Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/WhatsAppChat.tsx` | Criar | Nova pagina de chat |
| `src/components/whatsapp/ChatView.tsx` | Criar | Container principal |
| `src/components/whatsapp/ChatBubble.tsx` | Criar | Bolha de mensagem |
| `src/components/whatsapp/ChatInput.tsx` | Criar | Input de mensagem |
| `src/components/whatsapp/ChatHeader.tsx` | Criar | Header da conversa |
| `src/components/whatsapp/ConversationList.tsx` | Criar | Lista lateral |
| `src/components/whatsapp/TypingIndicator.tsx` | Criar | Animacao digitando |
| `src/components/whatsapp/AudioPlayer.tsx` | Criar | Player de audio |
| `src/components/whatsapp/MessageStatus.tsx` | Criar | Icones de status |
| `src/hooks/useWhatsAppChat.ts` | Criar | Hook para chat |
| `supabase/functions/whatsapp-webhook/index.ts` | Modificar | Suporte audio/imagem/status |
| `src/pages/WhatsAppSettings.tsx` | Modificar | Link para nova pagina |
| `src/App.tsx` | Modificar | Nova rota |
| Migration SQL | Criar | Novos campos e tabela |

---

## 9. Migracao SQL

```sql
-- Adicionar campos a whatsapp_messages
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS message_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_duration INTEGER,
ADD COLUMN IF NOT EXISTS media_caption TEXT,
ADD COLUMN IF NOT EXISTS transcription TEXT;

-- Criar tabela de typing status
CREATE TABLE IF NOT EXISTS whatsapp_typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT FALSE,
  is_recording BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 seconds'),
  UNIQUE(conversation_id)
);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_typing_status;
```

---

## 10. Logica do Webhook Atualizada

### 10.1 Processamento de Eventos

```text
switch (payload.event):
├── "messages.upsert":
│   ├── Verifica tipo de mensagem
│   ├── Se text → processa normalmente
│   ├── Se audio → baixa, transcreve, processa
│   └── Se image → baixa, analisa, processa
│
├── "messages.update":
│   └── Atualiza status da mensagem (delivered/read)
│
├── "presence.update":
│   ├── Se "composing" → salva is_typing=true
│   ├── Se "recording" → salva is_recording=true
│   └── Se "paused" → reseta ambos
│
└── "send.message":
    └── Armazena message_id para rastreio
```

### 10.2 Transcricao de Audio

```typescript
// Usar Gemini multimodal para transcrever
const transcription = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "Transcreva este audio em portugues:" },
        { type: "audio_url", audio_url: { url: `data:audio/ogg;base64,${audioBase64}` }}
      ]
    }]
  })
});
```

### 10.3 Analise de Imagem

```typescript
// Usar Gemini multimodal para analisar imagem
const analysis = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [{
      role: "user", 
      content: [
        { type: "text", text: "Descreva brevemente esta imagem em 1-2 frases:" },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` }}
      ]
    }]
  })
});
```

---

## 11. Indicador "Digitando" para Cliente

### 11.1 Enviar Presence antes de processar

```typescript
// Antes de chamar a IA
await fetch(`${apiUrl}/chat/presence/${instanceName}`, {
  method: "POST",
  headers: { apikey: apiToken },
  body: JSON.stringify({
    number: phone,
    presence: "composing" // ou "recording" se for responder audio
  })
});

// Processa com IA...

// Envia resposta
await sendWhatsAppMessage(...);
```

---

## 12. Componentes Adicionais

### 12.1 TypingIndicator

```text
Animacao de 3 pontinhos:
┌─────────────────────┐
│ ●  ●  ●             │  ← pulsa sequencialmente
│ digitando...        │
└─────────────────────┘
```

### 12.2 AudioPlayer

```text
┌──────────────────────────────┐
│ [▶] [▁▂▃▅▇▅▃▂▁▂▃▅▇] 0:15    │
│ "Quero um x-bacon"           │  ← transcricao
└──────────────────────────────┘
```

### 12.3 ImagePreview

```text
┌──────────────────────────────┐
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │     [Thumbnail]          │ │  ← clique abre lightbox
│ │                          │ │
│ └──────────────────────────┘ │
│ Comprovante de pagamento Pix │  ← caption/descricao
└──────────────────────────────┘
```

---

## 13. Ordem de Implementacao

1. **Migracoes SQL** - Adicionar novos campos e tabelas
2. **Componentes base** - MessageStatus, TypingIndicator
3. **ChatBubble** - Com suporte a todos os tipos de midia
4. **AudioPlayer** - Player de audio com waveform
5. **ChatView + ChatHeader + ChatInput** - Interface completa
6. **ConversationList** - Lista lateral de conversas
7. **WhatsAppChat page** - Pagina principal
8. **Webhook updates** - Audio, imagem, status
9. **Realtime subscriptions** - Atualizacoes em tempo real
10. **Testes e ajustes** - Responsividade, edge cases

---

## 14. Resultado Esperado

| Feature | Descricao |
|---------|-----------|
| Status ✓✓ | Mostra quando mensagem foi entregue/lida |
| Digitando | Cliente ve "digitando..." enquanto bot processa |
| Audio | Cliente envia audio, bot transcreve e responde |
| Imagem | Cliente envia foto, bot analisa e responde |
| Chat UI | Interface moderna estilo WhatsApp |
| Realtime | Mensagens aparecem instantaneamente |
| Mobile | Layout responsivo e touch-friendly |
| Profissional | UX elegante e inteligente |
