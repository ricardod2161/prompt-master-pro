

# Implementação de ViewContent Tracking ao Scroll para Seção de Preços

## Status Atual do Meta Pixel
✅ **Meta Pixel está corretamente configurado:**
- ID `1615900189547750` está implementado em `index.html` (linha 49 e 56)
- Script do Facebook Pixel está carregando corretamente
- Hook `usePixelTracking.ts` com funções `trackPixelEvent()` e `trackPixelCustomEvent()` está pronto
- Eventos já implementados: Lead, Contact, StartTrial

## Objetivo
Adicionar tracking automático de evento `ViewContent` quando o usuário faz scroll e visualiza a seção de preços (`#pricing`).

## Implementação

### 1. Criar Hook de Scroll Detection (`useIntersectionObserver.ts`)
Novo hook reutilizável que usa a **Intersection Observer API** para detectar quando um elemento entra no viewport:
- Parâmetros: `ref`, `threshold` (padrão 0.1), `onIntersect` callback
- Retorna: boolean indicando se o elemento é visível
- Benefício: Melhor performance que scroll listener tradicional, sem jank

### 2. Atualizar `PricingPreview.tsx`
- Adicionar `useRef` para a seção `<section id="pricing">`
- Usar o novo hook `useIntersectionObserver` com callback que chama `trackPixelEvent('ViewContent')`
- Implementar flag de rastreamento único (evitar disparar múltiplas vezes)
- Incluir parâmetros opcionais: `content_name: 'pricing_section'`, `content_type: 'pricing'`

### 3. Estrutura do Fluxo
```
Usuário faz scroll down na landing page
    ↓
Seção de preços entra no viewport (50% visível)
    ↓
Intersection Observer dispara callback
    ↓
trackPixelEvent('ViewContent', { 
    content_name: 'pricing_section',
    content_type: 'pricing'
})
    ↓
Meta Pixel registra evento e associa a sessão
```

## Benefícios
- **Rastreamento automático**: Sem necessidade de clique manual
- **Dados de comportamento**: Saber quantos usuários visualizaram preços
- **Otimização de anúncios**: Usar como evento de conversão no Facebook Ads
- **Performance**: Intersection Observer é mais eficiente que scroll listeners
- **Único disparo**: Evita múltiplos eventos para a mesma visualização

## Próximas Melhorias Sugeridas
- Implementar mesmo tracking em outras seções chave (Features, Testimonials, FAQ)
- Adicionar eventos com valor de "interest level" (quanto % da página foi visto)
- Trackear cliques nos planos específicos (Starter, Pro, Enterprise) com metadata

