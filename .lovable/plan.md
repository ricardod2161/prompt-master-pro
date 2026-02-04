
# Correção: Código Pix Correto no WhatsApp

## Problema Identificado

Na edge function `send-order-notification`, a função `formatPixKey` tem um bug de lógica:

| Tipo | Dígitos | O que acontece | Correto? |
|------|---------|----------------|----------|
| Telefone | 10-11 | Adiciona `+55` | ✅ |
| CPF | **11** | Adiciona `+55` | ❌ ERRADO |
| CNPJ | 14 | Mantém | ✅ |

O CPF `38734543864` está virando `+5538734543864` porque a verificação de telefone vem primeiro.

## Código Atual (Errado)

```typescript
function formatPixKey(key: string): string {
  const cleanKey = key.replace(/\D/g, '');
  
  // Telefone verificado PRIMEIRO - pega CPF por engano!
  if (/^\d{10,11}$/.test(cleanKey)) {
    return `+55${cleanKey}`;  // CPF vira telefone errado
  }
  
  // CPF/CNPJ - CPF nunca chega aqui
  if (/^\d{11}$/.test(cleanKey) || /^\d{14}$/.test(cleanKey)) {
    return cleanKey;
  }
  
  return key.toLowerCase();
}
```

## Solução

Usar a mesma lógica do `src/lib/pix-generator.ts` que detecta corretamente o tipo da chave antes de formatar:

```typescript
function detectPixKeyType(key: string): string {
  const cleanKey = key.replace(/\D/g, '');
  
  // CPF: exatamente 11 dígitos E começa com dígito válido (não pode ser 0)
  if (/^\d{11}$/.test(cleanKey) && !cleanKey.startsWith('0')) {
    return 'cpf';
  }
  
  // CNPJ: 14 dígitos
  if (/^\d{14}$/.test(cleanKey)) {
    return 'cnpj';
  }
  
  // Telefone: tem +55 explícito OU 10-11 dígitos começando com DDD válido
  if (/^\+?55\d{10,11}$/.test(key.replace(/[\s\-()]/g, ''))) {
    return 'phone';
  }
  
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) {
    return 'email';
  }
  
  return 'random';
}

function formatPixKey(key: string): string {
  const type = detectPixKeyType(key);
  
  switch (type) {
    case 'cpf':
    case 'cnpj':
      return key.replace(/\D/g, '');  // Só os números, SEM +55
    case 'phone':
      const cleanPhone = key.replace(/\D/g, '');
      if (cleanPhone.startsWith('55')) return `+${cleanPhone}`;
      return `+55${cleanPhone}`;
    case 'email':
      return key.toLowerCase();
    default:
      return key;
  }
}
```

## Alterações

### Arquivo: `supabase/functions/send-order-notification/index.ts`

1. Adicionar função `detectPixKeyType` (linhas ~81)
2. Corrigir função `formatPixKey` para usar a detecção correta

## Resultado Esperado

**Antes (errado):**
```
Chave: 38734543864 (CPF)
Formatado: +5538734543864 (tratado como telefone)
Código Pix: INVÁLIDO
```

**Depois (correto):**
```
Chave: 38734543864 (CPF)
Formatado: 38734543864 (mantido como CPF)
Código Pix: VÁLIDO ✅
```

## Mensagem WhatsApp

A mensagem já está formatada com destaque para o código Pix:

```
📱 *Pague via Pix:*
Copie o código abaixo e cole no seu app de banco:

```00020126360014br.gov.bcb.pix011438734543864...```
```

Com a correção, o código será gerado corretamente com a chave CPF.
