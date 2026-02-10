

# Preview de Voz nas Configuracoes do WhatsApp

## Verificacao do estado atual

A secao "Respostas em Audio" ja esta implementada corretamente na aba Bot das configuracoes do WhatsApp (linhas 630-681 do WhatsAppSettings.tsx), com selects para modo de audio e voz do bot. O webhook tambem esta funcional com as funcoes `shouldSendAsAudio`, `textToSpeech` e `sendWhatsAppAudio`.

## O que sera adicionado

Um botao de preview ao lado do select de voz que permite ao dono ouvir uma amostra da voz selecionada antes de salvar.

## Implementacao

### 1. Criar Edge Function `elevenlabs-tts-preview`

Nova funcao simples que recebe um `voiceId` e gera um audio curto de demonstracao:

- Texto fixo de preview: "Ola! Eu sou a voz do seu assistente virtual. Como posso ajudar?"
- Usa `ELEVENLABS_API_KEY` (ja configurada)
- Retorna o audio como binary (audio/mpeg)
- Modelo: `eleven_turbo_v2_5` para resposta rapida

### 2. Adicionar botao de preview no WhatsAppSettings.tsx

- Botao com icone de play ao lado do select de voz
- Ao clicar, faz fetch para a edge function com o `voiceId` selecionado
- Reproduz o audio no navegador usando `new Audio()`
- Loading state enquanto o audio carrega
- Desabilita o botao durante a reproducao

### 3. Fluxo

```text
Dono seleciona voz no select
    -> Clica no botao de preview (icone play)
    -> Loading spinner no botao
    -> Edge function gera audio via ElevenLabs
    -> Audio reproduzido no navegador
    -> Botao volta ao estado normal
```

## Detalhes tecnicos

- Edge function retorna binary audio (nao base64) para uso direto com `response.blob()`
- Audio reproduzido via `URL.createObjectURL(blob)` + `new Audio(url)`
- Estado de loading e playing controlados por useState
- Texto de preview curto (~10 palavras) para economia de creditos ElevenLabs
- Tratamento de erro com toast se o preview falhar

