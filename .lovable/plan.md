
# Adicionar regras de formatacao para listas no bot WhatsApp

## Problema

Como mostra a screenshot, o bot esta enviando listas numeradas (1. 2. 3.) com multiplas perguntas juntas e sem formatacao visual clara. As listas devem usar quebras de linha e emojis individuais por item para ficar mais organizado e bonito no WhatsApp.

## Solucao

Adicionar uma nova regra critica no system prompt do bot (`supabase/functions/whatsapp-webhook/index.ts`) logo apos a regra #4, instruindo o modelo a:

- Usar emojis como marcadores em vez de numeros (ex: `📛 Nome`, `🏠 Entrega`, `💳 Pagamento`)
- Colocar cada opcao em sua propria linha com quebra de linha
- Usar negrito com asteriscos do WhatsApp para destacar opcoes
- Nunca agrupar opcoes na mesma linha separadas por virgula

### Exemplo do formato esperado:

```text
ERRADO (como esta hoje):
"1. Seu nome completo. 2. A modalidade: *Entrega*, *Retirada* ou *Comer no Local*. 3. A forma de pagamento..."

CERTO (como deve ficar):
"Qual a forma de pagamento?

💵 *Dinheiro*
📱 *PIX*
💳 *Cartao* (Debito/Credito)"
```

## Detalhes tecnicos

**Arquivo**: `supabase/functions/whatsapp-webhook/index.ts`

Adicionar apos a regra critica #4 (linha ~2122) uma nova regra:

```text
REGRA CRITICA #5 - FORMATACAO DE LISTAS E OPCOES
- NUNCA use listas numeradas (1. 2. 3.)
- Use um emoji relevante como marcador para cada item
- Cada item/opcao deve estar em sua PROPRIA LINHA (quebra de linha)
- Use *negrito* do WhatsApp para destacar opcoes
- ERRADO: "1. Seu nome. 2. Modalidade: *Entrega*, *Retirada*. 3. Pagamento."
- CERTO:
  "💵 *Dinheiro*
   📱 *PIX*
   💳 *Cartao*"
- Quando listar itens do pedido, use emojis por item:
  "🍕 1x Pizza Grande - R$ 45,00
   🥤 2x Refrigerante - R$ 10,00"
```

Apos a edicao, o edge function sera reimplantado automaticamente.
