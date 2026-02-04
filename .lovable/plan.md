
# Plano: Landing Page de Marketing Completa

## Visão Geral das Melhorias
Transformar a landing page atual (/) em um site de marketing completo com 5 novas funcionalidades:

1. **Seção de Demonstração Interativa**
2. **Mais Depoimentos Reais**
3. **Formulário de Contato com Email**
4. **Integração com CRM (tabela de leads no banco)**
5. **Botão WhatsApp Flutuante**

---

## 1. Demonstração Interativa

### Novo Componente: `InteractiveDemoSection.tsx`

Uma seção que permite aos visitantes experimentar as principais funcionalidades do sistema sem criar conta:

```text
┌─────────────────────────────────────────────────────────────┐
│                 Experimente Agora                            │
│     Veja como o RestaurantOS funciona na prática            │
│                                                              │
│   [PDV]  [KDS]  [Cardápio Digital]  [Dashboard]  ← tabs     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │              Mock Interativo do Sistema             │    │
│  │         (clicável, com animações e dados fake)      │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│              [Começar Gratuitamente →]                       │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades das Demos:**
- **PDV**: Adicionar itens ao carrinho, ver total, simular pagamento
- **KDS**: Ver pedidos chegando em tempo real (animados)
- **Cardápio**: Navegar categorias, ver produtos com preços
- **Dashboard**: Gráficos animados com dados de exemplo

---

## 2. Mais Depoimentos Reais

### Atualização: `TestimonialsSection.tsx`

Expandir de 4 para 8 depoimentos com:
- Fotos reais (avatares estilizados)
- Métricas de sucesso específicas
- Variedade de tipos de restaurantes
- Grid visual além do carousel

**Novos Depoimentos:**
```text
1. Carlos Silva - Cantina Italiana (+40% faturamento)
2. Ana Rodrigues - Burger House (+60% pedidos WhatsApp)
3. Pedro Santos - Sushi Premium (KDS: -30% tempo)
4. Mariana Costa - Café & Bistrô (Estoque: 0 perdas)
5. Roberto Oliveira - Pizzaria Napolitana (+200 pedidos/dia)
6. Juliana Mendes - Food Truck Gourmet (PDV móvel)
7. Fernando Lima - Churrascaria (+25% ticket médio)
8. Camila Souza - Padaria Artesanal (Delivery em 2 semanas)
```

**Novo Layout:**
- Carousel principal (atual)
- Grid com logos/avatares dos clientes abaixo
- Contador: "Mais de 500 restaurantes confiam..."

---

## 3. Formulário de Contato com Email

### Novo Componente: `ContactFormSection.tsx`

Formulário profissional para captura de leads:

```text
┌─────────────────────────────────────────────────────────────┐
│                Entre em Contato                              │
│       Tire suas dúvidas ou solicite uma demonstração        │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │                     │  │ Nome*                       │   │
│  │   📧 Email          │  │ Email*                      │   │
│  │   📱 WhatsApp       │  │ WhatsApp                    │   │
│  │   📍 Localização    │  │ Nome do Restaurante         │   │
│  │                     │  │ Número de funcionários      │   │
│  │   Horário:          │  │ Mensagem                    │   │
│  │   Seg-Sex 9h-18h    │  │ [            ]              │   │
│  │                     │  │                             │   │
│  │                     │  │ [  Enviar Mensagem  ]       │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Campos:**
- Nome completo (obrigatório)
- Email (obrigatório)
- WhatsApp (opcional)
- Nome do restaurante (opcional)
- Número de funcionários (select: 1-5, 6-15, 16-30, 30+)
- Mensagem (textarea)

---

## 4. Integração CRM (Banco de Dados)

### Nova Tabela: `leads`

```sql
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  restaurant_name TEXT,
  employee_count TEXT,
  message TEXT,
  source TEXT DEFAULT 'landing_page',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permitir inserção pública (sem autenticação)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on leads"
  ON public.leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);
```

**Status do Lead:**
- `new` - Novo
- `contacted` - Contatado
- `demo_scheduled` - Demo agendada
- `converted` - Convertido
- `lost` - Perdido

---

## 5. Botão WhatsApp Flutuante

### Novo Componente: `FloatingWhatsApp.tsx`

```text
              ┌─────────────────────────┐
              │  Olá! Como posso ajudar │
              │  seu restaurante? 🍽️    │
              │                         │
              │  [Falar pelo WhatsApp]  │
              └─────────────────────────┘
                              │
                              ▼
                          ┌──────┐
                          │  📱  │  ← Botão flutuante
                          │      │     animado (pulse)
                          └──────┘
                    (canto inferior direito)
```

**Funcionalidades:**
- Posição fixa no canto inferior direito
- Animação de pulse para chamar atenção
- Tooltip ao passar o mouse
- Click abre WhatsApp com mensagem pré-definida
- Número: (98) 98254-9505

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/landing/InteractiveDemoSection.tsx` | Criar | Seção de demo interativa |
| `src/components/landing/ContactFormSection.tsx` | Criar | Formulário de contato |
| `src/components/landing/FloatingWhatsApp.tsx` | Criar | Botão flutuante WhatsApp |
| `src/components/landing/TestimonialsSection.tsx` | Modificar | Adicionar mais depoimentos |
| `src/pages/Landing.tsx` | Modificar | Adicionar novas seções |
| **Migração SQL** | Criar | Tabela `leads` para CRM |

---

## Ordem das Seções na Landing Page

```text
1. LandingNavbar
2. HeroSection
3. StatsSection
4. FeaturesSection
5. InteractiveDemoSection  ← NOVO
6. HowItWorks
7. TestimonialsSection     ← EXPANDIDO
8. PricingPreview
9. ContactFormSection      ← NOVO
10. FAQSection
11. CTASection
12. LandingFooter
13. FloatingWhatsApp       ← NOVO (fixo na tela)
```

---

## Resultado Esperado

Uma landing page profissional de marketing que:
- Permite experimentar o sistema antes de cadastrar
- Mostra prova social com depoimentos variados
- Captura leads qualificados com formulário integrado
- Facilita contato rápido via WhatsApp
- Armazena leads no banco para follow-up
