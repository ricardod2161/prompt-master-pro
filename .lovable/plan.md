
# Gerador de Imagens Profissionais para Facebook - RestaurantOS

## Objetivo

Criar uma nova pagina/ferramenta dentro do sistema que permite ao usuario gerar imagens profissionais de marketing para campanhas de Facebook, usando IA (Lovable AI com modelo de geracao de imagens).

## Como Funciona

O usuario acessa a ferramenta, escolhe o tipo de campanha (promocao, cardapio do dia, evento, delivery, etc.), personaliza o texto e estilo, e a IA gera uma imagem profissional otimizada para Facebook (1200x630px para posts, 1080x1080 para feed quadrado).

## Implementacao

### 1. Edge Function: `generate-marketing-image`

Nova edge function que:
- Recebe tipo de campanha, textos personalizados, e estilo desejado
- Monta um prompt detalhado e profissional para geracao de imagem
- Chama o Lovable AI Gateway com modelo `google/gemini-3-pro-image-preview` (melhor qualidade de imagem)
- Retorna a imagem gerada em base64
- Salva a imagem no Storage do Lovable Cloud para download posterior

### 2. Nova Pagina: `src/pages/MarketingStudio.tsx`

Interface com:
- **Seletor de tipo de campanha**: Promocao, Cardapio do Dia, Inauguracao, Delivery, Evento Especial, Feriado
- **Campos personalizaveis**: Nome do restaurante (pre-preenchido), titulo da campanha, descricao/oferta, informacoes de contato
- **Seletor de formato**: Post Feed (1080x1080), Capa Facebook (1200x630), Story (1080x1920)
- **Seletor de estilo visual**: Moderno/Minimalista, Rustico/Artesanal, Premium/Elegante, Colorido/Vibrante
- **Botao "Gerar Imagem"** com loading state
- **Preview da imagem gerada** com botao de download
- **Galeria de imagens anteriores** salvas no storage

### 3. Rota e Navegacao

- Adicionar rota `/marketing` no `App.tsx`
- Adicionar item "Marketing" no sidebar (`AppSidebar.tsx`) com icone `Megaphone`

### 4. Storage Bucket

- Criar bucket `marketing-images` para armazenar as imagens geradas
- Politica de acesso: usuarios autenticados podem ler/escrever apenas suas proprias imagens

### 5. Tabela de Historico (opcional mas recomendada)

Tabela `marketing_images` para registrar:
- `id`, `unit_id`, `user_id`, `image_url`, `prompt_used`, `campaign_type`, `format`, `created_at`
- Permite exibir galeria de imagens ja geradas

## Detalhes Tecnicos

### Prompt Engineering

O prompt enviado ao modelo sera construido dinamicamente com base nas escolhas do usuario. Exemplo:

```
Create a professional, high-quality restaurant marketing image for Facebook.
Style: Modern and elegant
Campaign type: Daily special promotion
Restaurant name: "Sabor da Casa"
Headline: "Feijoada Completa - R$29,90"
Details: "Todos os sabados, das 11h as 15h"
Format: Square 1080x1080
Include: appetizing food photography style, warm lighting, professional typography overlay, brand colors orange and gold
Do NOT include: text that could be misspelled, logos, watermarks
```

### Edge Function Structure

```typescript
// supabase/functions/generate-marketing-image/index.ts
// 1. Validate auth
// 2. Build prompt from user inputs
// 3. Call Lovable AI with gemini-3-pro-image-preview
// 4. Upload base64 result to storage bucket
// 5. Return public URL
```

### Componentes Frontend

- `MarketingStudio.tsx` - Pagina principal
- `CampaignTypeSelector.tsx` - Cards de selecao do tipo
- `ImagePreview.tsx` - Preview com download
- `ImageGallery.tsx` - Galeria de imagens anteriores

## Experiencia do Usuario

1. Usuario acessa "Marketing" no menu lateral
2. Escolhe o tipo de campanha (ex: "Promocao")
3. Preenche titulo e descricao da oferta
4. Escolhe formato (Feed quadrado) e estilo (Moderno)
5. Clica em "Gerar Imagem"
6. Aguarda ~10-15 segundos com animacao de loading
7. Visualiza a imagem gerada em alta qualidade
8. Pode baixar a imagem ou gerar outra variacao
9. Imagens ficam salvas na galeria para uso futuro
