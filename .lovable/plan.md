
## Diagnóstico completo — 3 bugs identificados

### Bug 1: `customer-portal` falha com erro 500 para usuários com override manual
Em `supabase/functions/customer-portal/index.ts` linha 56-58: se não existe cliente Stripe, lança `throw new Error("Nenhuma conta encontrada. Assine um plano primeiro.")`. Usuário da Churascaria não tem Stripe → erro 500 → toast vermelho na tela.

**Fix:** Retornar mensagem amigável com status 200 `{ error: "no_stripe_customer" }` ou redirecionar para `/pricing` sem crash.

### Bug 2: `check-subscription` usa `getClaims()` que pode não retornar `email`
O JWT anon do Supabase nem sempre inclui `email` nos claims dependendo da versão. O `check-subscription` já funciona (logs mostram `danielysoares008@gmail.com`), mas é frágil. A função deve usar `supabase.auth.getUser(token)` com service key para obter o email com garantia.

**Fix em `check-subscription`:** Trocar `getClaims` → `serviceClient.auth.getUser(token)` para obter email confiável.

### Bug 3: `SubscriptionGate` não reconhece override porque `tier` retorna `null` em alguns caminhos
Confirmado nos logs: `"Manual access override found (no Stripe customer) - {"tier":"pro"}"` — o override retorna tier. Porém o `canAccessFeature` retorna `false` quando `currentTier` é `null`. Se o `check-subscription` falhar silenciosamente, o tier fica `null` e o gate bloqueia mesmo tendo override.

**Fix em `AuthContext`:** Garantir que erros de `check-subscription` não silenciosamente resetem o tier (já tem try/catch bom). Também: aumentar resiliência adicionando retry automático quando a resposta tem `error` mas sem travar o estado.

### Arquivos a modificar:

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/customer-portal/index.ts` | Tratar ausência de cliente Stripe sem lançar erro 500 — retornar resposta útil |
| `supabase/functions/check-subscription/index.ts` | Trocar `getClaims` por `auth.getUser` com service key para email confiável |
| `src/components/subscription/SubscriptionGate.tsx` | Adicionar fallback: se `isSubscriptionLoading` acabou e tier é null mas houve erro, tentar re-check antes de bloquear |

### Solução principal para o customer-portal:
```typescript
if (customers.data.length === 0) {
  // Usuário tem override manual — não tem Stripe, não pode gerenciar assinatura
  return new Response(JSON.stringify({ 
    error: "Você possui acesso manual concedido pela equipe. Para gerenciar sua assinatura, entre em contato com o suporte.",
    isManualOverride: true 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200, // ← 200, não 500, para não crashar o frontend
  });
}
```

### Solução para check-subscription (trocar getClaims → getUser):
```typescript
const serviceClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
const { data: userData, error: userError } = await serviceClient.auth.getUser(token);
if (userError || !userData.user?.email) throw new Error("Authentication failed");
const userId = userData.user.id;
const userEmail = userData.user.email;
```
