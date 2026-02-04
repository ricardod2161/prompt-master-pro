
# Plano: Criar Logotipo Profissional para RestaurantOS

## Objetivo
Criar uma logotipo única, futurista, elegante e profissional para o RestaurantOS, utilizando IA para geração e integrando em todo o sistema.

## Conceito da Logo

### Direção Visual
- **Estilo**: Minimalista e futurista com toques de elegância
- **Conceito**: Fusão de tecnologia (hexágono/circuito) com gastronomia (talheres/chef estilizado)
- **Cores**: Gradiente do tema primário atual com acentos metálicos
- **Formato**: Ícone quadrado/circular para versatilidade

### Prompt para Geração
"Modern minimalist restaurant technology logo, hexagonal shape with abstract fork and knife forming a subtle circuit pattern, gradient from orange to amber, clean geometric lines, futuristic professional style, flat design, no text, transparent background, high resolution"

---

## Implementação Técnica

### 1. Edge Function para Gerar Logo
Criar uma função que usa o Lovable AI (google/gemini-3-pro-image-preview) para gerar a imagem da logo.

**Arquivo**: `supabase/functions/generate-logo/index.ts`

### 2. Componente de Logo Reutilizável
Criar um componente `Logo.tsx` que:
- Exibe a logo em diferentes tamanhos (sm, md, lg, xl)
- Suporta modo claro/escuro
- Tem fallback para ícone se imagem não carregar
- Inclui animações sutis de hover

**Arquivo**: `src/components/brand/Logo.tsx`

### 3. Upload e Armazenamento
- Gerar a logo via IA
- Fazer upload para Supabase Storage (bucket público)
- Usar URL pública em todo o app

### 4. Integração nos Componentes

| Local | Arquivo | Mudança |
|-------|---------|---------|
| Landing Navbar | `LandingNavbar.tsx` | Substituir ChefHat pelo componente Logo |
| App Sidebar | `AppSidebar.tsx` | Substituir Utensils pelo componente Logo |
| Landing Footer | `LandingFooter.tsx` | Adicionar logo no footer |
| Favicon | `index.html` | Atualizar favicon |
| PWA Icons | `public/` | Atualizar pwa-512x512.png e apple-touch-icon.png |

---

## Arquivos a Criar/Modificar

### Novos Arquivos
1. `supabase/functions/generate-logo/index.ts` - Edge function para gerar logo
2. `src/components/brand/Logo.tsx` - Componente reutilizável
3. `src/components/brand/LogoGenerator.tsx` - Interface para gerar/regenerar logo

### Arquivos a Modificar
1. `src/components/landing/LandingNavbar.tsx` - Usar novo componente Logo
2. `src/components/layout/AppSidebar.tsx` - Usar novo componente Logo
3. `src/components/landing/LandingFooter.tsx` - Adicionar logo
4. `index.html` - Atualizar meta tags e favicon
5. `supabase/config.toml` - Registrar nova edge function

---

## Fluxo de Uso

```text
┌─────────────────────────────────────────────────────────────┐
│  1. Admin acessa Settings > Branding                        │
│  2. Clica em "Gerar Nova Logo"                              │
│  3. Edge function chama Lovable AI                          │
│  4. Imagem é gerada e salva no Storage                      │
│  5. Logo atualiza automaticamente em todo o app             │
└─────────────────────────────────────────────────────────────┘
```

---

## Variações da Logo

O componente suportará múltiplas variações:

| Variante | Uso | Tamanho |
|----------|-----|---------|
| `icon` | Favicon, sidebar compacta | 32-48px |
| `compact` | Navbar mobile | 40px |
| `standard` | Navbar desktop, cards | 48-64px |
| `full` | Hero, footer | 80-120px |

---

## Resultado Esperado

Após implementação:
- Logo única gerada por IA
- Consistência visual em todo o sistema
- Componente reutilizável para futuras necessidades
- Suporte a múltiplos tamanhos e contextos
- Possibilidade de regenerar a qualquer momento
