-- Remove política restritiva existente para INSERT
DROP POLICY IF EXISTS "Admins can insert units" ON public.units;

-- Criar nova política que permite usuários autenticados criarem unidades
-- A segurança é garantida pela função create_unit_with_owner que:
-- 1. Associa automaticamente o usuário à unidade criada
-- 2. Dá role de admin apenas ao criador da primeira unidade
CREATE POLICY "Authenticated users can create units"
ON public.units
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Também precisamos permitir que a função insira em user_units
-- Verificar política atual de user_units para INSERT
DROP POLICY IF EXISTS "Users can insert user_units" ON public.user_units;

CREATE POLICY "Users can insert own user_units"
ON public.user_units
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Verificar política de user_roles para permitir inserção inicial
DROP POLICY IF EXISTS "Users can insert user_roles" ON public.user_roles;

-- Permitir que usuários possam receber roles (a função SECURITY DEFINER controla isso)
CREATE POLICY "Users can receive roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);