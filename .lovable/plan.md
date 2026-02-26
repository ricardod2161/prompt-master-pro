
## Análise Completa do Sistema

### Estado Atual
O sistema funciona mas tem 3 gaps críticos que precisam ser corrigidos:

1. **Banco de dados**: `products` table não tem coluna `is_variable_price`, `min_price` nem `max_price` — o sistema atual infere preço variável apenas pelo price=0, o que é frágil e ambíguo (produto pode ter price=0 por erro de cadastro, não por design)

2. **Webhook — valores por extenso**: A transcrição de áudio detecta "20 reais", "30 de boi" mas NÃO detecta "vinte reais", "trinta de frango", "cinquenta de boi" (números por extenso em português). O regex atual `(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|r\$)?` só captura dígitos arábicos, nunca palavras.

3. **Prompt — qualidade e alucinações**: O prompt tem instruções repetidas em 3 lugares distintos (LEIS ABSOLUTAS injetadas inline linha 2252, mais `absoluteLaws` const, mais `getDefaultSystemPrompt()`), criando inconsistência e confusão para o modelo. Há também conflito lógico entre REGRA #2 ("números em texto = troco") e LEIS ABSOLUTAS ("números em áudio = pedido"), que o modelo pode misturar.

4. **UI**: Menu.tsx não tem campo para `is_variable_price`, `min_price`, `max_price` — o administrador não consegue marcar explicitamente que um produto tem preço variável.

---

## Plano de Execução — 4 Camadas

### CAMADA 1 — Migração de Banco de Dados
Adicionar 3 colunas na tabela `products`:

```sql
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS is_variable_price boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_price numeric DEFAULT NULL;

-- Retrocompatibilidade: marcar como variável os produtos que já têm price=0
UPDATE public.products SET is_variable_price = true WHERE price = 0;
```

### CAMADA 2 — UI do Cardápio (src/pages/Menu.tsx)
Adicionar ao formulário de produto:

1. **Toggle switch "Preço Variável"** — quando ativado, desabilita o campo Preço Base e exibe os campos de Preço Mínimo e Máximo aceito
2. **Campo Preço Mínimo** (opcional) — ex: R$ 10,00
3. **Campo Preço Máximo** (opcional) — ex: R$ 200,00
4. **Badge visual** nos cards de produto: mostrar `🔄 Preço Variável` quando `is_variable_price=true`

Interfaces a atualizar:
- `Product` interface: adicionar `is_variable_price?: boolean`, `min_price?: number | null`, `max_price?: number | null`
- `productForm` state: adicionar `is_variable_price: false`, `min_price: ""`, `max_price: ""`
- `openProductDialog`: carregar/resetar os novos campos
- `handleSaveProduct`: incluir os novos campos no `baseData`
- `handleDuplicateProduct`: copiar os novos campos

### CAMADA 3 — Engine de Valores por Extenso (whatsapp-webhook/index.ts)

Criar função `parseMonetaryValueFromText(text: string): number | null` que converte:
- "vinte" → 20, "trinta" → 30, "quarenta" → 40, "cinquenta" → 50, "sessenta" → 60, "setenta" → 70, "oitenta" → 80, "noventa" → 90, "cem" → 100
- "vinte e cinco" → 25, "trinta e dois" → 32
- "vinte reais de carne" → 20.00
- "cinquenta de boi" → 50.00
- "trinta e cinco reais de frango" → 35.00
- Continua suportando: "20 reais", "R$30", "50 de boi"

```typescript
function parseMonetaryValueFromText(text: string): number | null {
  const normalized = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Map de unidades e dezenas em português
  const units: Record<string, number> = {
    "um": 1, "dois": 2, "tres": 3, "quatro": 4, "cinco": 5,
    "seis": 6, "sete": 7, "oito": 8, "nove": 9, "dez": 10,
    "onze": 11, "doze": 12, "treze": 13, "quatorze": 14, "quinze": 15,
    "dezesseis": 16, "dezessete": 17, "dezoito": 18, "dezenove": 19,
    "vinte": 20, "trinta": 30, "quarenta": 40, "cinquenta": 50,
    "sessenta": 60, "setenta": 70, "oitenta": 80, "noventa": 90,
    "cem": 100, "cento": 100, "duzentos": 200, "trezentos": 300,
  };
  
  // Tentar match direto com número (dígitos arábicos)
  const digitMatch = normalized.match(/r?\$?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|de\b)?/);
  if (digitMatch) return parseFloat(digitMatch[1].replace(",", "."));
  
  // Tentar composição de extenso: "vinte e cinco reais"
  const extensoPattern = /((?:cento?|duzentos?|trezentos?|quatrocentos?|quinhentos?|seiscentos?|setecentos?|oitocentos?|novecentos?|noventa|oitenta|setenta|sessenta|cinquenta|quarenta|trinta|vinte|dezenove|dezoito|dezessete|dezesseis|quinze|quatorze|treze|doze|onze|dez|nove|oito|sete|seis|cinco|quatro|tres|dois|um)(?:\s+e\s+(?:um|dois|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa))?)\s*(?:reais?|de\b|r\$)?/i;
  
  const extensoMatch = normalized.match(extensoPattern);
  if (extensoMatch) {
    const words = extensoMatch[1].split(/\s+e\s+/);
    let value = 0;
    for (const word of words) {
      const trimmed = word.trim();
      if (units[trimmed] !== undefined) value += units[trimmed];
    }
    if (value > 0) return value;
  }
  
  return null;
}
```

