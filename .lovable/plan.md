
# Corrigir formatacao do bot WhatsApp - Causa raiz encontrada

## O problema real (por que nao funcionou 3 vezes)

O restaurante tem um **prompt personalizado** salvo no banco de dados (campo `system_prompt` da tabela `whatsapp_settings`). O codigo funciona assim:

```text
const basePrompt = settings.system_prompt || getDefaultSystemPrompt();
```

Como existe um prompt customizado salvo, o `getDefaultSystemPrompt()` **NUNCA e usado**. Todas as regras criticas #4 e #5 que adicionamos estao dentro do prompt padrao, mas o bot usa o prompt customizado que **nao tem essas regras**.

## Solucao definitiva

Injetar as regras criticas #4 e #5 **sempre**, independentemente de o prompt ser customizado ou padrao -- da mesma forma que ja e feito com as `audioInstructions`.

### Mudanca no arquivo `supabase/functions/whatsapp-webhook/index.ts`

Na linha ~1853, onde hoje temos:

```text
const systemPrompt = basePrompt + audioInstructions;
```

Mudar para:

```text
const formattingRules = `

REGRAS OBRIGATORIAS DE FORMATACAO (aplicam-se SEMPRE):

REGRA 1 - UMA PERGUNTA POR VEZ:
- NUNCA faca mais de uma pergunta na mesma mensagem
- Primeiro pergunte o nome, espere resposta. Depois a modalidade, espere. Depois pagamento.
- Se o cliente ja forneceu dados espontaneamente, pule para a proxima etapa.

REGRA 2 - FORMATACAO DE LISTAS E OPCOES:
- NUNCA use listas numeradas (1. 2. 3.)
- Use um emoji relevante como marcador para cada item
- Cada item/opcao deve estar em sua PROPRIA LINHA
- Use *negrito* do WhatsApp para destacar opcoes
- NUNCA agrupe opcoes na mesma linha separadas por virgula

EXEMPLOS OBRIGATORIOS:

ERRADO: "1. Nome 2. Modalidade: *Entrega*, *Retirada*. 3. Pagamento."
ERRADO: "As opcoes sao: *Dinheiro*, *PIX*, *Cartao*"

CERTO (pagamento):
"Qual a forma de pagamento?

💵 *Dinheiro*
📱 *PIX*
💳 *Cartao* (Debito/Credito)"

CERTO (modalidade):
"Como deseja receber?

🏠 *Entrega*
🏪 *Retirada*
🍽️ *Comer no Local*"

CERTO (itens do pedido):
"🍕 1x Pizza Grande - R$ 45,00
🥤 2x Refrigerante - R$ 10,00"
`;

const systemPrompt = basePrompt + formattingRules + audioInstructions;
```

Tambem atualizar o prompt customizado no banco de dados para remover as instrucoes conflitantes de formatacao numerada (o trecho `**6. Modalidade**: ... **1. Entrega** | **2. Retirada** | **3. Comer no Local**`), substituindo por formato com emojis.

### Resumo das mudancas

1. **Criar bloco `formattingRules`** que e injetado SEMPRE apos o prompt base (customizado ou padrao)
2. **Reimplantar** o edge function `whatsapp-webhook`

Nenhuma mudanca no banco de dados (schema). Apenas codigo do edge function.
