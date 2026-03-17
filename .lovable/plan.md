
## Diagnóstico Final — 2 Bugs Confirmados

**Bug 1 — AuthContext não tem fallback em caso de erro:**
Quando `check-subscription` falha por qualquer motivo (cold start, network error), o `catch` só loga o erro mas não atualiza `subscription`. O estado fica `{ tier: null }` e o gate bloqueia tudo.

**Bug 2 — SubscriptionGate ignora o role `developer`:**
Usuário com role `developer` SEMPRE deve ter acesso total. O gate atual só checa o tier de assinatura, nunca o papel do usuário. A solução mais simples e robusta: no `AuthContext`, quando o usuário tem role `developer` na tabela `user_roles`, forçar o tier para `enterprise` localmente — sem depender de override externo.

## Solução

### 1. `AuthContext.tsx` — duas correções:
- Adicionar verificação de `developer` role direto na query do Supabase (client-side, sem edge function)
- Se o usuário for developer → setar tier `enterprise` independente do resultado da edge function
- Se a edge function falhar → não deixar o tier como null se ele já tinha um tier antes (manter o último estado válido)

### 2. `SubscriptionGate.tsx` — adicionar bypass para developer:
- Usar `useIsDeveloper()` hook existente
- Se `isDeveloper === true` → retornar `children` diretamente, sem checar tier

### Arquivos:
| Arquivo | Mudança |
|---------|---------|
| `src/contexts/AuthContext.tsx` | Detectar role developer no login, forçar tier enterprise |
| `src/components/subscription/SubscriptionGate.tsx` | Bypass total para developers |
