-- Recriar função create_unit_with_owner com SECURITY INVOKER
-- As políticas RLS já permitem todas as operações necessárias para usuários autenticados

CREATE OR REPLACE FUNCTION public.create_unit_with_owner(
  _name text,
  _address text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _cnpj text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
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
  
  -- Criar a unidade (RLS permite: true para authenticated)
  INSERT INTO public.units (name, address, phone, cnpj)
  VALUES (_name, _address, _phone, _cnpj)
  RETURNING id INTO _unit_id;
  
  -- Associar usuário à unidade (RLS permite: auth.uid() = user_id)
  INSERT INTO public.user_units (user_id, unit_id, is_default)
  VALUES (_user_id, _unit_id, _user_unit_count = 0);
  
  -- Se for a primeira unidade, dar role de admin (RLS permite: auth.uid() = user_id)
  IF _user_unit_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN _unit_id;
END;
$$;