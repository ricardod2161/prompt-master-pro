
# 🍽️ RestaurantOS - Sistema de Gestão Multiunidade

## Visão Geral
Sistema SaaS completo para gestão de restaurantes com múltiplas unidades, integrando PDV, KDS, delivery, controle de estoque e atendimento automatizado via WhatsApp com IA.

---

## 🎨 Design System

**Tema:** Dark Mode Profissional
- Interface escura moderna otimizada para ambientes de cozinha e baixa luminosidade
- Cores de status bem definidas (verde para sucesso, amarelo para em preparo, vermelho para urgente)
- Tipografia legível em diferentes distâncias (importante para KDS)
- Componentes touch-friendly para tablets e telas sensíveis ao toque

---

## 📱 Módulos e Telas

### 1. Autenticação e Acesso
- **Login** (`/`) - Autenticação com email/senha
- **Seleção de Unidade** (`/select-unit`) - Escolha da unidade ativa com visual de cards
- **Gestão de Usuários** (`/settings/users`) - Controle de acesso por perfil (admin, caixa, cozinha, garçom)

### 2. Dashboard Executivo (`/dashboard`)
- Cards de KPIs: faturamento, ticket médio, pedidos do dia
- Gráfico de vendas por canal (WhatsApp, Mesa, Balcão, Delivery)
- Lista de pedidos recentes com status visual
- Comparativo com período anterior

### 3. PDV - Ponto de Venda (`/pos`)
- Busca inteligente de produtos
- Grade visual de produtos por categoria
- Carrinho com ajuste de quantidade e observações
- Seleção de mesa ou cliente
- Múltiplas formas de pagamento
- **Integração com impressora térmica** para cupom

### 4. KDS - Kitchen Display System (`/kds`)
- Visualização em colunas: Pendente → Em Preparo → Pronto
- Temporizador visual por pedido
- Alertas de pedidos atrasados
- Som de notificação para novos pedidos
- Interface otimizada para touch em tela grande

### 5. Gestão de Pedidos (`/orders`)
- Tabela completa com filtros por status, canal e período
- Modal de detalhes com timeline do pedido
- Atualização em tempo real via websockets
- Histórico completo de alterações

### 6. Cardápio Digital (`/menu`)
- CRUD de produtos com imagem, preço e disponibilidade
- Gestão de categorias com ordenação
- Adicionais e complementos por produto
- Preços diferenciados por canal (delivery vs presencial)
- Horários de disponibilidade por produto

### 7. Gestão de Estoque (`/inventory`) ✨ **Nova funcionalidade**
- Cadastro de insumos com unidade de medida
- Fichas técnicas vinculando produtos aos insumos
- Baixa automática de estoque por venda
- Alertas de estoque mínimo
- Relatório de movimentação

### 8. WhatsApp + IA (`/whatsapp/settings`)
- Conexão via Evolution API com QR Code
- System prompt customizável para comportamento da IA
- Toggle de ativação do bot
- Visualização de conversas e intervenção manual
- Configuração de mensagens automáticas

### 9. Delivery (`/delivery`)
- Lista de pedidos aguardando despacho
- Cadastro de entregadores
- Atribuição de pedido a motoboy
- Mapa com localização aproximada dos pedidos
- Rastreamento de status da entrega

### 10. Mesas e QR Codes (`/tables`)
- Mapa visual das mesas do restaurante
- Status em tempo real: livre, ocupada, pedido pendente
- Geração de QR Code único por mesa
- Exportação em PDF para impressão

### 11. Controle de Caixa (`/cashier`)
- Abertura de caixa com valor inicial
- Registro de sangrias e suprimentos
- Fechamento com conferência de valores
- Histórico de movimentações
- Relatório de discrepâncias

### 12. Relatórios (`/reports`)
- Filtros por período e categoria
- Ranking de produtos mais vendidos
- Análise de faturamento por canal
- Relatório de estoque
- Exportação em Excel e PDF

### 13. Configurações (`/settings`)
- Dados da unidade (nome, endereço, CNPJ)
- Configuração de impressoras
- Formas de pagamento aceitas
- Integrações externas

---

## 🗄️ Estrutura do Banco de Dados (Melhorado)

### Tabelas Principais:
- **units** - Unidades do restaurante
- **profiles** - Perfis de usuários com roles e permissões
- **user_units** - Associação usuário-unidade

### Cardápio:
- **categories** - Categorias de produtos
- **products** - Produtos do cardápio
- **product_addons** - Adicionais dos produtos

### Pedidos:
- **orders** - Pedidos com status, canal e timestamps
- **order_items** - Itens com status de cozinha
- **order_payments** - Pagamentos por pedido

### Estoque:
- **inventory_items** - Cadastro de insumos
- **product_ingredients** - Ficha técnica (produto → insumos)
- **inventory_movements** - Movimentações de estoque

### Operacional:
- **tables** - Mesas do restaurante
- **cash_registers** - Caixas diários
- **cash_movements** - Movimentações de caixa

### Delivery:
- **delivery_drivers** - Entregadores
- **delivery_orders** - Entregas com rastreamento

### WhatsApp:
- **whatsapp_settings** - Configurações por unidade
- **whatsapp_conversations** - Histórico de conversas

---

## 🔧 Integrações

1. **Supabase** - Backend completo com realtime
2. **Evolution API** - WhatsApp Business self-hosted
3. **Lovable AI** - Processamento de linguagem natural para o chatbot
4. **Impressão Térmica** - Via API de impressão local

---

## 📋 Fases de Implementação

### Fase 1 - Core
- Autenticação e seleção de unidade
- Dashboard básico
- CRUD de cardápio
- Estrutura do banco de dados

### Fase 2 - Vendas
- PDV completo
- KDS em tempo real
- Gestão de pedidos
- Controle de caixa

### Fase 3 - Delivery & Mesas
- Gestão de delivery
- QR Codes de mesas
- Mapa de entregas

### Fase 4 - Automação
- Integração WhatsApp
- Chatbot com IA
- Estoque automatizado

### Fase 5 - Analytics
- Relatórios avançados
- Exportações
- Dashboard executivo completo
