

## Diagnóstico Definitivo

O print mostra exatamente o problema: o bot diz **"Por isso, eu não consigo registrar um pedido dela no valor de R$ 20,00"** — isso acontece porque o LLM, ao usar `buscar_produto` e receber `price: 0`, entra em modo de "não posso fazer isso" que **sobrepõe o prompt**. A REGRA #7 está no final do prompt (linha 2683) e o modelo a ignora em favor do seu raciocínio interno de "preço inválido".

### 3 Causas Raiz Identificadas

**Causa 1 — Posição da REGRA #7 no prompt**
A regra está no final do prompt, onde o modelo tem menos atenção. LLMs tendem a priorizar instruções do início. Quando o `buscar_produto` retorna `price: 0`, o raciocínio natural do modelo ("preço inválido = não posso confirmar") domina.

**Causa 2 — O retorno de `buscar_produto` não instrui o modelo**
Quando `buscar_produto` retorna um produto com `price: 0`, a resposta da ferramenta não contém nenhuma instrução. O modelo interpreta o resultado livremente e conclui: "não posso criar pedido de R$20 para produto de R$0". Precisamos que o próprio retorno da ferramenta diga o que fazer.

**Causa 3 — Falta de extração de valor monetário do texto**
Quando o cliente diz "quero uma porção de carne de 20 reais", o `preco_informado` deveria ser enviado automaticamente pelo LLM (20.00), mas o LLM, ao travar no raciocínio, não envia esse campo.

---

## Plano de Correção em 3 Camadas

### Camada 1 — Modificar retorno de `buscarProduto` quando price=0
Quando o produto tem `price=0`, o retorno da ferramenta deve incluir uma instrução DIRETA ao LLM:

```typescript
// ANTES (linha ~395):
return `✅ Produto encontrado: ${product.name}\n💰 Preço: R$ ${product.price.toFixed(2)}`;

// DEPOIS — se price === 0:
if (price === 0) {
  return `✅ Produto encontrado: ${product.name}
⚠️ PRODUTO DE PREÇO VARIÁVEL (o cliente define o valor)
🔴 INSTRUÇÃO OBRIGATÓRIA: Se o cliente já informou um valor monetário (ex: "20 reais", "30 reais"), você DEVE chamar IMEDIATAMENTE confirmar_pedido com preco_informado = valor declarado pelo cliente. NÃO questione o preço. NÃO diga "não consigo registrar". APENAS confirme o pedido.`;
}
```

### Camada 2 — Mover REGRA #7 para o INÍCIO do system prompt
Antes de qualquer instrução de personalidade, colocar uma seção de "LEIS ABSOLUTAS":

```
🚨🚨🚨 LEIS ABSOLUTAS — NUNCA VIOLÁVEIS 🚨🚨🚨

LEI #1 — PRODUTO COM PREÇO VARIÁVEL (price=0):
Se o resultado de buscar_produto mostrar "PRODUTO DE PREÇO VARIÁVEL":
→ Se o cliente JÁ disse um valor (ex: "20 reais", "30 de carne", "50 de boi"):
  CHAME IMEDIATAMENTE confirmar_pedido com preco_informado = [valor dito pelo cliente]
  NÃO diga "não consigo registrar"
  NÃO diga "o produto está com R$ 0,00"
  NÃO peça confirmação de preço
→ Se o cliente NÃO disse um valor: pergunte "Qual o valor que deseja gastar?"

EXEMPLOS OBRIGATÓRIOS (memorize):
  Cliente: "quero 20 reais de porção de carne"
  → confirmar_pedido(nome="PORÇÃO DE CARNE", quantidade=1, preco_informado=20.00) ✅
  
  Cliente: "me manda 50 de boi"  
  → confirmar_pedido(nome=produto_boi, quantidade=1, preco_informado=50.00) ✅
  
  PROIBIDO: "não consigo registrar pois o preço é R$ 0,00" ❌
  PROIBIDO: "o item aparece com R$ 0,00 no sistema" ❌
```

### Camada 3 — Extração automática de valor no confirmarPedido (backend)
No backend (`confirmarPedido`), adicionar uma extração de regex para capturar valores monetários do nome do item quando `preco_informado` não for enviado:

```typescript
// Se preco é 0 e não veio preco_informado, tentar extrair do nome do item
// Ex: item.nome = "PORÇÃO DE CARNE 20 REAIS" → extrair 20
if (preco === 0 && !(item as any).preco_informado) {
  const valorMatch = item.nome.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|r\$)?/i);
  if (valorMatch) {
    preco = parseFloat(valorMatch[1].replace(",", "."));
    console.log(`[ORDER] Extraindo preço do nome do item: "${item.nome}" → R$ ${preco}`);
  }
}
```

### Camada 4 — Instrução de sistema proativa para detecção de valor no contexto
Adicionar no início do system prompt a instrução de que, antes de usar `buscar_produto`, o bot deve extrair o valor monetário da mensagem do cliente e guardá-lo:

```
ANTES de qualquer busca de produto:
- Verifique se a mensagem do cliente contém um valor monetário (ex: "20 reais", "R$30", "cinquenta reais")
- Se sim, MEMORIZE esse valor como preco_informado para usar em confirmar_pedido
- Nunca perca esse valor durante o fluxo
```

---

## Resumo das Mudanças

| Arquivo | Seção | Mudança |
|---------|-------|---------|
| `whatsapp-webhook/index.ts` | `buscarProduto()` função | Retorno especial com instrução direta ao LLM quando `price=0` |
| `whatsapp-webhook/index.ts` | `getDefaultSystemPrompt()` início | Adicionar seção "LEIS ABSOLUTAS" no topo, antes da personalidade |
| `whatsapp-webhook/index.ts` | `confirmarPedido()` | Extração de valor monetário via regex do nome do item como fallback |
| `whatsapp-webhook/index.ts` | `getDefaultSystemPrompt()` | Instrução de memorizar valor monetário antes de buscar produto |

