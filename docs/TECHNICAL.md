# 📚 Documentação Técnica - GastroHub

## Índice

1. [Arquitetura de Componentes](#arquitetura-de-componentes)
2. [Padrões de Código](#padrões-de-código)
3. [Hooks Customizados](#hooks-customizados)
4. [Contextos](#contextos)
5. [Sistema de Temas](#sistema-de-temas)
6. [Banco de Dados](#banco-de-dados)
7. [Edge Functions](#edge-functions)
8. [Troubleshooting](#troubleshooting)

---

## Arquitetura de Componentes

### Estrutura de Pastas

```
src/components/
├── ui/                    # Componentes base (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── admin/                 # Componentes administrativos
│   ├── AdminDashboard.tsx
│   ├── AdminActivityLogs.tsx
│   ├── AILogAnalyzer.tsx
│   └── ...
├── settings/              # Módulos de configurações
│   ├── UnitTab.tsx
│   ├── OperationalTab.tsx
│   ├── FinancialTab.tsx
│   ├── HoursTab.tsx
│   ├── ProfileTab.tsx
│   ├── AppearanceTab.tsx
│   ├── LogoUpload.tsx
│   └── ...
├── notifications/         # Sistema de notificações
│   ├── NotificationBell.tsx
│   └── NotificationCenter.tsx
├── whatsapp/              # Chat WhatsApp
│   ├── ChatView.tsx
│   ├── ConversationList.tsx
│   ├── ChatBubble.tsx
│   └── ...
├── shared/                # Componentes reutilizáveis
│   ├── PageHeader.tsx
│   ├── EmptyState.tsx
│   ├── LoadingSkeleton.tsx
│   └── StatusBadge.tsx
└── layout/                # Layout da aplicação
    ├── AppLayout.tsx
    └── AppSidebar.tsx
```

### Padrão de Componente

```tsx
// Importações
import { useState } from "react";
import { ComponentProp } from "@/types";
import { cn } from "@/lib/utils";

// Interface de Props
interface MyComponentProps {
  title: string;
  onAction?: () => void;
  className?: string;
}

// Componente
export function MyComponent({ title, onAction, className }: MyComponentProps) {
  const [state, setState] = useState(false);

  return (
    <div className={cn("base-classes", className)}>
      {/* Conteúdo */}
    </div>
  );
}
```

---

## Padrões de Código

### Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `OrderCard.tsx` |
| Hooks | camelCase com "use" | `useOrders.ts` |
| Contextos | PascalCase + Context | `AuthContext.tsx` |
| Utils | camelCase | `formatCurrency.ts` |
| Tipos | PascalCase | `OrderStatus` |
| Constantes | SCREAMING_SNAKE | `MAX_ITEMS` |

### Estrutura de Hooks

```tsx
import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMyFeature() {
  // Estados locais
  const [localState, setLocalState] = useState(null);

  // Queries
  const query = useQuery({
    queryKey: ["feature"],
    queryFn: async () => {
      const { data, error } = await supabase.from("table").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const mutation = useMutation({
    mutationFn: async (params) => {
      const { error } = await supabase.from("table").insert(params);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sucesso!");
      query.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Retorno padronizado
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    action: mutation.mutate,
    isActioning: mutation.isPending,
  };
}
```

---

## Hooks Customizados

### useOrders
Gerenciamento de pedidos.

```tsx
const { orders, isLoading, createOrder, updateStatus } = useOrders();
```

### useProducts
Gerenciamento de produtos.

```tsx
const { products, categories, addProduct, updateProduct } = useProducts();
```

### useInventory
Controle de estoque.

```tsx
const { items, movements, addMovement, lowStockItems } = useInventory();
```

### useNotifications
Sistema de notificações.

```tsx
const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
```

### useLogAnalysis
Análise de logs com IA.

```tsx
const { analyzeLogs, isAnalyzing, analysisResult } = useLogAnalysis();
```

### useUnitSettings
Configurações da unidade.

```tsx
const { settings, saveSettings, isSaving } = useUnitSettings();
```

---

## Contextos

### AuthContext

```tsx
const { user, signIn, signUp, signOut, isLoading } = useAuth();
```

Funcionalidades:
- Login com email/senha
- Registro de novos usuários
- Logout
- Verificação de autenticação

### UnitContext

```tsx
const { selectedUnit, setSelectedUnit, units, refetchUnits } = useUnit();
```

Funcionalidades:
- Seleção de unidade ativa
- Lista de unidades do usuário
- Atualização de dados

---

## Sistema de Temas

### Variáveis CSS

```css
:root {
  /* Cores principais */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  
  /* Componentes */
  --card: 0 0% 100%;
  --popover: 0 0% 100%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
}

.dark {
  /* Modo escuro */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### Uso de Classes

```tsx
// ✅ Correto - usar tokens semânticos
<div className="bg-background text-foreground border-border" />

// ❌ Incorreto - cores hardcoded
<div className="bg-white text-black border-gray-200" />
```

---

## Banco de Dados

### Esquema Simplificado

```sql
-- Unidades
units (id, name, cnpj, address, phone, logo_url)

-- Pedidos
orders (id, unit_id, order_number, status, channel, customer_name, total_price)
order_items (id, order_id, product_name, quantity, unit_price, total_price)

-- Produtos
products (id, unit_id, name, price, category_id, available)
categories (id, unit_id, name, active)

-- Estoque
inventory_items (id, unit_id, name, current_stock, min_stock, unit_measure)
inventory_movements (id, inventory_item_id, quantity, type, notes)

-- Sistema
notifications (id, unit_id, title, message, type, category, read)
admin_logs (id, unit_id, action, category, severity, metadata)
unit_settings (id, unit_id, ..configurações..)
```

### Triggers

```sql
-- Notificação de novo pedido
CREATE TRIGGER trigger_notify_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();

-- Verificação de estoque baixo
CREATE TRIGGER trigger_check_low_stock
  AFTER UPDATE OF current_stock ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION check_low_stock();
```

---

## Edge Functions

### analyze-logs

Análise de logs com IA.

**Endpoint:** `POST /functions/v1/analyze-logs`

**Request:**
```json
{
  "logs": [
    {
      "action": "...",
      "category": "...",
      "severity": "...",
      "created_at": "..."
    }
  ],
  "analysisType": "general"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "health_status": "ok|warning|critical",
    "health_summary": "Resumo da saúde",
    "issues": [...],
    "patterns": [...],
    "recommendations": [...],
    "stats": {
      "total_analyzed": 100,
      "errors_count": 5,
      "warnings_count": 10,
      "info_count": 85
    }
  }
}
```

### whatsapp-webhook

Recebe mensagens do WhatsApp.

**Endpoint:** `POST /functions/v1/whatsapp-webhook`

**Request:** Formato Evolution API
**Response:** Status de processamento

---

## Troubleshooting

### Erros Comuns

#### "RLS policy violation"
- Verifique se o usuário está autenticado
- Confirme que a unidade está selecionada
- Revise as políticas RLS da tabela

#### "Function not found"
- Verifique se a Edge Function foi deployed
- Confirme o nome no `config.toml`
- Verifique os logs da função

#### "Realtime not working"
- Confirme que a tabela está na publicação
- Verifique a conexão WebSocket
- Revise as policies de SELECT

### Logs de Debug

```typescript
// Habilitar logs de debug do Supabase
import { supabase } from "@/integrations/supabase/client";

// Ver queries
supabase.from('table').select('*').then(console.log);

// Ver erros
supabase.from('table').select('*').then(({ error }) => console.error(error));
```

### Verificar Saúde do Sistema

1. Acesse Admin > Logs
2. Clique em "Analisar com IA"
3. Revise os problemas identificados
4. Siga as sugestões de correção

---

## Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Lovable](https://docs.lovable.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query)
