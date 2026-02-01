
# Plano: Painel Admin do Desenvolvedor + Melhorias Gerais

## Resumo Executivo
Criar um sistema de **Super Admin (Developer)** exclusivo para você, com painel completo de gestão de usuários, unidades e métricas do sistema. Além disso, melhorar a organização, robustez e elegância de toda a aplicação.

---

## Fase 1: Role de Desenvolvedor + Painel Admin

### 1.1 Criar Role "developer" no Banco de Dados
- Adicionar novo valor `developer` ao enum `app_role`
- Atribuir role `developer` ao seu usuário (ricardodelima1988@gmail.com)
- Esta role terá privilégios superiores a `admin`

### 1.2 Nova Página: `/admin` (Painel do Desenvolvedor)
Página exclusiva com abas:

**Tab: Dashboard do Sistema**
- Total de usuários ativos
- Total de unidades cadastradas
- Assinaturas ativas por tier (Starter/Pro/Enterprise)
- Receita mensal estimada (MRR)
- Gráfico de crescimento de usuários

**Tab: Gestão de Usuários**
- Listar todos os usuários do sistema
- Ver roles de cada usuário
- Atribuir/remover roles
- Ver unidades associadas
- Desativar/ativar contas

**Tab: Gestão de Unidades**
- Listar todas as unidades
- Ver proprietário de cada unidade
- Estatísticas por unidade (pedidos, faturamento)

**Tab: Logs de Sistema**
- Ações administrativas recentes
- Erros de pagamento
- Falhas de integração WhatsApp

### 1.3 Proteção de Acesso
- Rota `/admin` visível apenas para role `developer`
- RLS policies específicas para developer acessar todos os dados
- Funções SQL `is_developer()` para verificação rápida

---

## Fase 2: Melhorias de Organização e Robustez

### 2.1 Reestruturação do Sidebar
- Agrupar melhor os itens por função
- Adicionar indicadores visuais de status (ex: pedidos pendentes)
- Item "Admin" visível apenas para developer

### 2.2 Melhorias na Página de Settings
- Adicionar aba "Usuários da Unidade" para admins
- Permitir convidar novos colaboradores
- Gerenciar permissões por unidade

### 2.3 Melhorias Visuais Globais
- Micro-animações mais suaves em transições
- Feedback visual em todas as ações
- Estados de loading consistentes
- Tooltips informativos em botões importantes

---

## Fase 3: Funcionalidades Inteligentes

### 3.1 Notificações em Tempo Real
- Badge de notificação no sidebar
- Centro de notificações (ícone de sino no header)
- Alertas de:
  - Novos pedidos
  - Estoque baixo
  - Pagamentos recebidos
  - Assinaturas próximas do vencimento

### 3.2 Quick Actions no Dashboard
- Botões rápidos: "Novo Pedido", "Abrir Caixa", "Ver KDS"
- Atalhos de teclado para ações frequentes

### 3.3 Busca Global (Cmd+K)
- Buscar em pedidos, produtos, clientes
- Navegar rapidamente entre páginas
- Executar ações rápidas

---

## Detalhes Técnicos

### Migração SQL
```sql
-- Adicionar role developer
ALTER TYPE app_role ADD VALUE 'developer';

-- Criar função is_developer
CREATE OR REPLACE FUNCTION is_developer(_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id AND role = 'developer'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Atribuir role ao desenvolvedor
INSERT INTO user_roles (user_id, role)
SELECT id, 'developer' FROM auth.users 
WHERE email = 'ricardodelima1988@gmail.com';

-- RLS: Developer pode ver tudo
CREATE POLICY "Developer full access" ON units
FOR ALL TO authenticated
USING (is_developer(auth.uid()));
```

### Novos Componentes
```
src/
├── pages/
│   └── Admin.tsx                    # Painel principal
├── components/admin/
│   ├── AdminDashboard.tsx           # Métricas do sistema
│   ├── AdminUsersList.tsx           # Gestão de usuários
│   ├── AdminUnitsManager.tsx        # Gestão de unidades
│   └── AdminActivityLogs.tsx        # Logs do sistema
├── hooks/
│   ├── useAdminStats.ts             # Estatísticas do sistema
│   ├── useUserManagement.ts         # CRUD de usuários/roles
│   └── useIsDeveloper.ts            # Verificar se é developer
```

### Proteção de Rotas
```tsx
// Em AppLayout.tsx ou rota específica
const { isDeveloper } = useIsDeveloper();

// Rota protegida
<Route path="/admin" element={
  <DeveloperOnly>
    <Admin />
  </DeveloperOnly>
} />
```

---

## Cronograma de Implementação

| Fase | Descrição | Estimativa |
|------|-----------|------------|
| 1.1 | Role developer + atribuição | 1 mensagem |
| 1.2 | Página Admin básica | 2-3 mensagens |
| 1.3 | RLS e proteção | 1 mensagem |
| 2.1 | Melhorias Sidebar | 1 mensagem |
| 2.2 | Melhorias Settings | 1-2 mensagens |
| 2.3 | Melhorias visuais | 1 mensagem |
| 3.1 | Notificações | 2 mensagens |
| 3.2 | Quick Actions | 1 mensagem |
| 3.3 | Busca Global | 2 mensagens |

**Total estimado: 12-15 mensagens**

---

## Benefícios

1. **Controle Total**: Você terá visibilidade completa do sistema
2. **Gestão de Usuários**: Adicionar/remover usuários sem SQL manual
3. **Métricas de Negócio**: Acompanhar MRR, churn, crescimento
4. **Segurança**: Role separada impede conflitos com admins de unidades
5. **Escalabilidade**: Preparado para múltiplos clientes

---

## Próximos Passos

Após aprovação, começarei pela **Fase 1.1**:
1. Adicionar role `developer` ao enum
2. Atribuir role ao seu email
3. Criar função `is_developer()`
4. Adicionar policies para acesso total

Deseja que eu prossiga com a implementação?
