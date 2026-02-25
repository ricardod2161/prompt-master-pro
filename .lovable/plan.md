
## Diagnóstico dos 4 Prints

### Problema Central: "PORÇÃO DE CARNE" com preço R$ 0,00 no cardápio

Os prints mostram claramente que o produto "PORÇÃO DE CARNE" está cadastrado com preço R$ 0,00. Isso cria uma cascata de comportamentos ruins:

1. **Print 3**: Bot mostra o cardápio com "PORÇÃO DE CARNE - R$ 0,00" → correto até aqui
2. **Cliente**: "Quero uma porção de carne de 20 reais" → bot entra em colapso lógico porque o produto existe mas tem preço R$ 0,00
3. **Print 4**: Bot questiona se o cliente quer pedir mesmo com R$ 0,00 em vez de simplesmente anotar
4. **Print 5**: Bot falha na geração de resposta ("Desculpe, não consegui gerar uma resposta")
5. **Print 5-6**: Depois de "marque aí no pedido" e "mesmo assim adicione quero 20 reais", bot adiciona mas fica confuso sobre o valor
6. **Bot pergunta "me confirme o valor exato"** — completamente desnecessário, o valor "20 reais" foi dito pelo cliente

### Causa Raiz 1: Produto com preço R$ 0,00 — bot trava
No `confirmarPedido()` linha ~951-967, quando o preço é 0 o `subtotal = 0 * quantidade = 0`, mas a lógica continua. O PROBLEMA está no `processWithAI()` que usa `gemini-2.5-flash` — ao receber o resultado de `buscar_produto` com R$ 0,00, o LLM entra em loop de raciocínio questionando o preço em vez de simplesmente anotar.

### Causa Raiz 2: "20 reais" como valor ≠ quantidade
O cliente diz "quero uma porção de carne de 20 reais". O bot precisa entender:
- Produto: "PORÇÃO DE CARNE"  
- Valor informado pelo cliente: R$ 20,00
- Ação: Anotar como 1x PORÇÃO DE CARNE com observação "R$ 20,00 em carne"

Mas a instrução atual diz:
```
→ Números como "20", "30", "50" em áudio = QUANTIDADE de produtos ou VALOR do pedido
```
Isso é ambíguo — "valor do pedido" não explica O QUE FAZER quando o preço no cardápio é R$ 0,00.

### Causa Raiz 3: Bot não mostra as opções de carne
O print 4 mostra que depois que o cliente pediu "uma porção de carne", o bot listou "CARNES DISPONIVEL" (porco, frango, boi, linguiça). Isso significa que o bot não identificou a categoria de carnes ANTES de pedir confirmação. A instrução para listar o cardápio está correta, mas o bot não está usando `listar_cardapio` proativamente quando o cliente menciona carnes.

### Causa Raiz 4: Modelo `gemini-2.5-flash` gerando "não consegui gerar resposta"
O print 5 às 12:37 mostra "Desculpe, não consegui gerar uma resposta." — isso ocorre quando o `MAX_ITERATIONS = 6` é atingido ou quando o modelo falha. O Gemini 2.5 Flash pode travar em raciocínio circular com produtos de preço zero.

---

## Solução Completa

### Correção 1 — Upgrade do modelo principal para Gemini 2.5 Pro (linha 1647)
Trocar `gemini-2.5-flash` por `google/gemini-2.5-pro` para o processamento principal de conversas. O Pro é muito mais inteligente para entender contexto ambíguo como "20 reais de porção de carne" com produto de preço zero.

```typescript
model: "google/gemini-2.5-pro",  // antes: "google/gemini-2.5-flash"
```

### Correção 2 — Lógica para produtos com preço R$ 0,00 (linha ~951)
No `confirmarPedido()` e `listarCardapio()`, quando o produto tem preço 0.00, o bot deve:
- Exibir no cardápio como "PORÇÃO DE CARNE - Consulte o preço"
- Na confirmação do pedido, usar o valor informado pelo cliente como `unit_price`

No `confirmarPedido()`, adicionar lógica especial:
```typescript
// Se produto tem preço 0 mas cliente informou valor, usar valor do cliente
let preco = typedProduct.price;
if (preco === 0) {
  // Tentar extrair preço da observação ou das notas do item
  preco = item.preco_informado || 0;
}
```

