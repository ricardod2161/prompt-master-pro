
# Correcao: Pedido WhatsApp nao registra Marmita corretamente

## Diagnostico Detalhado

Investiguei os pedidos #80 e #81 do cliente "Restaurante Santo Antonio" no banco de dados e confirmei o erro:

### O que aconteceu:

1. No WhatsApp, o bot montou o pedido correto: **1x Marmita com Carne de Boi e Frango (R$18) + 1x Guarana Kuat Lata (R$6) = R$24**
2. Ao chamar a funcao `confirmar_pedido`, o bot enviou o nome do item como **"Marmita com Carne de Boi e Frango"**
3. O produto no banco se chama **"MARMITA 2 OPCAO DE CARNE"** (R$18)
4. O algoritmo de matching falhou porque:
   - Match direto: "marmita 2 opcao de carne" nao contem "marmita com carne de boi e frango" → FALHOU
   - Match normalizado: "marmita 2 opcao carn" vs "marmita carn boi frango" → FALHOU
   - Match por palavras (60%): apenas "marmita" e "carn" coincidem = 2/4 = 50% < 60% → FALHOU
5. A marmita foi **silenciosamente descartada** e apenas o Guarana foi registrado
6. Pedido criado com 1 item e R$6.00 em vez de 2 itens e R$24.00

### Problemas adicionais encontrados:

- **Dois pedidos criados** (#80 e #81) ambos apenas com Guarana - a janela anti-duplicidade de 2 minutos e muito curta
- **Itens nao encontrados sao silenciosos** - o sistema cria o pedido parcial sem avisar claramente o operador

---

## Correcoes

### 1. Melhorar algoritmo de matching de produtos (PRINCIPAL)

No `findBestProductMatch`, adicionar novas estrategias:

- **Strategy 2.5 - Match por palavra-chave do produto**: Se a primeira palavra significativa do produto (ex: "marmita") esta no texto de busca, considerar como candidato forte
- **Strategy 4 melhorada**: Reduzir threshold de 60% para 40% quando a primeira palavra-chave do produto for encontrada
- **Strategy 5 - Match por categoria/tipo**: Se o texto de busca contem a palavra principal do produto (como "marmita"), e o produto so tem 1 resultado desse tipo, retornar

### 2. Melhorar matching direto (linha 812-814)

Alem do `includes` simples, adicionar matching por primeira palavra significativa:

```text
Antes: "MARMITA 2 OPCAO DE CARNE".includes("Marmita com Carne de Boi e Frango") → false
Depois: Primeira palavra "marmita" == "marmita" → candidato forte
```

### 3. Corrigir anti-duplicidade

Aumentar janela de 2 minutos para 5 minutos para evitar pedidos duplicados acidentais.

### 4. Adicionar aviso explicito no pedido sobre itens nao encontrados

Quando `itensNaoEncontrados.length > 0`, incluir essa informacao nas `notes` do pedido para que o operador veja no sistema.

### 5. Reforcar instrucao no system prompt

Adicionar instrucao mais forte para o bot usar nomes EXATOS do cardapio e listar os nomes disponiveis antes de confirmar.

### 6. Corrigir os pedidos #80 e #81 no banco

Executar SQL para atualizar os pedidos existentes com os dados corretos.

---

## Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/whatsapp-webhook/index.ts` | Melhorar `findBestProductMatch`, matching direto, janela anti-dup, notas de itens nao encontrados |

## Correcao de dados

| Acao | Detalhe |
|------|---------|
| Deletar pedido #80 | Duplicado incorreto |
| Atualizar pedido #81 | Adicionar item Marmita, corrigir total para R$24 |

## Resultado esperado

- Marmitas e produtos com nomes genericos serao corretamente identificados mesmo quando o cliente descreve diferente
- Pedidos duplicados serao evitados com janela de 5 minutos
- Operador vera aviso no pedido quando algum item nao foi encontrado
