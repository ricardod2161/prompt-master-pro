
# Plano: Melhorias Gerais - Sistema de Assinaturas e Navegacao

## 1. Configuracao do Stripe Customer Portal (Acao Manual)

Antes de tudo, voce precisa configurar o Customer Portal no dashboard do Stripe:

1. Acesse https://dashboard.stripe.com/settings/billing/portal
2. Configure as seguintes opcoes:
   - **Permitir cancelamento de assinaturas**: Ativar
   - **Permitir troca de planos**: Ativar e selecionar os 3 produtos criados (Starter, Pro, Enterprise)
   - **Permitir atualizacao de metodo de pagamento**: Ativar
   - **Historico de faturas**: Ativar
   - **Branding**: Adicionar logo e cores do RestaurantOS

---

## 2. Novo Componente: PageHeader com Botao Voltar

Criar um componente reutilizavel para todas as paginas com:

```text
PageHeader
├── Botao Voltar (condicional, com animacao hover)
├── Breadcrumbs (opcional)
├── Titulo da pagina (h1)
├── Subtitulo/descricao
├── Acoes do lado direito (botoes, badges)
└── Responsivo (mobile-first)
```

### Visual

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ← Voltar   Dashboard > Planos                                      │
│                                                                     │
│  Planos e Precos                              [Status] [Atualizar]  │
│  Escolha o plano ideal para seu restaurante                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Melhorias na Pagina de Pricing

### 3.1 Adicionar PageHeader
- Botao voltar para /dashboard (ou pagina anterior)
- Breadcrumbs: Dashboard > Planos

### 3.2 Design Profissional Aprimorado
- Container maximo responsivo
- Animacoes staggered nos cards
- Comparativo de features entre planos
- Indicador visual de economia anual (opcional futuro)

### 3.3 FAQ Melhorado
- Usar componente Accordion para FAQ
- Animacoes de abertura/fechamento
- Icones visuais nas perguntas

### 3.4 Secao CTA Final
- Garantia de satisfacao
- Suporte humanizado
- Link para contato

---

## 4. Melhorias nos Cards de Preco (PricingCard)

### 4.1 Visual 3D Aprimorado
- Adicionar icone por tier (Zap, Sparkles, Crown)
- Animacao de entrada staggered
- Hover effect mais pronunciado
- Transicoes suaves

### 4.2 Estados Visuais
- Loading skeleton durante carregamento
- Disabled state para planos inacessiveis
- Animacao de confirmacao ao clicar

### 4.3 Melhorar Responsividade
- Stack vertical em mobile
- Cards menores em tablet
- Layout grid em desktop

---

## 5. Melhorias na Pagina de Sucesso

### 5.1 Adicionar PageHeader
- Botao voltar para /pricing

### 5.2 Animacoes de Celebracao
- Confetti animation (opcional)
- Icone pulsante de sucesso
- Entrada suave dos elementos

### 5.3 Informacoes Completas
- Resumo do plano adquirido
- Proximos passos
- Links uteis (dashboard, suporte)

---

## 6. Melhorias no AppLayout

### 6.1 Header Aprimorado
- Adicionar titulo da pagina atual
- Botao voltar contextual
- Breadcrumbs navegaveis

### 6.2 Mobile-First
- Menu hamburguer otimizado
- Gestos de swipe
- Safe areas para iOS

---

## 7. Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/shared/PageHeader.tsx` | Criar | Header reutilizavel com back button |
| `src/components/shared/Breadcrumbs.tsx` | Criar | Navegacao por breadcrumbs |
| `src/pages/Pricing.tsx` | Modificar | Adicionar PageHeader, melhorar layout |
| `src/pages/SubscriptionSuccess.tsx` | Modificar | Adicionar PageHeader, melhorar UX |
| `src/components/subscription/PricingCard.tsx` | Modificar | Icones, animacoes, responsividade |
| `src/components/layout/AppLayout.tsx` | Modificar | Header com navegacao |
| `src/index.css` | Modificar | Novas animacoes e utilitarios |

---

## 8. Novas Classes CSS

```css
/* Animacoes staggered */
.animate-stagger-1 { animation-delay: 0.1s; }
.animate-stagger-2 { animation-delay: 0.2s; }
.animate-stagger-3 { animation-delay: 0.3s; }

/* Fade in up */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
}

/* Botao voltar hover */
.back-button:hover {
  transform: translateX(-4px);
}
```

---

## 9. Componente PageHeader - Especificacao

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backTo?: string; // URL ou -1 para history.back()
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}
```

### Exemplo de Uso

```tsx
<PageHeader
  title="Planos e Precos"
  description="Escolha o plano ideal para seu restaurante"
  showBackButton
  backTo="/dashboard"
  breadcrumbs={[
    { label: "Dashboard", href: "/dashboard" },
    { label: "Planos" }
  ]}
  badge={<SubscriptionBadge tier={subscription.tier} />}
  actions={
    <Button onClick={checkSubscription}>
      <RefreshCw /> Atualizar
    </Button>
  }
/>
```

---

## 10. Melhorias de Responsividade

### Mobile (< 640px)
- Cards em coluna unica
- Botoes full-width
- Font sizes reduzidos
- Padding compacto

### Tablet (640px - 1024px)
- Grid de 2 colunas
- Cards side-by-side
- Header compacto

### Desktop (> 1024px)
- Grid de 3 colunas
- Layout espalhado
- Hover effects completos

---

## 11. Ordem de Implementacao

1. Criar CSS utilities e animacoes
2. Criar componente PageHeader
3. Criar componente Breadcrumbs
4. Atualizar PricingCard com melhorias visuais
5. Atualizar pagina Pricing com PageHeader e layout
6. Atualizar pagina SubscriptionSuccess
7. Atualizar AppLayout com header melhorado
8. Testar responsividade em todos os breakpoints

---

## 12. Resultado Esperado

| Area | Melhoria |
|------|----------|
| Navegacao | Botao voltar consistente em todas as paginas |
| Visual | Cards 3D com animacoes profissionais |
| UX | Feedback visual em todas as acoes |
| Mobile | Layout responsivo otimizado |
| Acessibilidade | Aria labels, focus states, keyboard nav |
| Performance | Animacoes via CSS (GPU accelerated) |
