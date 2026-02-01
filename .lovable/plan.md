
# Análise Técnica Completa: RestaurantOS

## Visão Geral do Sistema

O RestaurantOS é um sistema de gestão para restaurantes com as seguintes características:
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Lovable Cloud (Supabase)
- **Integrações**: Stripe (pagamentos), Evolution API (WhatsApp), AI Gateway (Gemini/GPT-5)
- **Arquitetura**: Multi-tenant com RBAC (Role-Based Access Control)

---

## 1. Análise de Segurança

### 1.1 Problemas Críticos Identificados (ERRO)

| Problema | Impacto | Tabela Afetada |
|----------|---------|----------------|
| Dados de negócio expostos | Concorrentes podem coletar CNPJs, endereços, telefones | `units` |
| Dados de clientes expostos | Telefones e nomes podem ser coletados para spam/fraude | `orders`, `whatsapp_conversations` |
| Endereços de entrega expostos | Risco de stalking/crimes com endereços residenciais | `delivery_orders` |
| Credenciais WhatsApp expostas | API tokens podem ser roubados para spam | `whatsapp_settings` |
| Dados de entregadores expostos | Telefones e informações pessoais | `delivery_drivers` |

### 1.2 Avisos de Segurança (WARN)

| Problema | Recomendação |
|----------|--------------|
| Proteção contra senhas vazadas desabilitada | Ativar no Supabase Auth |
| Perfis podem ser acessíveis entre contas | Adicionar políticas de negação explícitas |
| Dados financeiros acessíveis a todos com unit_access | Restringir a admins/gerentes |
| Detalhes de pagamento visíveis para todos | Restringir a gerentes |
| Tabela `whatsapp_typing_status` sem políticas restritas | Adicionar RLS mais restritivo |
| Tabela `user_roles` permite auto-atribuição de roles | Bloquear INSERT para usuários normais |
| Tabela `user_units` permite auto-associação | Restringir a admins |

### 1.3 Status do RLS (Row Level Security)

```text
✅ RLS HABILITADO em todas as 23 tabelas
✅ Função has_unit_access() implementada para controle multi-tenant
✅ Função has_role() implementada para RBAC
⚠️ Políticas públicas permissivas em algumas tabelas
```

### 1.4 Edge Functions - Segurança

| Função | JWT Verification | Status |
|--------|------------------|--------|
| `whatsapp-webhook` | ❌ Desabilitado | ✅ Correto (recebe webhooks externos) |
| `check-subscription` | ✅ Habilitado | ✅ Correto |
| `create-checkout` | ✅ Habilitado | ✅ Correto |
| `customer-portal` | ✅ Habilitado | ✅ Correto |
| `send-order-notification` | ✅ Habilitado | ✅ Correto |
| `test-evolution-connection` | ✅ Habilitado | ✅ Correto |

---

## 2. Análise do Workflow

### 2.1 Fluxo de Autenticação

```text
Login/Signup → AuthContext → Verificar Subscription → Selecionar Unidade → Dashboard
     │
     ├─ Trigger: handle_new_user() cria profile e atribui role 'admin'
     ├─ Auto-associação com unidade demo
     └─ Verificação de subscription a cada 60 segundos
```

**Status**: ✅ Funcional, mas com problemas de segurança na auto-atribuição de roles.

### 2.2 Fluxo de Pedidos (WhatsApp)

```text
Cliente envia mensagem → Evolution API → Webhook
     │
     ├─ messages.upsert: Processa mensagem
     │   ├─ Áudio: Transcrição via Gemini Pro
     │   ├─ Imagem: Análise via Gemini Flash
     │   └─ Texto: Processa diretamente
     │
     ├─ Enviar presence "composing" (a cada 8s durante processamento)
     │
     ├─ Processar com IA (Gemini 2.5 Flash + Tool Calling)
     │   ├─ listar_cardapio
     │   ├─ buscar_produto
     │   ├─ calcular_total
     │   └─ confirmar_pedido
     │
     ├─ Enviar resposta via Evolution API
     │
     └─ messages.update: Atualiza status (delivered/read)
```

