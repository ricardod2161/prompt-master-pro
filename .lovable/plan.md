
## Análise do Bug

### Problema Raiz (3 causas)

**Causa 1 — Estratégia de transcrição incorreta:**
- A estratégia principal envia o áudio como `type: "image_url"` (errado para áudio no Gemini)
- As estratégias 2 e 3 usam `format: "mp3"` mas o WhatsApp envia OGG/Opus — o formato errado faz a API rejeitar
- Resultado: todas as 3 estratégias falham silenciosamente

**Causa 2 — Fallback de áudio não transcrito mal implementado:**
- Quando `transcription = null`, o `messageText` vira `"[O cliente enviou um áudio que não pôde ser transcrito]"`
- Esse texto é enviado para a IA processar normalmente
- A IA com esse contexto está falhando (provavelmente timeout ou erro de API) e caindo no `catch` que retorna a mensagem genérica de erro técnico
- O cliente recebe: *"Desculpe, tive um problema ao processar sua mensagem..."* — mensagem técnica e fria

**Causa 3 — Resposta de fallback não é tratada diretamente:**
- Quando a transcrição falha, o sistema deveria responder DIRETAMENTE com uma mensagem amigável pedindo para o cliente digitar, sem passar pela IA

---

### Solução

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

**Fix 1 — `transcribeAudio`:** Corrigir as 3 estratégias:
- Estratégia 1: usar `type: "input_audio"` com `format: "ogg"` (suportado pelo Gemini 2.5 Pro para áudio nativo)
- Estratégia 2: usar `format: "ogg"` (não "mp3") pois o WhatsApp sempre envia OGG/Opus
- Adicionar Estratégia 4: Gemini via `inline_data` (formato nativo da API Gemini, mais compatível com ogg/opus)

**Fix 2 — Fallback direto sem IA:** Quando a transcrição falhar completamente (`transcription = null`), responder DIRETAMENTE ao cliente com mensagem amigável (sem passar pela IA), e retornar do webhook sem processar com AI:

```typescript
// Na linha ~2060, após messageText = "[O cliente enviou um áudio...]"
// Responder diretamente e encerrar — não processar com IA
const fallbackMsg = "Recebi seu áudio! 🎤 Infelizmente não consegui transcrever desta vez. Poderia digitar seu pedido? Estou aqui para ajudar! 😊";
// enviar mensagem + salvar no banco + return
```

**Fix 3 — Melhorar o prompt do sistema para áudio não transcrito:** Reforçar na instrução que quando o áudio não for transcrito, a IA deve responder de forma breve e amigável (já existe na linha 2938, mas o problema é que a IA falha antes disso).

---

### Arquivos modificados
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-webhook/index.ts` | Fix nas 3 estratégias de transcrição + fallback direto sem IA |
