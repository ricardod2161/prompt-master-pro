
# Corrigir erro "Parâmetros inválidos" no Pix

## Causa raiz: Bug no CRC16

O erro "Parâmetros inválidos" acontece porque o **CRC16 está sendo calculado errado**. O algoritmo CRC16-CCITT precisa manter o valor em 16 bits (mascarar com `& 0xFFFF`) a cada iteracao do loop interno. Sem isso, o valor cresce alem de 16 bits e o calculo do checksum fica incorreto.

### O bug (nas duas implementacoes):

```text
// ERRADO - valor cresce alem de 16 bits a cada shift
crc = (crc << 1) ^ 0x1021;   // pode virar 17, 18... 24 bits!
crc = crc << 1;                // sem mascara!
```

```text
// CORRETO - manter sempre em 16 bits
crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
crc = (crc << 1) & 0xFFFF;
```

Quando o CRC esta errado, o banco rejeita o codigo inteiro com "Parametros invalidos".

## Correcoes adicionais

### 1. Adicionar campo "Point of Initiation Method" (ID 01)

O padrao BR Code/Pix recomenda incluir o campo 01 com valor "12" (QR dinamico, com valor) ou "11" (QR estatico, sem valor). Varios bancos exigem esse campo. Atualmente esta faltando.

### 2. Corrigir truncamento do nome do comerciante

O nome "PAULO RICARDO DANTAS DE LIMA" e cortado em 25 caracteres ficando "PAULO RICARDO DANTAS DE L" (letra solta). Corrigir para truncar na ultima palavra completa: "PAULO RICARDO DANTAS DE" (23 chars).

## Detalhes tecnicos

Arquivos a alterar:

**1. `src/lib/pix-generator.ts`** (usado no frontend/tracking):
- Corrigir CRC16: adicionar `& 0xFFFF` nas duas linhas do loop interno
- Adicionar campo 01 ("12" quando tem valor, "11" quando nao tem)
- Corrigir `normalizeString` para truncar em palavra completa

**2. `supabase/functions/send-order-notification/index.ts`** (usado no WhatsApp):
- Mesmas 3 correcoes acima na copia das funcoes CRC16, generatePixCode e normalizeString

### Mudancas especificas:

**CRC16** (ambos arquivos):
```text
// Linha do if:
crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
// Linha do else:
crc = (crc << 1) & 0xFFFF;
```

**normalizeString** (ambos arquivos):
```text
function normalizeString(str: string): string {
  const cleaned = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toUpperCase()
    .trim();

  if (cleaned.length <= 25) return cleaned;

  // Truncar na ultima palavra completa dentro de 25 chars
  const truncated = cleaned.substring(0, 25);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 10 ? truncated.substring(0, lastSpace) : truncated;
}
```

**generatePixCode** (ambos arquivos):
```text
// Apos campo 00 (Payload Format Indicator), adicionar:
payload += formatField('01', amount && amount > 0 ? '12' : '11');
```

Nenhuma mudanca no banco de dados. Apenas correcoes nas funcoes de geracao de codigo Pix.
