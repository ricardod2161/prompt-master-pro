

# Adicionar Gerador de Prompt com IA nas Configuracoes + Nome Editavel

## Resumo

Adicionar o gerador de prompt com IA na pagina de Configuracoes (Settings), acessivel aos clientes do sistema, e incluir um campo editavel para o nome do restaurante que sera usado na geracao do prompt.

## O que muda

### 1. Novo componente: `src/components/settings/AIPromptGenerator.tsx`

Componente reutilizavel com:
- Campo editavel para **nome do restaurante** (pre-preenchido com o nome da unidade)
- Campo para **descricao do negocio** (tipo de culinaria, estilo, etc)
- Botao "Gerar com IA" com estado de loading
- Textarea com o prompt gerado, editavel pelo admin
- Botao para salvar o prompt gerado no `whatsapp_settings`

### 2. Nova aba na pagina de Configuracoes: "WhatsApp IA"

Adicionar uma nova aba no `Settings.tsx` com icone de Bot/Sparkles que renderiza o `AIPromptGenerator`. Essa aba ficara acessivel para os clientes do sistema (donos de restaurante).

### 3. Atualizar Edge Function `generate-prompt`

Receber tambem o campo `restaurantName` e incluir no contexto enviado a IA, para que o prompt gerado ja venha personalizado com o nome correto do estabelecimento.

### 4. Atualizar `WhatsAppSettings.tsx`

Usar o mesmo componente `AIPromptGenerator` na aba Bot, substituindo o bloco atual do gerador para evitar duplicacao de codigo.

## Fluxo do Usuario

```text
Configuracoes -> Aba "WhatsApp IA"
┌─────────────────────────────────────────────┐
│  Gerador de Prompt com IA                   │
│                                             │
│  Nome do Restaurante:                       │
│  [Pizzaria do Joao          ] (editavel)    │
│                                             │
│  Descreva seu negocio:                      │
│  [Pizzaria delivery com massa artesanal   ] │
│                                             │
│         [ Gerar Prompt com IA ]             │
│                                             │
│  Prompt gerado:                             │
│  ┌──────────────────────────────────────┐   │
│  │ Voce e o assistente virtual da      │   │
│  │ Pizzaria do Joao, uma pizzaria...   │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  [ Salvar Prompt ]                          │
└─────────────────────────────────────────────┘
```

## Arquivos Alterados

| Arquivo | Acao |
|---------|------|
| `src/components/settings/AIPromptGenerator.tsx` | Criar - Componente reutilizavel do gerador |
| `src/pages/Settings.tsx` | Atualizar - Adicionar nova aba "WhatsApp IA" |
| `src/pages/WhatsAppSettings.tsx` | Atualizar - Usar componente compartilhado |
| `supabase/functions/generate-prompt/index.ts` | Atualizar - Aceitar `restaurantName` e incluir no prompt |

## Detalhes Tecnicos

- O componente `AIPromptGenerator` recebe props: `unitName`, `unitId`, `onPromptSaved` (callback opcional)
- O nome do restaurante e pre-preenchido via `selectedUnit.name` mas pode ser editado
- A edge function `generate-prompt` passa a receber `{ businessDescription, restaurantName }` e injeta o nome no contexto da IA
- O prompt gerado e salvo na tabela `whatsapp_settings` via upsert (cria se nao existir)
- Design segue o padrao visual existente com `SettingCard`, bordas dashed, icone Sparkles

