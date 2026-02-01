-- Criar função is_developer() com SECURITY DEFINER para evitar recursão RLS
CREATE OR REPLACE FUNCTION public.is_developer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'developer'
  )
$$;

-- RLS Policies para developer ter acesso total a TODAS as tabelas principais

-- Units: Developer pode ver/editar todas as unidades
CREATE POLICY "Developer full access to units" ON public.units
FOR ALL TO authenticated
USING (is_developer(auth.uid()))
WITH CHECK (is_developer(auth.uid()));

-- Profiles: Developer pode ver todos os profiles
CREATE POLICY "Developer can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (is_developer(auth.uid()));

-- User Roles: Developer pode gerenciar todas as roles
CREATE POLICY "Developer can manage all roles" ON public.user_roles
FOR ALL TO authenticated
USING (is_developer(auth.uid()))
WITH CHECK (is_developer(auth.uid()));

-- User Units: Developer pode ver/gerenciar associações de unidades
CREATE POLICY "Developer can manage all user units" ON public.user_units
FOR ALL TO authenticated
USING (is_developer(auth.uid()))
WITH CHECK (is_developer(auth.uid()));

-- Orders: Developer pode ver todos os pedidos
CREATE POLICY "Developer can view all orders" ON public.orders
FOR SELECT TO authenticated
USING (is_developer(auth.uid()));

-- Products: Developer pode ver todos os produtos
CREATE POLICY "Developer can view all products" ON public.products
FOR SELECT TO authenticated
USING (is_developer(auth.uid()));

-- Categories: Developer pode ver todas as categorias
CREATE POLICY "Developer can view all categories" ON public.categories
FOR SELECT TO authenticated
USING (is_developer(auth.uid()));

-- Cash Registers: Developer pode ver todos os caixas
CREATE POLICY "Developer can view all cash registers" ON public.cash_registers
FOR SELECT TO authenticated
USING (is_developer(auth.uid()));

-- WhatsApp Settings: Developer pode ver todas as configurações
CREATE POLICY "Developer can view all whatsapp settings" ON public.whatsapp_settings
FOR SELECT TO authenticated
USING (is_developer(auth.uid()));

-- Unit Settings: Developer pode ver todas as configurações de unidade
CREATE POLICY "Developer can view all unit settings" ON public.unit_settings
FOR SELECT TO authenticated
USING (is_developer(auth.uid()));