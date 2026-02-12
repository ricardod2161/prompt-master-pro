

# Melhorias no Gerador de Prompt com IA

## Visao Geral

Transformar o gerador de prompt atual (que tem apenas 2 campos simples) em um formulario inteligente e completo que coleta informacoes detalhadas do negocio para gerar prompts muito mais ricos, longos e profissionais.

## Problemas Atuais

- Apenas 2 campos: nome do restaurante e descricao generica
- META_PROMPT no backend e curto (limita prompt a 800-1500 caracteres)
- Nao coleta informacoes essenciais como horario, pagamento, delivery, tom de voz
- O prompt gerado e generico e falta personalidade

## O que Muda

### 1. Formulario Inteligente no Frontend (AIPromptGenerator.tsx)

Adicionar campos estruturados organizados em secoes visuais com acordeoes/cards:

**Secao Basica (obrigatoria):**
- Nome do restaurante (ja existe)
- Tipo de negocio (select: Pizzaria, Hamburgueria, Churrascaria, Restaurante, Lanchonete, Padaria, Doceria, Outro)
- Descricao do negocio (ja existe, mas como Textarea maior)

**Secao Operacional:**
- Dias de funcionamento (multi-select: Seg a Dom)
- Horario de funcionamento (inputs de hora inicio/fim)
- Formas de pagamento aceitas (checkboxes: Pix, Cartao Credito, Debito, Dinheiro, Vale Refeicao)
- Chave Pix (campo texto, se Pix for selecionado)
- Oferece delivery? (switch) + Taxa de entrega (input, se sim)
- Oferece retirada no local? (switch)
- Tempo medio de preparo (input)

**Secao Personalidade:**
- Tom de voz (select: Descontrado, Profissional, Formal, Divertido)
- Nivel de uso de emojis (slider: Nenhum, Moderado, Bastante)
- Nome do bot/assistente (opcional, ex: "Bia", "Chef Virtual")

**Secao Regras Especiais:**
- Textarea para observacoes extras (ex: "nao aceitamos pedido apos 22h", "entrega gratis acima de R$50")

### 2. META_PROMPT Muito Mais Inteligente (generate-prompt/index.ts)

Atualizar o META_PROMPT no backend para:
- Aceitar todos os novos campos estruturados
- Gerar prompts de 2000-4000 caracteres (muito mais completo)
- Incluir instrucoes sobre tool calling (func_anotar_pedido, Listar Cardapio, Buscar Produtos, Calculator)
- Incluir regras de formatacao WhatsApp (negrito com asteriscos, sem listas numeradas, um item por linha com emoji bullet)
- Incluir protocolos de escalacao e limites

Usar modelo `google/gemini-2.5-flash` (mais capaz que flash-preview para esta tarefa)

### 3. UI Responsiva e Profissional

- Layout responsivo com grid de 1 coluna em mobile e 2 colunas em desktop
- Secoes colapsaveis para nao sobrecarregar visualmente
- Indicadores de progresso (quantos campos foram preenchidos)
- Preview do prompt em tempo real com contagem de caracteres
- Botao de "Resetar" para limpar tudo
- Textarea do prompt gerado com mais linhas (15-20 rows)

## Arquivos Alterados

| Arquivo | Alteracao |
|---|---|
| `src/components/settings/AIPromptGenerator.tsx` | Redesign completo com formulario multi-secao, campos estruturados, layout responsivo |
| `supabase/functions/generate-prompt/index.ts` | META_PROMPT muito mais detalhado, aceitar novos campos, gerar prompts maiores e mais inteligentes |

## Detalhes Tecnicos

### Payload Enviado ao Backend
```typescript
{
  restaurantName: "Churrascaria Santo Antonio",
  businessType: "churrascaria",
  businessDescription: "Churrascaria tradicional com cortes nobres...",
  operatingDays: ["ter", "qua", "qui", "sex", "sab", "dom"],
  operatingHours: { open: "11:00", close: "22:00" },
  paymentMethods: ["pix", "credito", "debito", "vale_refeicao"],
  pixKey: "38734543864",
  hasDelivery: true,
  deliveryFee: 0,
  hasPickup: true,
  avgPrepTime: "30-45 min",
  voiceTone: "profissional",
  emojiLevel: "moderado",
  botName: "",
  specialRules: "Entrega gratuita. Fechamos na segunda."
}
```

### META_PROMPT Atualizado (resumo)
O novo meta prompt instruira a IA a:
- Gerar prompts de 2000-4000 caracteres
- Incluir secoes de identidade, fluxo de atendimento passo-a-passo, regras de formatacao WhatsApp, limites criticos, protocolos de escalacao e instrucoes de tool calling
- Usar as informacoes operacionais reais fornecidas (horarios, pagamentos, delivery)
- Adaptar personalidade ao tipo de negocio e tom selecionado
- Incluir instrucoes sobre como o bot deve formatar listas (emoji bullets, um por linha, negrito em opcoes)
- Proibir invencao de itens, descontos e informacoes falsas

