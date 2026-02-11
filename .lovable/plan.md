

# Melhorias no Super Admin, Mesas e Seguranca

## 1. Nova Aba "Clientes" no Super Admin

Adicionar uma quinta aba no painel Super Admin chamada "Clientes" que exibe todos os usuarios do sistema com foco em informacoes de assinatura.

### O que sera exibido:
- Lista de todos os usuarios com nome, email (via user_id), data de cadastro
- Unidades associadas a cada usuario
- Status da assinatura (ativo, trial, expirado, sem plano) -- consultando via edge function check-subscription
- Plano atual (Starter, Pro, Enterprise)
- Cards de resumo no topo: Total de clientes, Clientes ativos, Em trial, Sem plano
- Filtros por status de assinatura e busca por nome

### Arquivos envolvidos:
- Novo: `src/components/admin/AdminCustomersList.tsx` -- componente da aba
- Editar: `src/pages/Admin.tsx` -- adicionar a aba "Clientes" com icone UserCheck

---

## 2. Melhorias nas Mesas

### 2.1. Capacidade da mesa
- Adicionar campo `capacity` (numero de lugares) na tabela `tables` no banco
- Exibir capacidade no card da mesa
- Permitir definir capacidade ao criar mesa

### 2.2. Indicador visual de tempo excessivo
- Mesas ocupadas ha mais de 1 hora recebem borda amarela de alerta
- Mesas ocupadas ha mais de 2 horas recebem borda vermelha

### 2.3. Botao "Liberar Mesa" direto
- Adicionar botao rapido para liberar mesa ocupada sem precisar clicar no ciclo de status

### Arquivos envolvidos:
- Migração SQL: adicionar coluna `capacity` na tabela `tables`
- Editar: `src/pages/Tables.tsx` -- melhorias visuais e novo botao
- Editar: `src/hooks/useTables.ts` -- incluir capacity

---

## 3. Correcoes de Seguranca (nivel erro)

Conforme a politica de seguranca do projeto, vou corrigir apenas os itens de nivel "error":

### 3.1. Dados de clientes expostos na tabela `orders`
- Problema: Tabela `orders` e publicamente legivel e expoe telefone/nome de clientes
- Solucao: Criar nova politica RLS que restrinja SELECT publico a apenas consultas por `tracking_token`, e permitir leitura completa apenas para usuarios autenticados com acesso a unidade

### 3.2. Leads expostos para todos os autenticados
- Problema: Qualquer usuario autenticado pode ler todos os leads (emails, telefones, nomes de restaurantes)
- Solucao: Alterar politica SELECT de `leads` para permitir leitura apenas para developers (via `is_developer()`)

### Migracoes SQL necessarias:
- DROP + CREATE de politicas RLS nas tabelas `orders` e `leads`

---

## 4. Verificacao Geral do Sistema

Revisarei os seguintes pontos e corrigirei problemas encontrados:
- Verificar se todas as paginas carregam sem erros no console
- Verificar se os hooks de dados tratam corretamente estados de loading/error
- Corrigir o `AdminDashboard` que mostra subscriptionsByTier sempre zerado (o hook `useAdminStats` retorna valores fixos `0` para starter/pro/enterprise -- sem integracao real)
- Verificar imports e dependencias quebradas

---

## Resumo das Mudancas

| Area | Tipo | Descricao |
|------|------|-----------|
| Super Admin | Nova aba | Aba "Clientes" com lista de assinantes |
| Super Admin | Correcao | Stats de assinatura sempre zeradas |
| Mesas | Melhoria | Capacidade, alertas de tempo, botao liberar |
| Seguranca | Correcao | RLS da tabela orders (dados de clientes) |
| Seguranca | Correcao | RLS da tabela leads (dados de leads) |
| Sistema | Verificacao | Revisao geral de erros |

