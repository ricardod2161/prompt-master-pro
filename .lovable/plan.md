
# Marketing Studio Pro - Gerador de Prompts Inteligente com Templates Profissionais

## Objetivo

Transformar o Marketing Studio atual em uma ferramenta profissional completa com:
1. **Gerador de prompts automatico** - ao clicar em um tipo de campanha, o titulo e descricao sao preenchidos automaticamente com exemplos profissionais
2. **Templates prontos** - biblioteca de exemplos profissionais por categoria (promocao, cardapio, delivery, etc.)
3. **Prompt visivel e editavel** - o usuario pode ver e personalizar o prompt que sera usado para gerar a imagem
4. **Imagens do sistema/landing page** - opcao para gerar imagens mostrando screenshots do sistema (dashboard, pedidos, cardapio) para campanhas institucionais no Facebook

## Como Funciona

1. O usuario seleciona um tipo de campanha (ex: "Promocao")
2. Imediatamente, um template profissional preenche titulo, descricao e mostra o prompt que sera gerado
3. O usuario pode escolher entre varios exemplos prontos dentro de cada categoria
4. Pode editar/personalizar o prompt antes de gerar
5. Nova categoria "Sistema/Institucional" permite gerar imagens mostrando as telas do sistema para campanhas B2B

## Implementacao

### 1. Banco de Templates Profissionais (Frontend)

Dicionario de templates organizados por tipo de campanha, cada um com:
- Titulo pronto
- Descricao profissional
- Preview do prompt gerado
- Variantes (3-4 exemplos por categoria)

Exemplos:

**Promocao:**
- "Festival de Sabores - Ate 40% OFF"
- "Combo Familia - R$89,90 para 4 pessoas"
- "Happy Hour - 2 por 1 em drinks"

**Cardapio do Dia:**
- "Prato do Chef - Risoto de Camarao"
- "Almoco Executivo - A partir de R$24,90"
- "Novidade no Cardapio - Experimente Hoje"

**Delivery:**
- "Peça pelo App - Frete Gratis Hoje"
- "Delivery Relampago - 30min ou Gratis"

**Inauguracao:**
- "Grande Inauguracao - Venha Celebrar"
- "Novo Endereco - Mesmo Sabor"

**Evento:**
- "Noite Italiana - Sexta Especial"
- "Live Music + Jantar - Sabado"

**Feriado:**
- "Dia das Maes - Menu Especial"
- "Natal em Familia - Reserve Sua Mesa"

**Sistema (NOVA CATEGORIA):**
- "Dashboard Inteligente - Gerencie Tudo"
- "Sistema de Pedidos - Moderno e Rapido"
- "Gestao Completa - Cardapio Digital"

### 2. Nova Categoria: "Sistema / Institucional"

Adicionar tipo de campanha `system` que gera imagens profissionais mostrando:
- Interface do dashboard com graficos
- Tela de pedidos e gestao
- Cardapio digital moderno
- App de delivery
- Conceito de tecnologia para restaurantes

O prompt para esta categoria sera especifico para gerar mockups de interface/app, incluindo descricoes das telas do sistema (baseadas no layout real da landing page).

### 3. Card de Prompt Gerado (Preview)

Novo card entre o formulario e o botao de gerar que mostra:
- O prompt completo que sera enviado a IA
- Badge com o modelo usado (Gemini 3 Pro)
- Botao para copiar o prompt
- Textarea editavel para customizacao avancada

### 4. Seletor de Exemplos

Dentro do card "Conteudo", adicionar:
- Botoes de exemplos rapidos (chips clicaveis)
- Ao clicar, preenche titulo + descricao automaticamente
- Indicacao visual de "exemplo selecionado"

### 5. Atualizar Edge Function

Adicionar ao `campaignMap` a nova categoria `system` com descricao especifica para imagens institucionais/de sistema.

### 6. Arquivos Modificados

- `src/pages/MarketingStudio.tsx` - Adicionar templates, seletor de exemplos, preview de prompt, nova categoria
- `supabase/functions/generate-marketing-image/index.ts` - Adicionar categoria "system" ao campaignMap

### 7. Experiencia do Usuario

1. Usuario clica em "Promocao"
2. Aparecem 3-4 chips de exemplo: "Festival de Sabores", "Combo Familia", "Happy Hour"
3. Ao clicar em "Festival de Sabores", titulo e descricao sao preenchidos automaticamente
4. O prompt gerado aparece em um card abaixo, editavel
5. Usuario pode personalizar e clicar "Gerar Imagem"
6. Resultado aparece no preview e na galeria

## Detalhes Tecnicos

### Estrutura dos Templates

```typescript
const campaignTemplates: Record<string, Template[]> = {
  promotion: [
    {
      title: "Festival de Sabores - Ate 40% OFF",
      description: "Pratos selecionados com desconto...",
      promptHint: "emphasis on discount badges and food variety"
    },
    // ...mais exemplos
  ],
  system: [
    {
      title: "Dashboard Inteligente",
      description: "Sistema completo de gestao...",
      promptHint: "modern SaaS dashboard UI with charts, clean design, restaurant management app screenshot"
    }
  ]
};
```

### Preview do Prompt

Componente que reconstroi o prompt no frontend (espelhando a logica do backend) para mostrar ao usuario o que sera enviado a IA, permitindo ajustes antes de gerar.
