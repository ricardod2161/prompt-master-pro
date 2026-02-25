
## Análise Completa do Webhook

Após revisar as 3011 linhas do webhook, identifiquei os seguintes problemas:

### Instruções Vagas Encontradas (que podem causar alucinações)

**1. ETAPA 6 - Endereço coletado em múltiplas perguntas (linhas 2706-2712)**
A instrução atual lista 4 sub-itens de coleta de endereço (rua, número, bairro, referência) em bullets. O LLM pode interpretar isso como "fazer tudo de uma vez", violando a REGRA CRÍTICA #4 (uma pergunta por vez).

Correção: Especificar explicitamente que o endereço deve ser coletado pergunta por pergunta.

**2. ETAPA 3 - "Ajude o cliente a escolher" (linha 2683)**
A instrução "Ajude o cliente a escolher, responda dúvidas sobre produtos" é vaga demais — o LLM pode inventar produtos sem usar as ferramentas.

Correção: Tornar obrigatório o uso de `buscar_produto` para responder dúvidas específicas e `listar_cardapio` para mostrar o cardápio.

**3. "Respostas que NÃO são confirmação: números sozinhos (50, 100), 'ok', 'tá'" (linha 2604)**
O "ok" e "tá" são listados como NÃO confirmação, mas na prática clientes usam essas expressões para confirmar. Isso causa confusão — o bot pode ficar preso pedindo confirmação quando o cliente já confirmou.

Correção: Remover "ok" e "tá" da lista de não-confirmação e deixar apenas "números sozinhos".

**4. ETAPA 5 - Modalidade sem default claro (linhas 2699-2704)**
A instrução sobre modalidade não especifica o que fazer se o cliente não responder uma das 3 opções (por ex: "manda aqui" = entrega).

Correção: Adicionar instrução de mapeamento de respostas informais para modalidades.

**5. Log de diagnóstico ausente para o estado "fechado + quer pedir"**
Atualmente o único log de horário é genérico: `[TIME] ${currentTimeStr}...`. Não há log específico quando o bot detecta que o restaurante está fechado E o cliente confirmou que quer deixar o pedido anotado.

Correção: Adicionar log estruturado `[CLOSED-ORDER-INTENT]` quando `statusText === "FECHADO"`.

**6. REGRA CRÍTICA #3 — "ok" e "tá" como não-confirmação (linha 2604)**
Já mencionado acima — contradição entre as regras.

**7. Instrução vaga de ETAPA 9 — Resumo (linha 2730)**
"OBRIGATÓRIO mostrar o resumo COMPLETO" não define quando exatamente isso deve acontecer. O LLM pode mostrar o resumo antes de ter todos os dados.

Correção: Adicionar pré-condição explícita: "SÓ mostre o resumo após ter TODOS: nome + itens + modalidade + (endereço se entrega) + pagamento".

---

## Plano de Implementação

### Mudanças no `getDefaultSystemPrompt()` (linhas 2541–2770)

**1. ETAPA 3** — Tornar uso de ferramentas explícito e obrigatório:
```
ETAPA 3 - ESCOLHA DOS ITENS:
OBRIGATÓRIO: Use listar_cardapio para mostrar o cardápio.
OBRIGATÓRIO: Use buscar_produto para responder dúvidas sobre produtos específicos.
NUNCA invente preços, descrições ou disponibilidade sem consultar a ferramenta.
```

**2. ETAPA 5** — Adicionar mapeamento informal de modalidade:
```
Se o cliente usar termos informais, interprete:
- "manda aqui", "entrega", "deliver" → entrega
- "vou buscar", "retirar", "pegar lá" → retirada  
- "aqui mesmo", "comer aí", "mesa" → local
```

**3. ETAPA 6** — Endereço uma informação por vez:
```
ETAPA 6 - ENDEREÇO (apenas se ENTREGA):
Colete UMA informação por vez (REGRA UMA PERGUNTA):
Primeiro: "Qual a rua e número?" → espere
Segundo: "Qual o bairro?" → espere
Terceiro: "Tem algum ponto de referência?" → espere (opcional)
```

**4. ETAPA 9** — Adicionar pré-condição:
```
ETAPA 9 - RESUMO E CONFIRMAÇÃO:
⚠️ SÓ chegue nesta etapa após ter TODOS os dados:
✓ Nome do cliente
✓ Itens do pedido  
✓ Modalidade definida
✓ Endereço (se entrega)
✓ Forma de pagamento confirmada
✓ Troco (se dinheiro)
Se faltar QUALQUER dado, volte para coletá-lo ANTES de mostrar o resumo.
```

**5. REGRA CRÍTICA #3** — Corrigir lista de não-confirmação:
```
Respostas que NÃO são confirmação: números sozinhos (50, 100, 200)
Respostas que SÃO confirmação: "sim", "confirmo", "pode fazer", "isso", "confirma", "ok", "tá", "pode", "vai"
```

### Mudanças no `timeContextBlock` (linhas 2247–2269)

**6. Log diagnóstico "fechado + quer pedir"** — Adicionar log específico após construir o bloco de horário:
```typescript
if (statusText === "FECHADO") {
  console.log(`[CLOSED-ORDER-INTENT] Restaurant is CLOSED | unit_id=${settings.unit_id} | phone=${phone} | time=${currentTimeStr} ${currentDayPt} | detail=${statusDetail}`);
}
```

**7. Instrução de pré-pedido fechado** — Complementar a instrução já existente nas linhas 2262–2268 com detecção de padrão de linguagem do cliente:
```
- Padrões de resposta afirmativa que ATIVAM o fluxo de pré-pedido:
  "sim", "quero", "pode", "pode anotar", "claro", "com certeza", "ok", "tá bom", "tudo bem", "manda", "vai"
- Se o cliente responder com qualquer um desses padrões após a pergunta sobre anotar o pedido:
  → IMEDIATAMENTE use listar_cardapio
  → NÃO faça perguntas intermediárias antes de mostrar o cardápio
```

### Mudanças nas `formattingRules` (linhas 2295–2346)

**8. Reforçar REGRA 1** — Adicionar contexto de quando é OK avançar sem esperar:
```
- Se o cliente JÁ forneceu dados espontaneamente na mesma mensagem, avance diretamente.
  Exemplo: "Quero 2x pizza, entregar na Rua X, n.5, pago no pix" → já tem tudo, vá direto para ETAPA 9
```

---

## Arquivo Modificado

| Arquivo | Seção | Tipo de mudança |
|---------|-------|----------------|
| `supabase/functions/whatsapp-webhook/index.ts` | `getDefaultSystemPrompt()` | Clarificar ETAPAs 3, 5, 6, 9 e REGRA #3 |
| `supabase/functions/whatsapp-webhook/index.ts` | `timeContextBlock` | Adicionar log `[CLOSED-ORDER-INTENT]` e reforçar padrões afirmativos |
| `supabase/functions/whatsapp-webhook/index.ts` | `formattingRules` | Reforçar REGRA 1 com contexto de avanço automático |

Nenhuma migration de banco de dados necessária — todas as mudanças são no prompt e nos logs do webhook.
