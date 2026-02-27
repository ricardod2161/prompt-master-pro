
## Diagnóstico final confirmado pelos logs

O `check-subscription` tem a lógica na ordem errada:

1. Busca no Stripe → encontra assinatura `starter` ativa para `ricardodelima1988@gmail.com`
2. Como encontrou assinatura válida, NUNCA verifica a tabela `access_overrides`
3. Retorna `tier: "starter"` → bloqueia WhatsApp/Delivery que requer `pro`

Mas na tabela `access_overrides` existe:
- `user_id: 71f57fb8` → `tier: enterprise`, `is_active: true`, `expires_at: null`

### Fix: Inverter a prioridade — override manual > Stripe

A função deve verificar `access_overrides` PRIMEIRO. Se houver um override ativo, retorna imediatamente com o tier do override. Só usa o Stripe se não tiver override.

### Arquivo a modificar: `supabase/functions/check-subscription/index.ts`

**Lógica atual (errada):**
```
1. Busca Stripe customer
2. Se não tem customer → verifica override
3. Busca subscriptions Stripe
4. Se não tem subscription válida → verifica override
5. Se tem subscription → retorna tier do Stripe (IGNORA override)
```

**Nova lógica (correta):**
```
1. Busca override ativo na tabela access_overrides
2. Se override existir → retorna tier do override imediatamente
3. Se não tiver override → busca no Stripe normalmente
```

### Arquivo: `supabase/functions/check-subscription/index.ts`
- Mover a verificação de `access_overrides` para ser o PRIMEIRO passo após autenticar o usuário
- Se override encontrado: retornar imediatamente com o tier do override
- Caso contrário: seguir fluxo Stripe normal
