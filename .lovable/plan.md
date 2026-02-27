
## Plano: Controle Manual de Acesso no Super Admin

### Problema
O cliente "Santo Antônio" expirou o trial de 14 dias no Stripe. O admin precisa de controle manual para: liberar acesso mesmo sem assinatura ativa, definir quantos dias de acesso extra conceder, e revogar esse acesso quando quiser.

### Solução: Tabela `access_overrides` + integração no `check-subscription`

O `check-subscription` já consulta o Stripe. Vamos acrescentar uma segunda verificação: se não há assinatura ativa no Stripe, verificamos se existe um override manual válido na tabela. Se existir, retornamos `subscribed: true` com o tier definido pelo admin.

---

### 1. Migração: criar tabela `access_overrides`

```sql
CREATE TABLE public.access_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier text NOT NULL DEFAULT 'pro',
  granted_by uuid NOT NULL,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_overrides ENABLE ROW LEVEL SECURITY;

-- Só developer lê/escreve
CREATE POLICY "Developer can manage overrides"
ON public.access_overrides FOR ALL
USING (is_developer(auth.uid()))
WITH CHECK (is_developer(auth.uid()));
```

### 2. Edge Function `check-subscription` — adicionar fallback de override

Após verificar Stripe e não encontrar assinatura válida, consultar `access_overrides` via Service Role:
```typescript
// Se não há sub válida no Stripe, verificar override manual
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const { data: override } = await serviceClient
  .from('access_overrides')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true)
  .or('expires_at.is.null,expires_at.gt.now()')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (override) {
  return { subscribed: true, tier: override.tier, status: 'manual_override', ... }
}
```

### 3. Nova Edge Function `admin-access-override`

Endpoint POST para o super admin criar/atualizar/revogar overrides. Protegida com `is_developer`.

Operações:
- `grant`: criar override com `tier` e `days` (ou `null` = indefinido)
- `revoke`: setar `is_active = false` para user_id

### 4. UI: `AdminCustomersList.tsx`

Adicionar botão "Gerenciar Acesso" (ícone Shield) em cada cliente. Abre Dialog com:
- Toggle para Liberar/Bloquear acesso
- Select de plano (Starter / Pro / Enterprise)
- Input de dias (ex: 30 dias) ou "Indefinido"
- Campo de observações
- Botão "Salvar"

Mostrar badge visual "Override Ativo" em clientes com acesso manual liberado.

---

### Arquivos modificados
| Arquivo | Ação |
|---------|------|
| `supabase/migrations/` | Nova tabela `access_overrides` |
| `supabase/functions/check-subscription/index.ts` | Fallback para override manual |
| `supabase/functions/admin-access-override/index.ts` | Nova edge function |
| `src/components/admin/AdminCustomersList.tsx` | UI de controle de acesso por cliente |
