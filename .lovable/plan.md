
# Landing Page Profissional para RestaurantOS

## Visao Geral

Sera criada uma landing page completa e profissional que apresenta o sistema RestaurantOS de forma elegante, utilizando o design system 3D com glassmorphismo ja existente, animacoes fluidas e layout totalmente responsivo.

---

## Estrutura da Landing Page

A pagina sera dividida nas seguintes secoes:

### 1. Hero Section
- Headline impactante com gradiente
- Subtitulo explicativo
- Botoes CTA (Comecar Gratis / Ver Demo)
- Animacao de fundo com blobs flutuantes
- Badge "Sistema #1 para Restaurantes"
- Preview do dashboard em mockup 3D

### 2. Logos de Parceiros/Clientes
- Barra com logos de restaurantes parceiros
- Animacao de scroll infinito
- "Mais de X restaurantes confiam no RestaurantOS"

### 3. Features Principais
- Grid responsivo com cards 3D
- Icones animados
- 6 features principais:
  - Gestao de Pedidos Multicanal
  - KDS (Kitchen Display)
  - PDV Completo
  - Controle de Estoque
  - Integracao WhatsApp
  - Analise com IA

### 4. Como Funciona
- Timeline visual em 3 passos
- Ilustracoes para cada etapa
- Animacoes de entrada sequenciais

### 5. Diferenciais
- Cards comparativos
- Numeros/estatisticas
- "Por que escolher o RestaurantOS"

### 6. Depoimentos
- Carousel de testimonials
- Foto, nome, cargo e restaurante
- Estrelas de avaliacao

### 7. Preview de Precos
- Cards de planos resumidos
- Link para pagina completa de pricing
- Badge "Teste gratis por 14 dias"

### 8. FAQ Resumido
- Accordions com perguntas frequentes
- 5-6 perguntas principais

### 9. CTA Final
- Secao de conversao
- Formulario simples ou botao grande
- Garantias (sem cartao, cancele quando quiser)

### 10. Footer
- Links de navegacao
- Redes sociais
- Informacoes de contato
- Copyright

---

## Arquivos a Criar

### 1. `src/pages/Landing.tsx`

Pagina principal da landing com todas as secoes, incluindo:
- Hero com animacoes
- Navegacao fixa no topo
- Todas as secoes listadas acima
- Responsividade completa

### 2. `src/components/landing/HeroSection.tsx`

Secao hero com:
- Headline animado
- Botoes CTA
- Background animado
- Preview do sistema

### 3. `src/components/landing/FeaturesSection.tsx`

Grid de features com:
- Cards 3D com hover
- Icones de cada modulo
- Descricoes curtas

### 4. `src/components/landing/HowItWorks.tsx`

Timeline visual:
- 3 etapas simples
- Animacoes staggered
- Ilustracoes

### 5. `src/components/landing/TestimonialsSection.tsx`

Carousel de depoimentos:
- Cards glassmorphism
- Navegacao por dots
- Auto-play

### 6. `src/components/landing/LandingNavbar.tsx`

Navegacao fixa:
- Logo
- Links de ancoras
- Botao Login/Comecar

### 7. `src/components/landing/LandingFooter.tsx`

Footer completo:
- Logo e descricao
- Links organizados
- Redes sociais

---

## Arquivos a Modificar

### 1. `src/App.tsx`

Atualizar rotas:
- Rota "/" apontando para Landing
- Rota "/login" para pagina de Login
- Manter demais rotas

---

## Design Visual

### Cores e Gradientes

```text
Hero Background:
- Gradiente principal: from-background via-background to-primary/5
- Blobs animados com primary/20 e primary/10

Cards:
- Background glassmorphism
- Borda sutil com border-border/50
- Sombras 3D em hover
```

### Animacoes

- `animate-float` - Elementos flutuantes
- `animate-fade-in-up` - Entrada de secoes
- `animate-stagger-*` - Delays sequenciais
- `card-hover-lift` - Hover em cards
- Scroll reveal para secoes

### Responsividade

```text
Mobile (< 768px):
- Hero com texto centralizado
- Cards em coluna unica
- Menu hamburger
- Footer simplificado

Tablet (768px - 1024px):
- Grid de 2 colunas
- Espacamentos ajustados

Desktop (> 1024px):
- Layout completo
- Grid de 3 colunas
- Animacoes completas
```

---

## Conteudo das Secoes

### Hero
```text
Titulo: "Transforme seu Restaurante com Tecnologia Inteligente"
Subtitulo: "Sistema completo de gestao que integra pedidos, cozinha, 
           estoque e delivery em uma unica plataforma poderosa"
CTA Primario: "Comecar Gratuitamente"
CTA Secundario: "Ver Demonstracao"
```

### Features
```text
1. Pedidos Multicanal
   "Receba pedidos do balcao, mesas, delivery e WhatsApp em um so lugar"

2. KDS Inteligente
   "Tela da cozinha com filas organizadas e alertas sonoros"

3. PDV Completo
   "Caixa com multiplas formas de pagamento e controle de sangria"

4. Estoque Automatico
   "Alertas de estoque baixo e rastreamento de movimentacoes"

5. WhatsApp Integrado
   "Chat em tempo real e bot automatico para pedidos"

6. IA para Analise
   "Identificacao automatica de problemas e sugestoes de correcao"
```

### Como Funciona
```text
Passo 1: Cadastre seu Restaurante
"Configure sua unidade em minutos com dados basicos"

Passo 2: Adicione seus Produtos
"Importe ou cadastre seu cardapio completo"

Passo 3: Comece a Vender
"Receba pedidos e gerencie tudo em tempo real"
```

### Numeros
```text
- "+500 restaurantes ativos"
- "+1 milhao de pedidos processados"
- "99.9% de uptime"
- "Suporte em portugues"
```

---

## Beneficios

1. **Primeira Impressao**: Landing profissional gera credibilidade
2. **Conversao**: CTAs estrategicos aumentam cadastros
3. **Informacao**: Usuario entende o produto antes de entrar
4. **SEO**: Pagina otimizada para buscadores
5. **Responsividade**: Funciona em qualquer dispositivo

---

## Proximos Passos

1. Criar componentes de Landing (Navbar, Hero, Features, etc)
2. Criar pagina Landing.tsx principal
3. Atualizar rotas no App.tsx
4. Testar responsividade em todos dispositivos
5. Verificar animacoes e performance
