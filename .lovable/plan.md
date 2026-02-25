

# Correção do Meta Pixel e Build Error

## Diagnóstico

Encontrei **3 problemas**:

### 1. Build Error (CRÍTICO)
O arquivo `InteractiveDemoSection.tsx` importa `trackPixelCustomEvent` que **não existe** no módulo `usePixelTracking.ts`. Só existe `trackPixelEvent`. Isso quebra o build inteiro.

### 2. Pixel duplicado no `index.html`
O pixel `658470382629329` já está corretamente instalado no `index.html` (linhas 40-51) com:
- `fbq('init', '658470382629329')` 
- `fbq('track', 'PageView')`
- Tag `<noscript>` para fallback

### 3. `loadFacebookPixel` nunca é chamado
A função `loadFacebookPixel` existe no `usePixelTracking.ts` mas **nenhum componente a chama**. Isso não é problema porque o pixel já é carregado diretamente no `index.html`. Porém, a função fica sem uso.

### 4. Eventos de rastreamento - OK
Os eventos `trackPixelEvent` estão corretamente implementados em:
- **HeroSection**: `StartTrial` no CTA
- **CTASection**: `StartTrial` + `Lead` 
- **FloatingWhatsApp**: `Contact`
- **PricingPreview**: `ViewContent` via intersection observer
- **ContactFormSection**: `Lead`
- **Dashboard**: `ViewContent` no login

---

## Correções

### 1. Corrigir build error no `InteractiveDemoSection.tsx`
Remover a importação inexistente `trackPixelCustomEvent` — o arquivo já usa `trackPixelEvent` corretamente na linha 357.

### 2. Adicionar evento `Contact` padrão ao `trackPixelEvent`
Adicionar "Contact" à lista de eventos padrão do Facebook no hook, pois atualmente ele é disparado como evento customizado mas deveria ser padrão.

### 3. Manter pixel no `index.html`
O pixel `658470382629329` já está corretamente instalado. Nenhuma alteração necessária no HTML.

---

## Arquivos modificados

| Arquivo | Ação |
|---------|------|
| `src/components/landing/InteractiveDemoSection.tsx` | Remover import inexistente `trackPixelCustomEvent` |
| `src/hooks/usePixelTracking.ts` | Adicionar "Contact" aos eventos padrão |

## Resultado esperado

- Build passa sem erros
- Pixel `658470382629329` funciona corretamente em todas as páginas
- Eventos padrão do Facebook (`PageView`, `Lead`, `StartTrial`, `Contact`, `ViewContent`) são rastreados corretamente para criação de campanhas

