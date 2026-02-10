
# Configuracao de Audio no WhatsApp - Voz e Modo de Resposta

## O que sera feito

Tres mudancas principais:

1. **Novo campo de configuracao**: O dono escolhe se quer respostas em audio, texto, ou apenas quando o cliente enviar audio
2. **Escolha da voz**: O dono pode selecionar entre vozes masculinas e femininas do ElevenLabs
3. **Logica condicional**: O bot so responde em audio quando o cliente envia audio (modo padrao)

## Alteracoes no Banco de Dados

Adicionar 2 novas colunas na tabela `whatsapp_settings`:

- `tts_mode` (text, default `'auto'`): Modo de resposta de audio
  - `'auto'` - Responde em audio apenas quando o cliente envia audio
  - `'always'` - Sempre responde em audio (mensagens simples)
  - `'disabled'` - Nunca responde em audio, sempre texto
- `tts_voice_id` (text, default `'FGY2WhTYpPnrIDTdsKH5'`): ID da voz do ElevenLabs selecionada

## Alteracoes no Frontend (WhatsAppSettings.tsx)

Na aba "Bot", adicionar uma nova secao "Respostas em Audio" com:

- **Modo de audio**: Select com 3 opcoes (Auto / Sempre / Desativado)
- **Voz do bot**: Select com opcoes de vozes pre-definidas:
  - Laura (feminina, PT-BR) - padrao
  - Sarah (feminina, versatil)
  - Alice (feminina, confiante)
  - Liam (masculina, articulada)
  - Daniel (masculina, profunda)
  - Charlie (masculina, casual)

## Alteracoes no Webhook (whatsapp-webhook/index.ts)

1. **Ler configuracoes**: Buscar `tts_mode` e `tts_voice_id` junto com as outras settings
2. **Modificar `shouldSendAsAudio`**: Agora recebe `tts_mode` e `lastUserMessageWasAudio` como parametros:
   - Se `tts_mode = 'disabled'`: retorna `false` sempre
   - Se `tts_mode = 'always'`: usa a logica atual (verifica complexidade)
   - Se `tts_mode = 'auto'`: so retorna `true` se o ultimo envio do cliente foi audio
3. **Usar `tts_voice_id`**: Na funcao `textToSpeech`, usar o voice ID das configuracoes em vez do hardcoded
4. **Detectar audio do cliente**: Verificar se a mensagem recebida era audio para passar ao `shouldSendAsAudio`

## Alteracoes no Hook (useWhatsApp.ts)

Atualizar a interface `WhatsAppSettings` para incluir os novos campos `tts_mode` e `tts_voice_id`.

## Fluxo Atualizado

```text
Cliente envia mensagem
    -> Webhook busca settings (inclui tts_mode e tts_voice_id)
    -> IA gera resposta em texto
    -> Verifica tts_mode:
       -> 'disabled': envia texto
       -> 'always': se mensagem simples, converte com voz escolhida e envia audio
       -> 'auto': se cliente enviou AUDIO, converte e envia audio; senao, texto
    -> Fallback: se TTS falhar, envia texto
```

## Detalhes Tecnicos

- Vozes disponiveis sao um subconjunto curado do ElevenLabs com qualidade garantida em portugues
- O campo `tts_mode` com default `'auto'` garante que o comportamento padrao e "responde audio so se o cliente pediu em audio"
- A migracao nao quebra nada existente pois os defaults cobrem o comportamento esperado
