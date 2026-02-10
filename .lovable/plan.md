

# Corrigir pronúncia do CPF/chave Pix no áudio do bot

## Problema

Quando o bot envia a chave Pix (CPF) por áudio via TTS (ElevenLabs), os dígitos são lidos como um número gigante (ex: "trinta e um bilhões, oitocentos e vinte e sete milhões...") em vez de dígito por dígito ("três, um, oito, dois, sete..."). Isso acontece porque a função `prepareTextForSpeech` não trata sequências longas de dígitos.

## Solução

Adicionar na função `prepareTextForSpeech` (em `supabase/functions/whatsapp-webhook/index.ts`) regras para:

1. **Sequências de 11+ dígitos** (CPF, CNPJ, chaves aleatórias): separar cada dígito com vírgula e espaço para que o TTS leia um por um
2. **Telefones com formato +55**: separar dígitos individualmente
3. Manter números curtos (valores, quantidades) intactos

### Detalhes técnicos

**Arquivo**: `supabase/functions/whatsapp-webhook/index.ts`, função `prepareTextForSpeech`

Adicionar antes da limpeza de emojis (linha ~2403):

```typescript
// Spell out long digit sequences (CPF, CNPJ, phone, Pix keys)
// 11+ digits = read digit by digit with commas
prepared = prepared.replace(/\+?(\d{11,})/g, (match) => {
  const digits = match.replace(/\D/g, '');
  return digits.split('').join(', ');
});

// Also handle formatted CPF (XXX.XXX.XXX-XX) and CNPJ
prepared = prepared.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/g, (_, a, b, c, d) => {
  return (a + b + c + d).split('').join(', ');
});
prepared = prepared.replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})-(\d{2})/g, (_, a, b, c, d, e) => {
  return (a + b + c + d + e).split('').join(', ');
});
```

Isso fará com que o CPF "31827345438264" seja convertido para "3, 1, 8, 2, 7, 3, 4, 5, 4, 3, 8, 2, 6, 4" antes de ser enviado ao TTS, resultando em uma leitura natural dígito por dígito.

Após a edição, o edge function será reimplantado automaticamente.
