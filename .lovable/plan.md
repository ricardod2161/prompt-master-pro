

# Plano: Pagina de Configuracoes Robusta e Responsiva

## Visao Geral

Criar uma pagina de configuracoes completa, profissional e inteligente que centraliza todas as configuracoes do sistema RestaurantOS, organizada em abas tematicas com interface responsiva otimizada para tablets e dispositivos moveis.

---

## Arquitetura da Solucao

### 1. Nova Tabela no Banco de Dados

Criar tabela `unit_settings` para armazenar configuracoes operacionais da unidade:

```text
unit_settings
├── id (uuid, PK)
├── unit_id (uuid, FK -> units)
├── auto_print_enabled (boolean) - Impressao automatica de comanda
├── auto_notify_enabled (boolean) - Notificacao automatica ao cliente
├── delivery_enabled (boolean) - Delivery ativo
├── table_ordering_enabled (boolean) - Pedido via QR Code ativo
├── counter_ordering_enabled (boolean) - Balcao ativo
├── whatsapp_ordering_enabled (boolean) - Pedidos via WhatsApp
├── default_preparation_time (integer) - Tempo medio de preparo (minutos)
├── service_fee_percentage (numeric) - Taxa de servico (%)
├── delivery_fee (numeric) - Taxa de entrega padrao
├── min_delivery_order (numeric) - Pedido minimo para delivery
├── opening_hours (jsonb) - Horario de funcionamento
├── timezone (text) - Fuso horario
├── currency (text) - Moeda
├── created_at / updated_at (timestamps)
```

### 2. Estrutura da Pagina

A pagina sera organizada em **6 abas principais**:

```text
Configuracoes
├── [1] Unidade - Dados cadastrais da unidade
├── [2] Operacional - Canais, impressao, notificacoes
├── [3] Financeiro - Taxas, metodos de pagamento
├── [4] Horarios - Funcionamento e fusos
├── [5] Usuarios - Gestao de equipe e permissoes
├── [6] Perfil - Dados do usuario logado
```

---

## Detalhamento por Aba

### Aba 1: Unidade
- Nome do estabelecimento
- CNPJ
- Endereco completo
- Telefone principal
- Logo da unidade (upload de imagem)
- Descricao/Bio

### Aba 2: Operacional
**Canais de Venda:**
- Toggle: Delivery ativo
- Toggle: Mesa/QR Code ativo
- Toggle: Balcao ativo
- Toggle: WhatsApp ativo

**Automacoes:**
- Toggle: Impressao automatica (status "Preparando")
- Toggle: Notificacao automatica WhatsApp (status "Pronto")
- Tempo medio de preparo (slider ou input)

### Aba 3: Financeiro
**Taxas:**
- Taxa de servico (%)
- Taxa de entrega padrao
- Pedido minimo para delivery

**Metodos de Pagamento:**
- Checkboxes para ativar/desativar cada metodo
- Dinheiro / Credito / Debito / Pix / Voucher

### Aba 4: Horarios
**Funcionamento:**
- Grid semanal (Segunda a Domingo)
- Para cada dia: horario de abertura e fechamento
- Toggle para dias fechados
- Fuso horario (select)

### Aba 5: Usuarios
**Gestao de Equipe:**
- Lista de usuarios vinculados a unidade
- Role badges (Admin, Manager, Cashier, Kitchen, Waiter)
- Acoes: alterar role, remover acesso
- Botao para convidar novo usuario

### Aba 6: Perfil
**Dados Pessoais:**
- Nome completo
- Avatar (upload)
- Email (read-only)
- Botao: Alterar senha
- Botao: Sair da conta

---

## Componentes Tecnicos

### Arquivos a Criar

1. **`src/pages/Settings.tsx`**
   - Pagina principal com Tabs
   - Layout responsivo com grid adaptativo
   - Loading states e skeleton

2. **`src/hooks/useUnitSettings.ts`**
   - Query para buscar settings
   - Mutations para criar/atualizar
   - Cache invalidation

3. **`src/hooks/useUserManagement.ts`**
   - Query para listar usuarios da unidade
   - Mutations para alterar roles
   - Convite de usuarios

4. **`src/hooks/useProfile.ts`**
   - Query para dados do perfil
   - Mutation para atualizar perfil
   - Upload de avatar

