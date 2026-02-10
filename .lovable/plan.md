
# Responder em Audio no WhatsApp via ElevenLabs TTS

## O que sera feito

O bot do WhatsApp passara a responder com mensagens de audio em vez de texto. O texto gerado pela IA sera convertido em audio usando ElevenLabs TTS e enviado como audio no WhatsApp via Evolution API.

## Alteracoes

### 1. Criar funcao `sendWhatsAppAudio` no webhook

Nova funcao no `supabase/functions/whatsapp-webhook/index.ts` que envia audio via Evolution API:

```text
POST {apiUrl}/message/sendWhatsAppAudio/{instanceName}
Body: { number: phone, audio: "data:audio/mpeg;base64,{audioBase64}" }
```

### 2. Criar funcao `textToSpeech` no webhook

Nova funcao que converte texto em audio usando a API do ElevenLabs:

- Endpoint: `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}`
- Usa a secret `ELEVENLABS_API_KEY` (ja configurada)
- Voz: Laura (FGY2WhTYpPnrIDTdsKH5) - voz feminina em portugues, natural e profissional
- Modelo: `eleven_turbo_v2_5` (baixa latencia, ideal para chat)
- Retorna audio base64

### 3. Modificar o fluxo de resposta do bot

No trecho onde o bot envia a resposta da IA (linha ~1906), apos gerar o texto:

1. Converter o texto em audio via ElevenLabs TTS
2. Enviar o audio via `sendWhatsAppAudio` em vez de `sendWhatsAppMessage`
3. Salvar a mensagem no banco com `media_type: "audio"` para exibir corretamente no chat do sistema
4. Manter fallback para texto caso o TTS falhe (problema de rede, limite de API, etc.)

### 4. Excecoes (continua como texto)

Mensagens que contem formatacao complexa (cardapio, resumo de pedido com tabelas) serao enviadas como texto, pois audio nao transmite bem listas formatadas. Criterio: se a mensagem contem mais de 3 emojis de formatacao ou e o cardapio, envia como texto.

## Fluxo

```text
Cliente envia mensagem
    -> IA gera resposta em texto
    -> Se resposta simples (conversacional):
        -> ElevenLabs converte texto em audio MP3
        -> Evolution API envia audio no WhatsApp
        -> Salva no banco como media_type: "audio"
    -> Se resposta complexa (cardapio, resumo):
        -> Envia como texto normalmente (comportamento atual)
    -> Se TTS falhar:
        -> Fallback: envia como texto
```

## Detalhes tecnicos

- Voz ElevenLabs: Laura (FGY2WhTYpPnrIDTdsKH5) - portugues brasileiro natural
- Modelo: `eleven_turbo_v2_5` para latencia minima
- Audio enviado como base64 no formato `data:audio/mpeg;base64,...`
- A mensagem no sistema exibira o player de audio existente (AudioPlayer.tsx)
- Secret `ELEVENLABS_API_KEY` ja esta configurada no projeto