Esta função será usada em:
1. **`confirmarPedido()`** — substituir o regex simples atual pela nova função
2. **Prompt de transcrição** — instrução para o Gemini Pro transcrever valores por extenso tal como falados
3. **`getDefaultSystemPrompt()`** — expandir LEI #2 para incluir exemplos com números por extenso

### CAMADA 4 — Refatoração do Prompt (Prompt Engineering)

**Problema identificado**: O sistema atual injeta as "LEIS ABSOLUTAS" em 3 lugares:
- `absoluteLaws` const (linha 2252) — injetada no início para prompts customizados
- `getDefaultSystemPrompt()` (linha 2656) — começa com LEIS ABSOLUTAS duplicadas
- Resultado: o modelo vê a mesma instrução 2-3x, o que é ruído e pode causar "instruction following collapse"

**Correção do prompt engineering**:

1. **Remover duplicação**: `getDefaultSystemPrompt()` NÃO deve repetir as LEIS ABSOLUTAS porque elas já são injetadas via `absoluteLaws` const para ambos os casos (custom e default prompts)

2. **Reorganizar estrutura do prompt** para hierarquia clara:
```
[SYSTEM_PROMPT ESTRUTURA]
━━━ SEÇÃO 0: LEIS ABSOLUTAS (sempre injetada - não duplicar)
━━━ SEÇÃO 1: IDENTIDADE E PERSONALIDADE  
━━━ SEÇÃO 2: REGRAS DE FORMATAÇÃO (formatação WhatsApp)
━━━ SEÇÃO 3: REGRAS CRÍTICAS DE FLUXO (troco, confirmação, etc.)
━━━ SEÇÃO 4: FLUXO OBRIGATÓRIO (etapas 1-10)
━━━ SEÇÃO 5: CAPACIDADES ESPECIAIS (áudio, imagem)
━━━ [INJETADO AUTOMATICAMENTE] SEÇÃO 6: CONTEXTO DE HORÁRIO
━━━ [INJETADO AUTOMATICAMENTE] SEÇÃO 7: CAPACIDADE DE VOZ
```

3. **Expandir LEI #2** para incluir valores por extenso:
```
LEI #2 — EXTRAÇÃO DE VALOR MONETÁRIO (DÍGITOS E EXTENSO):
  - "20 reais de carne" → preco_informado = 20.00
  - "30 de frango" → preco_informado = 30.00  
  - "vinte reais de carne" → preco_informado = 20.00
  - "trinta de frango" → preco_informado = 30.00
  - "cinquenta de boi" → preco_informado = 50.00
  - "vinte e cinco reais" → preco_informado = 25.00
  - "uma porção de cinquenta" → preco_informado = 50.00
```

4. **Adicionar instrução no `buscarProduto`**: quando produto tem `is_variable_price=true`, mostrar faixa de preço (min-max) se disponível

5. **Corrigir bug de consistência**: A instrução atual na linha 2831 diz "Números como '20', '30', '50' em áudio = QUANTIDADE de produtos ou VALOR do pedido" — mas na REGRA CRÍTICA #2 diz "número após pergunta de troco = troco". Isso é correto mas o contexto pode confundir. Reformular para deixar absolutamente claro:
   - Número em áudio ANTES de qualquer pergunta de troco = pedido/valor
   - Número em texto DEPOIS que o bot perguntou troco = troco

### CAMADA 5 — Webhook: `buscarProduto` + `confirmarPedido` (is_variable_price)
Atualizar as queries no webhook para incluir os novos campos:

```typescript
// Em buscarProduto - query atualizada
.select("name, description, price, delivery_price, is_variable_price, min_price, max_price, category:categories(name)")

// Lógica de exibição quando is_variable_price=true:
if (product.is_variable_price || price === 0) {
  const range = (min_price && max_price) 
    ? `Faixa: R$ ${min_price.toFixed(2)} a R$ ${max_price.toFixed(2)}`
    : min_price ? `Mínimo: R$ ${min_price.toFixed(2)}`
    : "Preço definido pelo cliente";
  result += `💰 PREÇO VARIÁVEL — ${range}\n`;
  // instrução ao LLM...
}
```

```typescript
// Em confirmarPedido - query atualizada
.select("id, name, price, delivery_price, is_variable_price, min_price, max_price")

// Lógica expandida com parseMonetaryValueFromText
if (typedProduct.is_variable_price || preco === 0) {
  const preco_informado = (item as any).preco_informado 
    || parseMonetaryValueFromText(item.nome)
    || parseMonetaryValueFromText(conversationContext || "");
  // ...
}
```

---

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/` | Nova migration: adicionar `is_variable_price`, `min_price`, `max_price` à tabela `products` |
| `src/pages/Menu.tsx` | Toggle "Preço Variável", campos min/max price, badge visual no card |
| `supabase/functions/whatsapp-webhook/index.ts` | Função `parseMonetaryValueFromText`, queries com novos campos, refatoração do prompt, LEI #2 expandida com extenso |

## Sem Alterações Necessárias
- `src/integrations/supabase/types.ts` — atualizado automaticamente
- Nenhuma nova Edge Function necessária
- Nenhuma mudança de RLS — colunas seguem as políticas existentes de `products`