**Status**: ✅ Funcional com correções recentes para presence e status.

### 2.3 Fluxo de Subscription

```text
Usuário → Pricing → create-checkout → Stripe Checkout
     │
     ├─ Sucesso: Redireciona para /subscription-success
     │
     ├─ AuthContext verifica subscription (check-subscription)
     │   └─ Mapeia product_id para tier (starter/pro/enterprise)
     │
     └─ SubscriptionGate controla acesso a features premium
```

**Status**: ✅ Funcional, mas sem webhooks para atualização em tempo real.

---

## 3. Pontos de Melhoria Identificados

### 3.1 Segurança (Prioridade Alta)

1. **Remover política pública da tabela `units`**
2. **Restringir `whatsapp_settings`** - API tokens não devem ser selecionáveis por todos
3. **Proteger `delivery_orders`** - Endereços de entrega são dados sensíveis
4. **Bloquear auto-atribuição de roles** - `user_roles` não deve permitir INSERT por usuários
5. **Habilitar proteção contra senhas vazadas** no Supabase Auth

### 3.2 Robustez (Prioridade Média)

1. **Webhook Stripe** - Implementar para atualização em tempo real de subscriptions
2. **Rate Limiting** - Adicionar limites no webhook WhatsApp
3. **Retry Logic** - Implementar retentativas para chamadas à Evolution API
4. **Validação de Input** - Adicionar Zod para validação de payloads

### 3.3 Funcionalidades (Prioridade Baixa)

1. **Logs de auditoria** - Registrar ações administrativas
2. **Backup de conversas** - Exportação de histórico WhatsApp
3. **Métricas** - Dashboard com KPIs de atendimento

---

## 4. Checklist para Produção

### Segurança
- [ ] Corrigir 6 políticas RLS com acesso público indevido
- [ ] Ativar proteção contra senhas vazadas
- [ ] Revisar função `handle_new_user()` - não atribuir admin automaticamente
- [ ] Criptografar `api_token` em `whatsapp_settings`
- [ ] Adicionar rate limiting no webhook

### Infraestrutura
- [ ] Configurar domínio customizado
- [ ] Implementar webhook Stripe para subscriptions
- [ ] Configurar alertas de erro (Sentry ou similar)
- [ ] Testar escalabilidade com múltiplas unidades

### Compliance
- [ ] Termos de uso e política de privacidade
- [ ] Consentimento LGPD para dados de clientes
- [ ] Política de retenção de dados de conversas

---

## 5. Resumo Técnico

| Área | Status | Score |
|------|--------|-------|
| Autenticação | ✅ Funcional | 8/10 |
| Autorização (RLS) | ⚠️ Parcial | 6/10 |
| Subscription System | ✅ Funcional | 8/10 |
| WhatsApp Integration | ✅ Funcional | 8/10 |
| Segurança Geral | ❌ Crítico | 4/10 |
| Código Frontend | ✅ Bom | 8/10 |
| Edge Functions | ✅ Bom | 8/10 |

### Veredito Final

**O sistema NÃO está pronto para produção comercial** devido a:
1. **6 vulnerabilidades críticas de segurança** nas políticas RLS
2. **Dados sensíveis expostos** (API tokens, endereços, telefones)
3. **Auto-atribuição de roles** permite escalonamento de privilégios

### Próximos Passos Recomendados

1. **URGENTE**: Corrigir políticas RLS para remover acesso público a dados sensíveis
2. **URGENTE**: Bloquear auto-atribuição de roles administrativos
3. **IMPORTANTE**: Ativar proteção contra senhas vazadas
4. **IMPORTANTE**: Implementar webhook Stripe
5. **RECOMENDADO**: Adicionar rate limiting e logs de auditoria

---

Deseja que eu implemente as correções de segurança?
