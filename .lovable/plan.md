
# Correção: Pedido de Mesa Não Vai para Cozinha

## Problema Identificado

O trigger `generate_tracking_token()` que roda ao criar pedidos de mesa usa `gen_random_bytes(16)` para gerar o token de rastreamento. Porém:

- A função tem `SET search_path TO 'public'`
- `gen_random_bytes()` está no schema `extensions`
- Resultado: O PostgreSQL não encontra a função e o INSERT falha

**Erro nos logs:**
```
function gen_random_bytes(integer) does not exist
```

## Solução

Atualizar a função `generate_tracking_token()` para usar o nome completo `extensions.gen_random_bytes(16)`.

### Migração SQL

```sql
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Gerar token apenas para pedidos de mesa
  IF NEW.channel = 'table' AND NEW.tracking_token IS NULL THEN
    -- Usar schema completo para evitar erro de search_path
    NEW.tracking_token := encode(extensions.gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$function$;
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| **Migração SQL** | Atualizar função `generate_tracking_token()` |

## Fluxo Após Correção

```text
1. Cliente abre carrinho na mesa
2. Seleciona forma de pagamento
3. Clica "Enviar Pedido"
4. Trigger gera tracking_token com extensions.gen_random_bytes()
5. Pedido criado com sucesso
6. Redirecionado para página de acompanhamento
7. Pedido aparece no KDS da cozinha
```

## Detalhes Técnicos

A função `gen_random_bytes` é parte da extensão `pgcrypto`. No Supabase, extensões são instaladas no schema `extensions`. Quando uma função tem `SET search_path TO 'public'` (boa prática de segurança), ela não consegue resolver funções de outros schemas sem qualificação completa.

A solução mais segura é usar o nome totalmente qualificado `extensions.gen_random_bytes()` ao invés de alterar o search_path, mantendo a segurança da função.
