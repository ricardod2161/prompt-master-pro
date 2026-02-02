-- Correção definitiva: usar set_config para bypass RLS
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
  _original_role text;
BEGIN
  -- Salvar o role original
  _original_role := current_setting('role');
  
  -- Obter o ID do usuário autenticado ANTES de mudar o role
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Mudar para service_role para bypass RLS
  PERFORM set_config('role', 'service_role', true);
  
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
  
  -- Restaurar role original
  PERFORM set_config('role', _original_role, true);
  
  RETURN _unit_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Garantir restauração do role mesmo em caso de erro
    PERFORM set_config('role', _original_role, true);
    RAISE;
END;
$$;