

## Plano: Enviar audio apenas quando o cliente pedir explicitamente

### Problema atual
No modo `auto`, a funcao `shouldSendAsAudio` envia resposta em audio sempre que o cliente envia uma mensagem de audio. O usuario quer que o bot so responda em audio quando o cliente **pedir explicitamente** por voz/audio no texto da mensagem.

### Mudanca proposta

Modificar a funcao `shouldSendAsAudio` no arquivo `supabase/functions/whatsapp-webhook/index.ts` para:

1. **Remover** a logica que envia audio automaticamente quando o cliente envia audio (`lastUserMessageWasAudio`)
2. **Adicionar** um novo parametro `userMessageText` que sera analisado para detectar pedidos explicitos de audio
3. Detectar frases como:
   - "manda em audio", "envia em audio", "fala em audio"
   - "manda por voz", "envia por voz", "responde em voz"
   - "quero ouvir", "manda audio", "envia audio"
   - "pode falar", "fala pra mim"
   - E variacoes similares

### Detalhes tecnicos

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

**1. Atualizar a funcao `shouldSendAsAudio` (linhas ~2470-2491):**
- Adicionar parametro `userMessageText: string`
- No modo `auto`: verificar se o texto do usuario contem pedido explicito de audio em vez de checar se a ultima mensagem foi audio
- Modo `always` continua funcionando como antes
- Modo `disabled` continua desativado

**2. Atualizar a chamada da funcao (linha ~2102):**
- Passar o conteudo da mensagem do usuario (variavel `userText` ou `transcribedContent`) como novo parametro

**Palavras-chave detectadas (case-insensitive, sem acento):**
```
"manda em audio", "envia em audio", "responde em audio",
"manda por voz", "envia por voz", "responde por voz",
"manda audio", "envia audio", "quero audio",
"quero ouvir", "fala pra mim", "pode falar",
"manda um audio", "envia um audio",
"por audio", "em audio", "por voz", "em voz"
```

### Resultado esperado
- Cliente envia texto normal -> bot responde com texto
- Cliente envia audio -> bot responde com **texto** (transcreve o audio e responde por texto)
- Cliente escreve "me manda em audio" -> bot responde com audio
- Modo `always` nas configuracoes -> sempre envia audio (sem mudanca)
- Modo `disabled` nas configuracoes -> nunca envia audio (sem mudanca)

