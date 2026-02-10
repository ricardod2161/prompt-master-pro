

# Corrigir bot dizendo que nao pode enviar audio

## Problema

O bot esta respondendo "sou um assistente de texto e nao consigo te enviar mensagens de voz" porque a IA (GPT/Gemini) nao sabe que o sistema tem capacidade de enviar audio. O system prompt nao informa isso.

Existem dois cenarios:
1. **Prompt personalizado**: Se o cliente configurou um `system_prompt` customizado, ele substitui completamente o prompt default, perdendo todas as instrucoes sobre audio
2. **Prompt default**: Mesmo no prompt default, falta dizer explicitamente que o bot TEM capacidade de responder em audio

## Solucao

### 1. Injetar instrucoes de audio automaticamente no system prompt

No webhook, adicionar um bloco de instrucoes sobre capacidade de audio que e SEMPRE injetado no prompt, independente de ser customizado ou default. Isso garante que a IA sempre saiba que pode responder em audio.

**Logica no webhook (whatsapp-webhook/index.ts):**

```text
// Antes de montar aiMessages, anexar ao systemPrompt:
const audioInstructions = `

IMPORTANTE - CAPACIDADE DE AUDIO:
- Voce TEM capacidade de responder em audio/voz quando apropriado
- O sistema converte automaticamente suas respostas em audio quando necessario
- NUNCA diga que "nao consegue enviar audio" ou "sou assistente de texto"
- Se o cliente pedir para falar em audio, responda normalmente que o sistema
  enviara a resposta em audio
- Quando for responder em audio, mantenha respostas mais curtas e
  conversacionais (como uma fala natural)
`;

const finalPrompt = systemPrompt + audioInstructions;
```

### 2. Atualizar o prompt default

Na funcao `getDefaultSystemPrompt()`, atualizar a secao "MENSAGENS DE AUDIO" (linhas 2069-2074) para incluir a informacao de que o bot pode responder com audio.

## Detalhes tecnicos

- A injecao de instrucoes de audio e feita APOS carregar o system prompt (seja default ou customizado)
- Isso garante que mesmo prompts personalizados sempre tenham a instrucao correta
- As instrucoes orientam a IA a manter respostas mais naturais/curtas quando for audio
- Nenhuma mudanca no banco de dados ou frontend necessaria

