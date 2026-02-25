## Diagnóstico Completo

### Problema 1: Transcrição falhando e gerando respostas duplicadas

O cliente enviou 3 áudios seguidos em sequência rápida. Como a transcrição falha (todos os 3 modelos retornam vazio para `ogg/opus`), o bot responde com a mesma mensagem para cada áudio individualmente — gerando 3 mensagens idênticas: "Recebi seu áudio! Para garantir que seu pedido seja registrado corretamente, poderia me escrever o que deseja? 🙏"

### Problema 2: Prompt de transcrição inadequado

O prompt da transcrição diz apenas "Transcreva este áudio de voz em português brasileiro. Retorne APENAS o texto transcrito". Não há contexto de que é um bot de restaurante recebendo pedidos com números como quantidades ("quero 20 reais de  porções de carne"). O modelo pode confundir "20 reais" com troco.

### Problema 3: Instrução do bot ao receber áudio não transcrito é vaga

A instrução diz "Poderia me escrever o que deseja?" — o bot usa isso como template literal e repete para cada áudio, sem perceber que o cliente enviou múltiplos áudios e já pediu o texto uma vez.

---

## Plano de Correção

### Correção 1 — Melhorar prompt de transcrição (linha 1333)

Adicionar contexto de restaurante ao prompt para que o modelo entenda que números são quantidades de itens:

```
"Transcreva este áudio de voz em português brasileiro. 
Contexto: É um cliente fazendo pedido em restaurante via WhatsApp. 
Preste atenção especial a: nomes de produtos, quantidades (ex: 20 reais, 30 reais, 50 rais, porções), 
formas de pagamento e endereços.
Retorne APENAS o texto transcrito, sem explicações ou formatação."
```

### Correção 2 — Deduplicação de respostas para múltiplos áudios (linhas 1944-1958)

Adicionar verificação de rate limiting por conversa: se já enviamos uma mensagem de "não entendi o áudio" nos últimos 30 segundos, NÃO enviar novamente — apenas salvar a mensagem no histórico sem responder.

```typescript
// Antes de processar áudio, verificar se já respondemos recentemente
if (mediaType === "audio" && transcription === "") {
  const recentResponse = await checkRecentAudioResponse(conversationId, 30);
  if (recentResponse) {
    // Já pedimos para escrever recentemente, não repetir
    return new Response(JSON.stringify({ status: "audio_deduplicated" }), ...);
  }
}
```

### Correção 3 — Melhorar instrução ao bot para áudio com falha (linha 2670-2671)

Atualizar a instrução para que o bot seja mais inteligente ao detectar múltiplos áudios:

```
- Se receber "[O cliente enviou um áudio que não pôde ser transcrito]":
  → Se for o PRIMEIRO áudio não transcrito na conversa atual: 
     "Recebi seu áudio! 🎤 Não consegui transcrever. Poderia me escrever seu pedido?"
  → Se já pediu antes e o cliente enviou MAIS áudios: 
     NÃO repita a mensagem. Aguarde o cliente digitar.
  → NUNCA envie a mesma mensagem mais de uma vez seguida
```

### Correção 4 — Instrução para entender pedidos numéricos em áudio (linha 2669)

Adicionar instrução explícita para que quando o áudio for transcrito com números, o bot entenda o contexto:

```
- Se receber "[Áudio transcrito]: quero 20 reais de porções de carne" → é um PEDIDO
- Números em áudio são SEMPRE quantidades de produtos, NUNCA troco
- Troco só é informado DEPOIS que o bot perguntou explicitamente sobre troco
- Exemplos de pedidos em áudio: "quero 2 X-bacon", "me manda 3 sucos", e  "20 reais de porções de frango"
```

### Correção 5 — Adicionar log de diagnóstico para falhas de transcrição

Adicionar log `[AUDIO-TRANSCRIPTION-FAIL]` para monitorar quantas vezes a transcrição falha por unidade:

```typescript
console.log(`[AUDIO-TRANSCRIPTION-FAIL] unit_id=${settings.unit_id} | phone=${phone} | mimetype=${media.mimetype} | size=${media.base64.length}`);
```

---

## Arquivos Modificados


| Arquivo                                        | Seção                                   | Mudança                                                                 |
| ---------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `supabase/functions/whatsapp-webhook/index.ts` | `transcribeAudio()` linha ~1333         | Prompt com contexto de restaurante e quantidades                        |
| `supabase/functions/whatsapp-webhook/index.ts` | processamento de áudio linha ~1944-1958 | Deduplicação: verificar se já pediu texto recentemente para não repetir |
| `supabase/functions/whatsapp-webhook/index.ts` | instrução do bot linha ~2669-2673       | Regras mais claras: não repetir pedido de texto, números = quantidades  |
| `supabase/functions/whatsapp-webhook/index.ts` | log diagnóstico                         | Adicionar `[AUDIO-TRANSCRIPTION-FAIL]`                                  |
