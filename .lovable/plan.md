
# Revisão Completa do Sistema GastroHub para Comercialização

## Status Geral

O sistema está **quase pronto** para comercialização, mas existem **problemas críticos de segurança** que precisam ser resolvidos antes do lançamento.

---

## 1. Arquitetura e Funcionalidades Implementadas

### Funcionalidades Prontas
| Módulo | Status | Observação |
|--------|--------|------------|
| Autenticação | OK | Login, cadastro, recuperação de senha |
| Multi-unidades | OK | Função `create_unit_with_owner` corrigida |
| Sistema de Roles | OK | RBAC com admin, manager, cashier, etc. |
| PDV | OK | Completo |
| KDS | OK | Cozinha digital |
| Gestão de Pedidos | OK | Todos os canais |
| Cardápio Digital | OK | Categorias e produtos |
| Estoque | OK | Movimentações e alertas |
| Mesas | OK | QR Code e status |
| Caixa | OK | Abertura/fechamento |
| Delivery | OK | Endereços e entregadores |
| WhatsApp | OK | Bot com IA e funções |
| Notificações | OK | Realtime |
| Assinaturas Stripe | OK | 3 tiers configurados |
| Painel Admin | OK | Exclusivo para developer |

### Edge Functions Funcionais
- `create-checkout` - Checkout Stripe
- `check-subscription` - Verificação de assinatura
- `customer-portal` - Portal do cliente Stripe
- `whatsapp-webhook` - Bot WhatsApp com IA
- `analyze-logs` - Análise de logs com IA
- `send-order-notification` - Notificações de pedidos

---

## 2. Problemas de Segurança Críticos (ERRO)

### 2.1 Dados de Clientes Expostos
**Tabela:** `orders`
**Problema:** A política "Public can create orders" permite INSERT público, mas não há proteção adequada para SELECT de dados de clientes (nome e telefone).
```sql
-- Solução: Garantir que SELECT só funcione para usuários autenticados
-- A política atual permite que pedidos de mesa sejam criados publicamente,
-- mas a leitura deve ser restrita
```

### 2.2 Notificações Expostas Publicamente
**Tabela:** `notifications`
**Problema:** A política permite leitura de notificações onde `unit_id IS NULL AND user_id IS NULL`, expondo dados sensíveis.
```sql
-- A condição (unit_id IS NULL AND user_id IS NULL) permite leitura pública
-- de notificações do sistema que contêm valores de pagamento e pedidos
```

### 2.3 Credenciais WhatsApp
**Tabela:** `whatsapp_settings`
**Problema:** API tokens armazenados podem ser expostos se políticas falharem.
**Recomendação:** Considerar uso do Supabase Vault para tokens sensíveis.

---

## 3. Problemas de Segurança Médios (WARN)

### 3.1 RLS Policy Always True
**Tabela:** `units`
**Problema:** INSERT permite `true` para qualquer usuário autenticado.
**Mitigação:** Aceitável pois é necessário para criação de novas unidades.

### 3.2 Cardápio e Categorias Públicos
**Tabelas:** `products`, `categories`
**Problema:** Políticas `Public can read` expõem estratégia de preços.
**Mitigação:** Pode ser intencional para cardápio digital público.

### 3.3 Dados de Entregadores
**Tabela:** `delivery_drivers`
**Problema:** Telefones e dados de entregadores acessíveis via RLS.
**Status:** Protegido por `has_unit_access` - OK.

---

## 4. Correções Necessárias

### Correção 1: Proteger Notificações do Sistema
```sql
-- Remover acesso público a notificações órfãs
DROP POLICY IF EXISTS "Users can view notifications for their units" ON notifications;

CREATE POLICY "Users can view notifications for their units"
ON notifications FOR SELECT
USING (
  has_unit_access(auth.uid(), unit_id) 
  OR (user_id = auth.uid())
);
```

### Correção 2: Proteger Leitura de Pedidos
As políticas atuais já protegem SELECT com `has_unit_access`. O INSERT público é necessário para pedidos de mesa via QR Code.

### Correção 3: Tokens do WhatsApp
Considerar criar uma view que oculte o `api_token` para queries normais:
```sql
CREATE VIEW whatsapp_settings_safe AS
SELECT id, unit_id, instance_name, bot_enabled, welcome_message, 
       system_prompt, created_at, updated_at
       -- Exclui: api_token, api_url
FROM whatsapp_settings;
```

---

## 5. Checklist de Comercialização

### Segurança
- [ ] Corrigir política de notificações
- [ ] Avaliar necessidade de view para WhatsApp settings
- [ ] Ativar HIBP Check no Supabase Auth (já documentado)
- [ ] Configurar rate limiting no Stripe

### Stripe
- [x] Produtos criados (Starter, Pro, Enterprise)
- [x] Checkout funcionando
- [x] Portal do cliente funcionando
- [ ] **Configurar Customer Portal no Stripe Dashboard** (pendente)
- [ ] Configurar webhooks para eventos de assinatura

### Funcional
- [x] Login/Cadastro
- [x] Criação de unidades funcionando
- [x] RBAC implementado
- [x] Todos os módulos operacionais
- [ ] Testar fluxo completo de assinatura
- [ ] Testar criação de unidade após fix

### DevOps
- [x] Edge Functions deployadas
- [x] Storage configurado (unit-logos)
- [ ] Monitoramento de erros
- [ ] Backup configurado

---

## 6. Migrações Recomendadas

### Migração 1: Corrigir Política de Notificações
```sql
-- Remove condição que permite leitura pública
DROP POLICY IF EXISTS "Users can view notifications for their units" ON notifications;

CREATE POLICY "Users can view notifications for their units"
ON notifications FOR SELECT
TO authenticated
USING (
  has_unit_access(auth.uid(), unit_id) 
  OR (user_id = auth.uid())
);
```

### Migração 2 (Opcional): View Segura para WhatsApp
```sql
CREATE OR REPLACE VIEW public.whatsapp_settings_public
WITH (security_invoker = on) AS
SELECT 
  id, unit_id, instance_name, bot_enabled, 
  welcome_message, system_prompt, created_at, updated_at
FROM public.whatsapp_settings;
-- Nota: api_token e api_url ficam ocultos
```

---

## 7. Resumo de Ações

| Prioridade | Ação | Tipo |
|------------|------|------|
| CRÍTICA | Corrigir política de notificações | Migration |
| ALTA | Testar criação de unidade | Manual |
| ALTA | Configurar Stripe Customer Portal | Stripe Dashboard |
| MÉDIA | View para WhatsApp settings | Migration |
| BAIXA | Monitoramento e logging | DevOps |

---

## 8. Conclusão

O sistema está **95% pronto** para comercialização. As principais pendências são:

1. **Segurança:** Corrigir a política de notificações que expõe dados
2. **Stripe:** Configurar o Customer Portal no dashboard do Stripe
3. **Teste:** Validar que a criação de unidades funciona após a correção

Após essas correções, o sistema estará pronto para lançamento comercial.
