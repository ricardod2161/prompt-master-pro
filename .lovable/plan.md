
# Documentacao Completa do Sistema na Pagina de Configuracoes

## Visao Geral

Sera criada uma nova aba "Documentacao" na pagina de Configuracoes contendo toda a documentacao do sistema de forma interativa, organizada e profissional, permitindo que os usuarios acessem guias, tutoriais e informacoes tecnicas diretamente da interface.

---

## Estrutura da Documentacao

A documentacao sera dividida em secoes acessiveis por acordeoes (accordions) para facilitar a navegacao:

### 1. Introducao ao Sistema
- O que e o GastroHub
- Principais funcionalidades
- Diferenciais do sistema

### 2. Guia de Inicio Rapido
- Primeiro acesso
- Criando sua conta
- Configurando sua unidade
- Upload de logo

### 3. Modulos do Sistema

#### 3.1 Gestao de Pedidos
- Canais de recebimento (balcao, mesa, delivery, WhatsApp)
- Fluxo de status dos pedidos
- Acompanhamento em tempo real

#### 3.2 KDS (Kitchen Display System)
- Como funciona a tela da cozinha
- Gerenciamento de filas
- Alertas sonoros

#### 3.3 Caixa (PDV)
- Abrindo e fechando o caixa
- Formas de pagamento
- Sangria e suprimentos
- Relatorios de caixa

#### 3.4 Gestao de Mesas
- Mapa visual
- QR Code para cardapio
- Status das mesas

#### 3.5 Delivery
- Cadastro de entregadores
- Despacho de pedidos
- Taxas de entrega

#### 3.6 Estoque
- Cadastro de itens
- Movimentacoes
- Alertas automaticos de estoque baixo

#### 3.7 WhatsApp
- Configuracao da Evolution API
- Chat em tempo real
- Bot automatico

### 4. Configuracoes do Sistema
- Dados da unidade
- Configuracoes operacionais
- Configuracoes financeiras
- Horarios de funcionamento
- Personalizacao de aparencia

### 5. Sistema de Notificacoes
- Como funcionam as notificacoes automaticas
- Tipos de alertas
- Central de notificacoes

### 6. Analise com IA
- Analise de logs
- Identificacao de problemas
- Sugestoes de correcao

### 7. Instalacao e Deploy
- Pre-requisitos
- Passo a passo de instalacao
- Deploy via Lovable
- Configuracao de dominio customizado

### 8. FAQ e Solucao de Problemas
- Perguntas frequentes
- Erros comuns e solucoes
- Contato de suporte

---

## Arquivos a Criar

### 1. `src/components/settings/DocumentationTab.tsx`

Novo componente com a documentacao completa contendo:
- Interface com accordions expansiveis
- Icones ilustrativos para cada secao
- Codigo de exemplo quando necessario
- Links de navegacao rapida
- Cards informativos com dicas
- Barra de busca para filtrar conteudo
- Botao de copiar codigo

### 2. `src/components/settings/DocSection.tsx`

Componente auxiliar para secoes de documentacao com:
- Icone da secao
- Titulo e descricao
- Conteudo expansivel
- Estilizacao consistente

### 3. `src/components/settings/CodeBlock.tsx`

Componente para exibir blocos de codigo com:
- Syntax highlighting basico
- Botao de copiar
- Label do tipo de codigo

---

## Arquivos a Modificar

### 1. `src/pages/Settings.tsx`

Adicionar nova aba "Documentacao" ao TAB_ITEMS:
```typescript
const TAB_ITEMS = [
  { value: "unit", label: "Unidade", icon: Building2 },
  { value: "operational", label: "Operacional", icon: Cog },
  { value: "financial", label: "Financeiro", icon: DollarSign },
  { value: "hours", label: "Horários", icon: Clock },
  { value: "profile", label: "Perfil", icon: User },
  { value: "appearance", label: "Aparência", icon: Palette },
  { value: "docs", label: "Ajuda", icon: BookOpen }, // Nova aba
];
```

