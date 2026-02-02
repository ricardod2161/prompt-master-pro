

# Correção Definitiva: SECURITY DEFINER sem set_config

## Problema Encontrado

Análise das permissões revelou:

| Role | rolbypassrls |
|------|--------------|
| postgres (owner) | **true** |
| authenticated (chamador) | false |
| service_role | true |

A função atual usa `SECURITY INVOKER`, então roda com permissões do **authenticated** (que NÃO pode bypassar RLS).

## Solução

Mudar para `SECURITY DEFINER` **sem** usar `set_config`. A função rodará com os privilégios do owner `postgres` que TEM `rolbypassrls:true`.

```text
ANTES (SECURITY INVOKER):
+------------------+     +-----------------+
| authenticated    | --> | Função executa  | --> RLS BLOQUEIA
| bypassrls=false  |     | como AUTH user  |
+------------------+     +-----------------+

DEPOIS (SECURITY DEFINER):
+------------------+     +-----------------+
| authenticated    | --> | Função executa  | --> RLS BYPASSED
|                  |     | como POSTGRES   |
+------------------+     +-----------------+
                         | bypassrls=true  |
```

## Modificação no Banco de Dados

```sql
CREATE OR REPLACE FUNCTION public.create_unit_with_owner(
  _name text,
  _address text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _cnpj text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER  -- Roda como postgres (bypassrls=true)
SET search_path = public
AS $$
DECLARE
  _unit_id uuid;
  _user_id uuid;
  _user_unit_count int;
BEGIN
  -- Obter o ID do usuário autenticado
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se é a primeira unidade do usuário
  SELECT COUNT(*) INTO _user_unit_count
  FROM public.user_units
  WHERE user_id = _user_id;
  
  -- Criar a unidade (RLS bypassed porque SECURITY DEFINER com owner postgres)
  INSERT INTO public.units (name, address, phone, cnpj)
  VALUES (_name, _address, _phone, _cnpj)
  RETURNING id INTO _unit_id;
  
  -- Associar usuário à unidade
  INSERT INTO public.user_units (user_id, unit_id, is_default)
  VALUES (_user_id, _unit_id, _user_unit_count = 0);
  
  -- Se for a primeira unidade, dar role de admin
  IF _user_unit_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN _unit_id;
END;
$$;
```

## Por Que Funciona

1. **SECURITY DEFINER**: A função executa com os privilégios do **owner** da função
2. **Owner = postgres**: O owner `postgres` tem `rolbypassrls=true`
3. **Bypass automático**: RLS é automaticamente bypassed para roles com `rolbypassrls=true`
4. **Sem set_config**: Não precisa mudar role manualmente (isso é bloqueado pelo Supabase)

## Diferença das Tentativas Anteriores

| Tentativa | Problema |
|-----------|----------|
| SECURITY DEFINER + set_config('role') | set_config bloqueado pelo Supabase |
| SECURITY DEFINER + SET LOCAL row_security | Comando bloqueado pelo Supabase |
| SECURITY INVOKER | Roda como authenticated (sem bypassrls) |
| **SECURITY DEFINER simples** | ✅ Roda como postgres (com bypassrls) |

## Arquivos a Modificar

Apenas uma migration no banco de dados para alterar a função de SECURITY INVOKER para SECURITY DEFINER.

