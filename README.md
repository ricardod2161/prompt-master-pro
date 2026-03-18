# 🍔 GastroHub - Sistema de Gestão para Restaurantes

<div align="center">

![GastroHub](https://img.shields.io/badge/GastroHub-Sistema%20de%20Gestão-orange?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ecf8e?style=for-the-badge&logo=supabase)

**Sistema completo de gestão para restaurantes, deliveries e food services**

[🚀 Demo](#demo) • [📖 Documentação](#documentação) • [⚙️ Instalação](#instalação) • [🎯 Funcionalidades](#funcionalidades)

</div>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Documentação](#-documentação)

---

## 🎯 Visão Geral

O **GastroHub** é um sistema de gestão completo para restaurantes, desenvolvido com as mais modernas tecnologias web. Oferece uma solução integrada para gerenciar pedidos, estoque, caixa, mesas, delivery, atendimento via WhatsApp e muito mais.

### ✨ Diferenciais

- 🤖 **IA Integrada** - Análise inteligente de logs e sugestões automáticas
- 📱 **100% Responsivo** - Funciona perfeitamente em qualquer dispositivo
- ⚡ **Real-time** - Atualizações instantâneas via WebSocket
- 🔔 **Notificações Automáticas** - Triggers inteligentes para alertas
- 🎨 **Personalizável** - Temas, cores e identidade visual customizáveis
- 🔐 **Seguro** - RLS (Row Level Security) em todas as tabelas

---

## 🚀 Funcionalidades

### 📦 Gestão de Pedidos
- Recebimento multicanal (balcão, mesa, delivery, WhatsApp)
- Acompanhamento em tempo real do status
- KDS (Kitchen Display System) para cozinha
- Impressão automática de comandas

### 🍽️ Gestão de Mesas
- Mapa visual das mesas
- QR Code para cardápio digital
- Status em tempo real

### 🚚 Delivery
- Gestão de entregadores
- Rastreamento de entregas
- Cálculo automático de taxas

### 💰 Caixa (PDV)
- Abertura/fechamento de caixa
- Múltiplas formas de pagamento
- Sangria e suprimentos

### 📊 Estoque
- Controle de itens
- Alertas de estoque baixo (automático)
- Movimentações registradas

### 💬 WhatsApp
- Integração com Evolution API
- Chat em tempo real
- Bot automático com IA

### 🔔 Sistema de Notificações
- Notificações em tempo real
- Triggers automáticos no banco de dados
- Central de notificações com filtros

### 🤖 IA para Logs
- Análise inteligente de erros
- Identificação de padrões
- Sugestões de correção

### ⚙️ Configurações
- Upload de logo da unidade
- Horários de funcionamento
- Taxas e métodos de pagamento
- Personalização de cores e temas

---

## 🛠️ Tecnologias

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| React | 18.3 | Biblioteca UI |
| TypeScript | 5.0+ | Tipagem estática |
| Vite | 5.0+ | Build tool |
| Tailwind CSS | 3.4 | Estilização |
| shadcn/ui | latest | Componentes UI |
| TanStack Query | 5.0 | Gerenciamento de estado |
| React Router | 6.30 | Roteamento |

### Backend (Supabase)
| Tecnologia | Descrição |
|------------|-----------|
| PostgreSQL | Banco de dados |
| Edge Functions | Funções serverless (Deno) |
| Realtime | WebSocket subscriptions |
| Storage | Armazenamento de arquivos |

---

## 📥 Instalação

### Pré-requisitos

- Node.js 18+ ou Bun
- Conta no Lovable (https://lovable.dev)

### Passo a Passo

#### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/gastrohub.git
cd gastrohub
```

#### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas credenciais do Supabase
```

#### 3. Instale as dependências
```bash
npm install
# ou
bun install
```

#### 4. Inicie o servidor de desenvolvimento
```bash
npm run dev
# ou
bun dev
```

#### 5. Acesse o sistema
Abra [http://localhost:5173](http://localhost:5173) no navegador.

---

## 📁 Estrutura do Projeto

```
gastrohub/
├── public/                    # Arquivos estáticos
├── src/
│   ├── components/
│   │   ├── ui/               # Componentes base (shadcn)
│   │   ├── admin/            # Componentes administrativos
│   │   ├── settings/         # Configurações modulares
│   │   ├── notifications/    # Sistema de notificações
│   │   ├── whatsapp/         # Chat WhatsApp
│   │   └── layout/           # Layout (Sidebar, Header)
│   ├── contexts/             # Contextos React
│   ├── hooks/                # Hooks customizados
│   ├── integrations/         # Integrações (Supabase)
│   ├── pages/                # Páginas da aplicação
│   └── lib/                  # Utilitários
├── supabase/
│   ├── functions/            # Edge Functions
│   └── config.toml           # Configuração
├── docs/                     # Documentação
└── README.md
```

---

## 📖 Documentação

Para documentação detalhada, consulte:

- 📚 [Documentação Técnica](docs/TECHNICAL.md) - Arquitetura, padrões e APIs
- 🚀 [Guia de Início Rápido](docs/QUICKSTART.md) - Como começar a usar

---

## 🚀 Deploy

### Via Lovable

1. Clique em **Publish** no editor
2. Aguarde o build
3. Acesse a URL gerada

### Domínio Customizado

1. Vá em **Settings > Domains**
2. Adicione seu domínio
3. Configure o DNS conforme instruções

---

## 📄 Licença

MIT License — Copyright (c) 2026 **Paulo Ricardo Dantas de Lima**

Consulte o arquivo [LICENSE](./LICENSE) para os termos completos.

---

<div align="center">

**Desenvolvido com ❤️ usando [Lovable](https://lovable.dev)**

</div>
