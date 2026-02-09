

# Gerador de Prompt com IA para WhatsApp Bot

## Resumo

Adicionar um botao "Gerar com IA" ao lado do campo "Prompt do Sistema" na pagina de configuracoes do WhatsApp. O administrador descreve o tipo de negocio (ex: "pizzaria delivery", "hamburgueria gourmet", "restaurante japones") e a IA gera um prompt profissional e completo para o bot de atendimento.

## Como Funciona

```text
┌─────────────────────────────────────────────┐
│  Prompt do Sistema (IA)                     │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ Descreva seu negocio:                │   │
│  │ [Pizzaria delivery com massa artesa] │   │
│  │                                      │   │
│  │         [ Gerar Prompt com IA ]      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ Voce e um assistente profissional... │   │
│  │ de uma pizzaria delivery artesanal.  │   │
│  │ Seja cordial, ajude com pedidos...   │   │
│  │ ...                                  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  [ Salvar Configuracoes do Bot ]            │
└─────────────────────────────────────────────┘
```

## Fluxo

1. Administrador digita descricao do negocio (ex: "hamburgueria gourmet com delivery")
2. Clica em "Gerar Prompt com IA"
3. IA gera prompt profissional que inclui:
   - Tom de atendimento adequado ao tipo de negocio
   - Instrucoes de como lidar com pedidos
   - Comportamento do bot (cordial, profissional)
   - Limites de atendimento
   - Quando transferir para humano
4. Prompt gerado preenche o campo de system prompt
5. Admin pode editar e salvar

## Alteracoes Tecnicas

### 1. Nova Edge Function: `generate-prompt`

Usa Lovable AI (Gemini 3 Flash) para gerar o prompt:
- Recebe a descricao do negocio
- Envia para a IA com instrucoes de como criar um prompt profissional para bot de atendimento WhatsApp
- Retorna o prompt gerado

### 2. Atualizacao: `WhatsAppSettings.tsx`

Na aba "Bot", adicionar acima do textarea de system prompt:
- Input para descricao do negocio
- Botao "Gerar com IA" com icone de Sparkles
- Estado de loading durante geracao
- Preencher automaticamente o textarea com o resultado

### 3. Atualizacao: `supabase/config.toml`

Registrar a nova funcao `generate-prompt`.

## Resumo dos Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/generate-prompt/index.ts` | Criar - Edge function que chama Lovable AI |
| `src/pages/WhatsAppSettings.tsx` | Atualizar - Adicionar UI do gerador |
| `supabase/config.toml` | Atualizar - Registrar nova funcao |