Modificar a interface `ConfirmarPedidoArgs` para suportar `preco_informado` opcional por item:
```typescript
itens: Array<{ nome: string; quantidade: number; preco_informado?: number }>;
```

### Correção 3 — Instrução no prompt para produtos com preço zero (getDefaultSystemPrompt)
Adicionar regra específica para quando o produto tem preço R$ 0,00:

```
🔴🔴🔴 REGRA CRÍTICA #7 - PRODUTOS SEM PREÇO DEFINIDO 🔴🔴🔴
- Quando um produto tem preço R$ 0,00 no cardápio, significa que o preço é VARIÁVEL (ex: porções por kg, por valor)
- Se o cliente informou um valor (ex: "20 reais de carne", "50 de boi"):
  → ANOTE o item com o valor informado pelo cliente como preço
  → NÃO questione o preço — o cliente já informou quanto quer gastar
  → NÃO peça confirmação de preço — anote e siga para o pagamento
  → Envie no campo preco_informado do item o valor declarado pelo cliente
- NUNCA trave o fluxo questionando "o produto está com R$ 0,00 — você quer pedir mesmo assim?"
- Exemplos:
  → "quero 20 reais de porção de carne" → 1x PORÇÃO DE CARNE, preco_informado: 20.00
  → "me manda 50 reais de boi assado" → 1x CARNE DE BOI ASSADO, preco_informado: 50.00
  → "pede 30 de frango" → 1x FRANGO ASSADO, preco_informado: 30.00
```

### Correção 4 — Listar cardápio de carnes proativamente
Quando o cliente mencionar "carne", "porção", "boi", "frango", "linguiça" etc, o bot deve usar `buscar_produto` ou `listar_cardapio` imediatamente para mostrar as opções disponíveis naquela categoria, SEM primeiro confirmar se quer pedir.

Adicionar ao prompt:
```
🥩 PEDIDOS DE PORÇÃO/CARNE (específico para churrascaria):
- Quando o cliente mencionar "porção", "carne", "boi", "frango", "porco", "linguiça":
  → IMEDIATAMENTE use listar_cardapio para mostrar as opções disponíveis
  → Não pergunte "qual porção?" sem antes mostrar o cardápio
  → Se o cliente já disse o tipo (ex: "porco e boi"), anote diretamente sem questionar
- Pedidos por valor (ex: "20 reais de porção"):
  → Anote como 1x [PRODUTO] com preco_informado = valor dito pelo cliente
  → NÃO questione — siga para endereço/pagamento
```

### Correção 5 — Exibir produtos com preço zero de forma amigável no cardápio
No `listarCardapio()` linha 513, alterar:
```typescript
// ANTES:
firstMsg += `🔶 ${item.name} - R$ ${item.price.toFixed(2).replace(".", ",")}\n`;

// DEPOIS:
const priceDisplay = item.price > 0 
  ? `R$ ${item.price.toFixed(2).replace(".", ",")}` 
  : "Preço por quantidade";
firstMsg += `🔶 ${item.name} - ${priceDisplay}\n`;
```

### Correção 6 — Ampliar `MAX_ITERATIONS` de 6 para 8
Produtos com preço zero causam iterações extras de raciocínio. Aumentar o limite evita o "não consegui gerar resposta":
```typescript
const MAX_ITERATIONS = 8;  // antes: 6
```

---

## Resumo das Mudanças

| Arquivo | Mudança | Onde |
|---------|---------|------|
| `whatsapp-webhook/index.ts` | Upgrade modelo: Flash → Pro | linha 1647 |
| `whatsapp-webhook/index.ts` | MAX_ITERATIONS: 6 → 8 | linha 1627 |
| `whatsapp-webhook/index.ts` | `listarCardapio`: exibir "Preço por quantidade" quando price=0 | linhas 513, 528 |
| `whatsapp-webhook/index.ts` | Interface `ConfirmarPedidoArgs`: adicionar `preco_informado?` por item | linha ~816 |
| `whatsapp-webhook/index.ts` | `confirmarPedido`: usar `preco_informado` quando price=0 | linha ~951 |
| `whatsapp-webhook/index.ts` | Prompt: REGRA #7 para produtos com preço zero | `getDefaultSystemPrompt()` |
| `whatsapp-webhook/index.ts` | Prompt: instrução específica para pedidos de porção/carne | `getDefaultSystemPrompt()` |

Nenhuma migration de banco de dados necessária. As mudanças são todas no webhook.
