

# Implementar Meta Pixel, Botao de Compartilhar e Otimizar Open Graph

## O que sera feito

### 1. Otimizar Meta Tags Open Graph para Facebook
As meta tags atuais estao incompletas -- faltam `og:image` e `twitter:image`, e a URL esta desatualizada. Vamos corrigir:
- Adicionar `og:image` e `twitter:image` apontando para o logo
- Corrigir `og:url` para a URL publicada correta (`restauranteos.lovable.app`)
- Adicionar `og:site_name`

### 2. Instalar Meta Pixel (Facebook Pixel)
O Meta Pixel e um codigo de rastreamento que permite medir conversoes dos anuncios do Facebook.
- Adicionar o script do Meta Pixel no `index.html`
- **Voce precisara fornecer o ID do seu Pixel** (encontrado no Meta Business Suite > Gerenciador de Eventos)
- Se ainda nao tiver o ID, instalaremos com um placeholder que voce substitui depois

### 3. Adicionar Botao "Compartilhar no Facebook" na Landing Page
- Adicionar um botao de compartilhar na secao CTA da landing page
- Ao clicar, abre a janela de compartilhamento do Facebook com o link do RestaurantOS

## Resumo dos Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| `index.html` | Corrigir Open Graph, adicionar og:image, instalar Meta Pixel |
| `src/components/landing/CTASection.tsx` | Adicionar botao "Compartilhar no Facebook" |

---

### Detalhes Tecnicos

**Open Graph (`index.html`)**:
- Corrigir `og:url` de `polished-prompt-guru.lovable.app` para `restauranteos.lovable.app`
- Adicionar `<meta property="og:image">` e `<meta name="twitter:image">` com URL absoluta do logo
- Adicionar `<meta property="og:site_name" content="RestaurantOS">`

**Meta Pixel (`index.html`)**:
- Inserir script padrao do Facebook Pixel no `<head>` com `fbq('init', 'SEU_PIXEL_ID')` e `fbq('track', 'PageView')`
- O ID do Pixel sera solicitado via secret ou placeholder

**Botao Compartilhar (`CTASection.tsx`)**:
- Adicionar botao com icone do Facebook usando `lucide-react`
- Usar `window.open()` com URL `https://www.facebook.com/sharer/sharer.php?u=URL`

