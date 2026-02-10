

# API Key propria do ElevenLabs por cliente

## Resumo

Permitir que cada cliente configure sua propria chave da ElevenLabs diretamente nas configuracoes do WhatsApp. Isso elimina a dependencia de uma chave compartilhada do servidor e cada cliente usa sua propria conta/creditos.

## Alteracoes

### 1. Banco de dados

Adicionar coluna `elevenlabs_api_key` (text, nullable) na tabela `whatsapp_settings` para armazenar a chave de cada unidade.

### 2. Frontend - WhatsAppSettings.tsx

Na secao "Respostas em Audio" (aba Bot), adicionar:
- Campo de input para a API key do ElevenLabs (tipo password, com botao mostrar/ocultar)
- Link externo para "Criar conta na ElevenLabs" e "Gerenciar API Keys"
- Texto explicativo informando que o cliente precisa ter uma conta com cartao de credito na ElevenLabs
- Salvar a chave junto com as demais configuracoes do bot

### 3. Edge Functions

Atualizar `elevenlabs-tts-preview` e `whatsapp-webhook` para:
- Receber a `elevenlabs_api_key` do banco de dados (da tabela `whatsapp_settings` da unidade)
- Usar a chave do cliente quando disponivel
- Fallback para a chave do servidor (`ELEVENLABS_API_KEY` do env) se o cliente nao configurou a propria

### 4. Hooks

Atualizar `useWhatsApp.ts` para incluir `elevenlabs_api_key` na interface `WhatsAppSettings`.

## Detalhes tecnicos

- A chave e armazenada em texto plano na tabela `whatsapp_settings` (protegida por RLS)
- O preview de voz passa a enviar a chave do cliente para a edge function, que a usa diretamente na chamada ao ElevenLabs
- O webhook busca a chave da unidade no banco antes de chamar o TTS
- A UI desabilita o seletor de voz e o botao de preview quando o modo de audio e "disabled"
- Input da API key com mascara de senha e toggle de visibilidade

