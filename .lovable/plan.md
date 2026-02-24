
# Correcao: Bot travado em "aguarde" + Sprite nao encontrada

## Diagnostico

Investiguei o pedido #82 do cliente "Junho" e os logs do webhook. Encontrei dois problemas distintos:

### Problema 1: Rate Limit sem retry (CRITICO)
O bot usa a API de IA para processar cada mensagem. Quando a API retorna erro 429 (rate limit), o sistema simplesmente envia "No momento estamos com muitas solicitacoes..." e NAO tenta novamente. Isso faz o cliente ficar preso em loop - toda mensagem subsequente tambem pode ser rate-limited, tornando o bot inutilizavel.

### Problema 2: "Sprite" nao encontrada no cardapio
O produto no banco de dados esta cadastrado como **"SPRINT"** (com erro de digitacao - falta o "e"). O matching falha porque:
- "sprite" vs "sprint" - nao sao iguais
- Nenhuma estrategia de fuzzy matching consegue resolver diferenca de 1 caractere

Resultado: Pedido #82 criado com apenas 1 item (Prato Feito R$20) em vez de 2 itens (Prato Feito + Sprite).

### Problema 3: "Coca Cola" precisa de melhor matching
O cliente pediu "Adicionar uma coca cola" mas o bot ja estava travado no rate limit. Alem disso, existem duas opcoes:
- COCA COLA- LATA ZERO (R$6)
- COCA-COLA GARRAFINHA (R$5)

---

## Correcoes

### 1. Adicionar retry com backoff para rate limit

Quando a API retornar 429, tentar novamente ate 3 vezes com espera crescente (2s, 4s, 8s) antes de desistir. Isso resolve o problema principal do bot travado.

### 2. Adicionar Levenshtein distance no matching de produtos

Implementar uma funcao de distancia de edicao simples para capturar erros de digitacao como "SPRINT" vs "SPRITE" (distancia = 1). Adicionar como Strategy 5 no `findBestProductMatch`: se a distancia de edicao for menor que 2 caracteres, considerar como match.

### 3. Adicionar matching por substrings curtas

Para "coca cola" encontrar "COCA-COLA GARRAFINHA", melhorar o tratamento de hifens e caracteres especiais na normalizacao, removendo hifens antes de comparar.

### 4. Corrigir o produto "SPRINT" no banco

Atualizar o nome do produto para "SPRITE" no banco de dados (correcao de typo).

---

## Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/whatsapp-webhook/index.ts` | Retry com backoff no rate limit, Levenshtein matching, melhor normalizacao de hifens |

## Correcao de dados

| Acao | Detalhe |
|------|---------|
| Renomear produto "SPRINT" para "SPRITE" | Correcao de erro de digitacao no cadastro |

## Resultado esperado

- Bot nunca mais fica travado em "aguarde" - tenta ate 3x antes de desistir
- "Sprite" encontra "SPRITE" mesmo com typos no cadastro
- "Coca Cola" encontra "COCA-COLA GARRAFINHA" ou "COCA COLA- LATA ZERO"
- Operador recebe produto corretamente no pedido