### Migracao SQL

```sql
CREATE TABLE public.unit_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE UNIQUE,
  auto_print_enabled boolean DEFAULT true,
  auto_notify_enabled boolean DEFAULT true,
  delivery_enabled boolean DEFAULT true,
  table_ordering_enabled boolean DEFAULT true,
  counter_ordering_enabled boolean DEFAULT true,
  whatsapp_ordering_enabled boolean DEFAULT true,
  default_preparation_time integer DEFAULT 30,
  service_fee_percentage numeric(5,2) DEFAULT 0,
  delivery_fee numeric(10,2) DEFAULT 0,
  min_delivery_order numeric(10,2) DEFAULT 0,
  opening_hours jsonb DEFAULT '{}',
  timezone text DEFAULT 'America/Sao_Paulo',
  currency text DEFAULT 'BRL',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.unit_settings ENABLE ROW LEVEL SECURITY;

-- Trigger para updated_at
CREATE TRIGGER update_unit_settings_updated_at
  BEFORE UPDATE ON public.unit_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Design UI/UX

### Layout Responsivo

```text
Mobile (< 768px):
├── Tabs horizontais com scroll
├── Cards empilhados verticalmente
├── Forms de coluna unica
├── Botoes full-width

Tablet (768px - 1024px):
├── Tabs horizontais fixas
├── Grid 2 colunas para cards
├── Forms de 2 colunas
├── Botoes agrupados

Desktop (> 1024px):
├── Tabs com icones + labels
├── Grid 3 colunas
├── Forms lado a lado
├── Sidebar de navegacao rapida
```

### Elementos Visuais

- **Header gradient** com icone e titulo (estilo WhatsAppSettings)
- **Cards com sombra suave** para cada secao
- **Toggle switches** estilizados para on/off
- **Badges coloridos** para status e roles
- **Toast notifications** para feedback
- **Loading skeletons** durante carregamento
- **Empty states** com icones e CTAs

---

## Integracao com Sistema

### Hooks Existentes a Utilizar
- `useUnit()` - Unidade selecionada
- `useAuth()` - Usuario logado
- `useToast()` - Notificacoes

### Atualizacoes em Outros Arquivos

**`src/App.tsx`:**
- Substituir ComingSoon por novo componente Settings

**`src/hooks/usePrintOrder.ts`:**
- Consultar `unit_settings.auto_print_enabled` antes de imprimir

**`src/hooks/useOrderNotification.ts`:**
- Consultar `unit_settings.auto_notify_enabled` antes de notificar

---

## Sequencia de Implementacao

1. Criar migracao SQL para tabela `unit_settings`
2. Criar `src/hooks/useUnitSettings.ts`
3. Criar `src/hooks/useProfile.ts`
4. Criar `src/pages/Settings.tsx` com todas as abas
5. Atualizar `src/App.tsx` para usar novo componente
6. Integrar configuracoes nos hooks de impressao e notificacao
7. Testar responsividade em todos os dispositivos

---

## Secao Tecnica Detalhada

### Estrutura de Codigo Settings.tsx

```text
Settings.tsx
├── Imports (UI components, hooks, icons)
├── Constants (tabs config, roles, timezones)
├── Sub-components:
│   ├── UnitSettingsTab
│   ├── OperationalSettingsTab
│   ├── FinancialSettingsTab
│   ├── HoursSettingsTab
│   ├── UsersSettingsTab
│   └── ProfileSettingsTab
├── Main Component:
│   ├── Loading state check
│   ├── Unit selection check
│   ├── Header card with stats
│   └── Tabs container
```

### Schema do opening_hours (JSONB)

```json
{
  "monday": { "open": "08:00", "close": "22:00", "closed": false },
  "tuesday": { "open": "08:00", "close": "22:00", "closed": false },
  "wednesday": { "open": "08:00", "close": "22:00", "closed": false },
  "thursday": { "open": "08:00", "close": "22:00", "closed": false },
  "friday": { "open": "08:00", "close": "23:00", "closed": false },
  "saturday": { "open": "10:00", "close": "23:00", "closed": false },
  "sunday": { "open": "10:00", "close": "20:00", "closed": false }
}
```