Adicionar novo TabsContent para DocumentationTab.

---

## Design da Interface

### Layout Principal

```text
+--------------------------------------------------+
|  [Icone] Documentacao & Ajuda                     |
|  Guias completos de uso do sistema                |
+--------------------------------------------------+
|                                                   |
|  [Buscar na documentacao...]              [Busca] |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  [v] Introducao ao Sistema                        |
|      +----------------------------------------+   |
|      | O GastroHub e um sistema completo...   |   |
|      +----------------------------------------+   |
|                                                   |
|  [>] Guia de Inicio Rapido                        |
|                                                   |
|  [>] Gestao de Pedidos                            |
|                                                   |
|  [>] KDS - Tela da Cozinha                        |
|                                                   |
|  [>] Caixa (PDV)                                  |
|                                                   |
|  [>] Gestao de Mesas                              |
|                                                   |
|  [>] Delivery                                     |
|                                                   |
|  [>] Estoque                                      |
|                                                   |
|  [>] Integracao WhatsApp                          |
|                                                   |
|  [>] Configuracoes                                |
|                                                   |
|  [>] Notificacoes Automaticas                     |
|                                                   |
|  [>] Analise com IA                               |
|                                                   |
|  [>] Instalacao e Deploy                          |
|                                                   |
|  [>] FAQ e Suporte                                |
|                                                   |
+--------------------------------------------------+
```

### Elementos de UI

- **Accordions**: Usados para cada secao principal
- **Cards informativos**: Dicas e alertas importantes
- **Blocos de codigo**: Para exemplos tecnicos
- **Badges**: Para indicar nivel (Basico, Intermediario, Avancado)
- **Links de navegacao**: Para pular entre secoes
- **Icones**: lucide-react para cada modulo

### Responsividade

- Mobile: Accordions em coluna unica, texto ajustado
- Tablet: Layout adaptado com margens adequadas
- Desktop: Layout completo com sidebar de navegacao rapida

---

## Conteudo Detalhado

### Introducao

```text
O GastroHub e um sistema de gestao completo para restaurantes, 
desenvolvido com tecnologias modernas como React, TypeScript e 
Supabase. Ele oferece uma solucao integrada para:

- Gerenciar pedidos de multiplos canais
- Controlar estoque com alertas automaticos
- Gerenciar caixa e pagamentos
- Integrar com WhatsApp para atendimento
- Analisar logs com inteligencia artificial
```

### Guia de Status dos Pedidos

```text
Fluxo de Status:
1. Pendente    -> Pedido recebido, aguardando preparo
2. Preparando  -> Cozinha iniciou o preparo
3. Pronto      -> Pedido finalizado, aguardando entrega/retirada
4. Entregue    -> Pedido entregue ao cliente
5. Cancelado   -> Pedido cancelado (em qualquer etapa)
```

### Instalacao

```bash
# 1. Clone o repositorio
git clone <URL_DO_REPOSITORIO>
cd gastrohub

# 2. Instale as dependencias
npm install
# ou com Bun
bun install

# 3. Configure as variaveis de ambiente
# O arquivo .env e gerado automaticamente pelo Lovable

# 4. Inicie o servidor de desenvolvimento
npm run dev
# ou
bun dev

# 5. Acesse no navegador
# http://localhost:5173
```

---

## Beneficios

1. **Acessibilidade**: Documentacao sempre disponivel na interface
2. **Contexto**: Usuario aprende sem sair do sistema
3. **Organizacao**: Informacoes estruturadas e navegaveis
4. **Busca**: Encontrar informacoes rapidamente
5. **Profissionalismo**: Sistema completo e bem documentado

---

## Proximos Passos

1. Criar componente `CodeBlock.tsx` para blocos de codigo
2. Criar componente `DocSection.tsx` para secoes
3. Criar componente `DocumentationTab.tsx` principal
4. Atualizar `Settings.tsx` com nova aba
5. Testar responsividade e navegacao
