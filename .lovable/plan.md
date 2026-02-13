
# Implementação do Meta Pixel e Estratégia de Tracking

## Análise Atual
- Meta Pixel está configurado no `index.html` com placeholders `SEU_PIXEL_ID_AQUI` (linhas 49 e 56)
- Seu ID real: **1615900189547750**
- Landing page possui múltiplos componentes de marketing que poderiam gerar eventos rastreáveis
- Formulário de contato e CTAs já existem mas sem tracking específico

## Plano de Implementação

### 1. Substituir ID no Meta Pixel (index.html)
- Linha 49: `fbq('init', 'SEU_PIXEL_ID_AQUI')` → `fbq('init', '1615900189547750')`
- Linha 56: `src="https://www.facebook.com/tr?id=SEU_PIXEL_ID_AQUI&ev=PageView&noscript=1"` → `src="https://www.facebook.com/tr?id=1615900189547750&ev=PageView&noscript=1"`

### 2. Criar Hook Utilitário para Rastreamento (usePixelTracking.ts)
Hook que abstrair a chamada ao `fbq` globalmente para:
- Rastrear eventos padrão do Facebook (PageView já rastreado automaticamente)
- Implementar conversão quando leads são capturados
- Rastrear interações com CTAs principais
- Executar com segurança (check se fbq existe)

### 3. Instrumentar Eventos-Chave
Eventos a rastrear na landing page:

| Evento | Quando | Função Facebook |
|--------|--------|-----------------|
| Lead Form Submit | Formulário de contato submetido | `fbq('track', 'Lead')` |
| Start Trial | Clique em "Começar Teste Grátis" | `fbq('track', 'StartTrial')` |
| Pricing View | Scroll até seção de preços | `fbq('track', 'ViewContent')` |
| WhatsApp Contact | Clique no WhatsApp flutuante | `fbq('track', 'Contact')` |
| Demo Interaction | Clique no "Simular" da seção interativa | Custom event |

### 4. Adicionar ViewContent nos Componentes
- **HeroSection.tsx**: Adicionar ao clique dos botões de CTA principal
- **CTASection.tsx**: Adicionar ao clique "Começar Agora"
- **ContactFormSection.tsx**: Adicionar evento `Lead` ao submit bem-sucedido
- **InteractiveDemoSection.tsx**: Adicionar evento `Lead` ao testar demo
- **FloatingWhatsApp.tsx**: Adicionar evento `Contact` ao clique

### 5. Estrutura de Arquivos
```
src/hooks/usePixelTracking.ts (NOVO)
  └─ Exporta função trackEvent() e hooks específicos
     - useTrackPageView()
     - useTrackLead()
     - useTrackConversion()
```

### 6. Benefícios
- ✅ Rastreamento de leads capturados (formulário de contato)
- ✅ Rastreamento de engajamento (cliques em CTAs)
- ✅ Dados para otimizar campanhas no Facebook Ads
- ✅ Remarketing mais eficiente
- ✅ Medição de ROI de campanhas

### Sequência de Implementação
1. Substituir ID real no `index.html`
2. Criar hook `usePixelTracking.ts` com utilitários
3. Instrumentar componentes de landing (ContactFormSection, CTASection, etc)
4. Testar eventos no Facebook Pixel Debugger

