
# Correcao: Pedido #85 - Guarana Antartica 1L registrado como Guarana Kuat Lata

## Diagnostico

Investiguei o pedido #85 da cliente "Mariiah". No historico de mensagens do WhatsApp, a IA corretamente identificou "GUARANA ANTARTICA 1L" (R$10) durante toda a conversa. Porem, no banco de dados, o pedido foi registrado com "GUARANA KUAT LATA" (R$6).

### Causa raiz: `directMatch` sem normalizacao de acentos

Na funcao `confirmarPedido` (linha 905-908), o primeiro passo de matching usa comparacao direta sem remover acentos:

```text
directMatch = allProducts.find(p => 
  p.name.toLowerCase().includes(item.nome.toLowerCase()) ||
  item.nome.toLowerCase().includes(p.name.toLowerCase())
);
```

Quando a IA passa "Guarana Antartica 1L" com acentos (ex: "Guarana Antartica"), a comparacao falha porque o banco tem "GUARANA ANTARTICA 1L" sem acentos. O directMatch retorna null.

Em seguida, o sistema cai para `getProductKeyword` que retorna "guarana" -- mas existem 3 produtos com esse keyword (GUARANA ANTARTICA 1L, GUARANA ANTARTICA-ZERO, GUARANA KUAT LATA), entao o single-match tambem falha.

Finalmente, `findBestProductMatch` e chamado, mas pode selecionar o produto errado se a IA omitir "1L" do nome, fazendo o score de matching ser ambiguo entre os 3 guaranas.

### Problema secundario: Score ambiguo entre guaranas

Se a IA passa "Guarana Antartica" (sem "1L"), o Strategy 4 (fuzzy scoring) pode empatar entre produtos similares. Sem o qualificador "1L", o algoritmo pode pegar o primeiro com score >= threshold.

---

## Correcoes

### 1. Normalizar acentos no `directMatch` da funcao `confirmarPedido`

Usar `normalizeProductName` (que ja remove acentos, hifens, stopwords) no `directMatch` em vez de apenas `.toLowerCase()`. Isso garante que "Guarana Antartica 1L" com acentos encontre "GUARANA ANTARTICA 1L" sem acentos.

**Antes:**
```text
const directMatch = allProducts?.find((p: any) => 
  p.name.toLowerCase().includes(item.nome.toLowerCase()) ||
  item.nome.toLowerCase().includes(p.name.toLowerCase())
);
```

**Depois:**
```text
const directMatch = allProducts?.find((p: any) => {
  const normalizedP = normalizeProductName(p.name);
  const normalizedItem = normalizeProductName(item.nome);
  return normalizedP.includes(normalizedItem) || normalizedItem.includes(normalizedP);
});
```

### 2. Priorizar match mais especifico no `directMatch`

Quando ha multiplos candidatos possiveis (ex: 3 guaranas), priorizar o que tem o melhor ajuste (menor diferenca de comprimento ou maior sobreposicao). Em vez de `.find()` (que retorna o primeiro), usar `.reduce()` para encontrar o melhor match.

### 3. Reforcar instrucao no system prompt para incluir tamanho/variacao

Adicionar instrucao explicita para a IA sempre incluir o tamanho/volume do produto no nome quando chamar `confirmar_pedido` (ex: "GUARANA ANTARTICA 1L" e nao "Guarana Antartica").

---

## Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/whatsapp-webhook/index.ts` | Normalizar directMatch com `normalizeProductName`, priorizar match mais especifico, reforcar instrucao no prompt |

## Resultado esperado

- "Guarana Antartica 1L" (com ou sem acentos) sempre encontra "GUARANA ANTARTICA 1L" (R$10)
- Nunca mais confunde com "GUARANA KUAT LATA" (R$6) ou "GUARANA ANTARTICA-ZERO" (R$6)
- Matching mais robusto para todos os produtos com nomes similares
