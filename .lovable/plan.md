

# Corrigir pronúncia do TTS (dólares -> reais) e tornar áudio mais natural

## Problema

O bot está falando "dólares" ao invés de "reais" nos áudios, e a fala soa robótica. Duas causas identificadas:

1. **Modelo errado**: O TTS usa `eleven_turbo_v2_5` que é otimizado para inglês. Ele interpreta "R$" como símbolo de dólar e pronuncia incorretamente.
2. **Texto não preparado para fala**: O texto enviado ao TTS contém emojis, markdown (`*negrito*`), símbolos (`R$`), e formatação de números (`34,90`) que o sintetizador não interpreta bem em português.

## Solução (2 partes)

### 1. Trocar o modelo TTS para multilingual

Trocar de `eleven_turbo_v2_5` (inglês) para `eleven_multilingual_v2` que tem suporte nativo ao português brasileiro e entende convenções de moeda locais.

### 2. Pré-processar o texto antes de enviar ao TTS

Criar uma função `prepareTextForSpeech()` que converte o texto em formato otimizado para fala natural:

- `R$ 34,90` vira `34 reais e 90 centavos`
- `R$ 50,00` vira `50 reais`
- Remove emojis
- Remove markdown (`*negrito*` vira `negrito`)
- Remove caracteres especiais que atrapalham a pronúncia

### 3. Ajustar instruções do prompt para respostas em áudio

Reforçar no `audioInstructions` que quando responder para áudio, o bot deve:
- Escrever valores por extenso (ex: "trinta e quatro reais e noventa centavos")
- Não usar emojis ou formatação markdown
- Manter tom conversacional e natural

## Detalhes técnicos

Alterações apenas no arquivo `supabase/functions/whatsapp-webhook/index.ts`:

1. Na função `textToSpeech()`: trocar `model_id` de `eleven_turbo_v2_5` para `eleven_multilingual_v2`
2. Nova função `prepareTextForSpeech(text)` com regex para:
   - Converter `R$ X,YY` para formato falado em reais
   - Remover emojis com regex Unicode
   - Limpar markdown (`*`, `_`, etc.)
3. Chamar `prepareTextForSpeech()` antes de enviar o texto ao TTS
4. Atualizar `audioInstructions` para orientar respostas mais naturais para áudio

Nenhuma mudança no banco de dados, frontend, ou schema.

