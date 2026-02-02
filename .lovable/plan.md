

# Correção Definitiva do Erro de RLS na Criação de Unidades

## Problema Identificado

A função `create_unit_with_owner` está configurada como `SECURITY DEFINER` e é de propriedade do usuário `postgres` que tem `bypass_rls:true`. No entanto, o RLS ainda está bloqueando as operações porque o Supabase requer que a função explicitamente desabilite a verificação de RLS durante a execução.

## Análise Técnica

```text
+------------------------+     +------------------------+
|   Usuário Autenticado  |---->|  supabase.rpc(...)     |
+------------------------+     +------------------------+
                                         |
                                         v
                               +------------------------+
                               | create_unit_with_owner |
                               | SECURITY DEFINER       |
                               | Owner: postgres        |
                               +------------------------+
                                         |
                                         v
                               +------------------------+
                               | INSERT INTO units      |
                               | RLS ainda ativo!       | <-- PROBLEMA
                               +------------------------+
```

## Solução

Recriar a função com `SET LOCAL row_security = off` para garantir que o RLS seja desabilitado durante a execução da função.

---

## Modificação no Banco de Dados

Será criada uma migration para recriar a função:

```sql
CREATE OR REPLACE FUNCTION public.create_unit_with_owner(
  _name text,
  _address text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _cnpj text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _unit_id uuid;
  _user_id uuid;
  _user_unit_count int;
BEGIN
  -- Desabilitar RLS para esta transação
  SET LOCAL row_security = off;
  
  -- Obter o ID do usuário autenticado
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se é a primeira unidade do usuário
  SELECT COUNT(*) INTO _user_unit_count
  FROM public.user_units
  WHERE user_id = _user_id;
  
  -- Criar a unidade
  INSERT INTO public.units (name, address, phone, cnpj)
  VALUES (_name, _address, _phone, _cnpj)
  RETURNING id INTO _unit_id;
  
  -- Associar usuário à unidade
  INSERT INTO public.user_units (user_id, unit_id, is_default)
  VALUES (_user_id, _unit_id, _user_unit_count = 0);
  
  -- Se for a primeira unidade, dar role de admin ao usuário
  IF _user_unit_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN _unit_id;
END;
$$;
```

---

## O que muda

| Antes | Depois |
|-------|--------|
| RLS verificado mesmo com SECURITY DEFINER | RLS desabilitado com SET LOCAL |
| Erro de violação de política | Operação executada com sucesso |

---

## Segurança

A solução é segura porque:

1. `SET LOCAL` só afeta a transação atual
2. A função ainda valida que o usuário está autenticado
3. A função só permite operações específicas (criar unidade + associar usuário)
4. Não há como um usuário mal-intencionado abusar desta função para fazer outras operações

---

## Arquivos a Modificar

Apenas uma migration no banco de dados - nenhuma alteração de código necessária.

