
# Correção do Prompt do WhatsApp Bot

## Problemas Identificados

### 1. Bot inventando nomes de produtos
O bot criou "Prato Comercial misto" e "Suco Natural de Laranja" quando deveria usar os nomes exatos do cardápio:
- **Correto**: `Suco Natural Laranja`
- **Correto**: `Prato Feito`

### 2. Confusão na etapa do troco
Quando o cliente disse "50" (troco para R$50), o bot:
- Entendeu o troco corretamente
- MAS tentou finalizar o pedido imediatamente ao invés de mostrar o resumo primeiro
- Falhou porque os produtos não existiam com esses nomes

### 3. Busca parcial frágil
O `ilike('%nome%')` não encontra produtos quando o nome tem palavras extras/diferentes.

---

## Solução Proposta

### Fase 1: Melhorar o Prompt do Sistema

Adicionar instruções específicas sobre:

1. **USAR NOMES EXATOS DO CARDÁPIO**
```
🔴 REGRA CRÍTICA - NOMES DE PRODUTOS:
- SEMPRE use os nomes EXATOS que aparecem no cardápio
- NUNCA invente ou modifique nomes de produtos
- Se não lembrar o nome exato, use buscar_produto primeiro
- Exemplo ERRADO: "Suco Natural de Laranja" 
- Exemplo CERTO: "Suco Natural Laranja" (nome exato do sistema)
```

2. **FLUXO CORRETO DO TROCO**
```
ETAPA 8 - TROCO (apenas se DINHEIRO):
Quando perguntar "para quanto?" e cliente responder apenas um número (ex: "50"):
- Isso significa R$50 para troco
- NÃO é uma confirmação do pedido
- PRÓXIMO PASSO: Mostrar o resumo (ETAPA 9)
- NÃO pule direto para confirmar_pedido

Exemplo de fluxo correto:
Bot: "O total é R$ 34,90. Vai precisar de troco? Se sim, para quanto?"
Cliente: "50"
Bot: "Certo! Troco para R$ 50,00. Deixa eu confirmar seu pedido:
[MOSTRAR RESUMO COMPLETO]
✅ Confirma o pedido?"
```

3. **NUNCA CONFIRMAR SEM RESUMO**
```
⚠️ ANTES DE USAR confirmar_pedido:
- SEMPRE mostre o resumo completo primeiro
- ESPERE uma resposta EXPLÍCITA de confirmação (sim, confirmo, pode fazer)
- Um número sozinho (50, 100) NÃO é confirmação - é valor de troco
```

### Fase 2: Melhorar a Busca de Produtos

Modificar a função `buscarProduto` e `confirmarPedido` para:
- Usar busca mais flexível (remover preposições como "de", "do", "da")
- Aplicar busca fonética/normalizada

```typescript
// Normalizar nome antes da busca
function normalizeProductName(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remover acentos
    .replace(/\b(de|do|da|dos|das|com|e)\b/g, '') // remover preposições
    .replace(/\s+/g, ' ')
    .trim();
}

// Buscar com nome normalizado
const normalizedSearch = normalizeProductName(item.nome);
const { data: products } = await supabase
  .from("products")
  .select("id, name, price, delivery_price")
  .eq("unit_id", unitId)
  .eq("available", true);

// Filtrar manualmente com fuzzy match
const matched = products.find(p => 
  normalizeProductName(p.name).includes(normalizedSearch) ||
  normalizedSearch.includes(normalizeProductName(p.name))
);
```

### Fase 3: Adicionar Log de Produtos ao Contexto

Quando o bot enviar o cardápio, incluir uma nota no contexto com os nomes exatos para referência.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/whatsapp-webhook/index.ts` | Atualizar `getDefaultSystemPrompt()` com regras mais claras sobre nomes de produtos e fluxo de troco |
| `supabase/functions/whatsapp-webhook/index.ts` | Melhorar `confirmarPedido()` com busca de produtos mais tolerante |
| `supabase/functions/whatsapp-webhook/index.ts` | Melhorar `buscarProduto()` com normalização de nomes |

---

## Fluxo Correto Após Correção

```
Bot: "O total é R$ 34,90. Vai precisar de troco? Para quanto vai pagar?"
Cliente: "50"

Bot: "Perfeito! Pagamento em dinheiro, troco para R$ 50,00.

📋 *RESUMO DO SEU PEDIDO*

👤 *Cliente:* Ricardo
📍 *Modalidade:* Entrega
🏠 *Endereço:* Rua Antônio Caetano, 215, Centro

📦 *Itens:*
• 1x Prato Feito - R$ 20,00
• 1x Suco Natural Laranja - R$ 14,90

💰 *Total:* R$ 34,90
💳 *Pagamento:* Dinheiro
💵 *Troco para:* R$ 50,00
💰 *Troco:* R$ 15,10

✅ Posso confirmar o pedido?"

Cliente: "Sim"

[APENAS AGORA usa confirmar_pedido com os nomes EXATOS]
```

---

## Resumo das Correções

1. **Prompt mais rigoroso** sobre usar nomes exatos do cardápio
2. **Fluxo do troco clarificado** - número = valor de pagamento, NÃO confirmação
3. **Busca de produtos tolerante** a variações (com/sem preposições)
4. **Obrigar resumo antes de confirmação** - SEMPRE
