-- =====================================================
-- MIGRATION: Correções de Segurança Críticas
-- =====================================================

-- 1. REMOVER POLÍTICA PÚBLICA DA TABELA UNITS
-- Expõe CNPJs, endereços e telefones de todos os restaurantes
DROP POLICY IF EXISTS "Public can read units" ON public.units;

-- 2. REMOVER POLÍTICA PÚBLICA DA TABELA TABLES
-- Expõe informações de mesas que não precisam ser públicas
DROP POLICY IF EXISTS "Public can read tables" ON public.tables;

-- 3. ADICIONAR POLÍTICA RESTRITIVA PARA USER_ROLES
-- Impedir que usuários criem ou deletem suas próprias roles
-- Apenas o trigger do sistema (handle_new_user) pode criar roles

-- Primeiro dropar políticas existentes para recrear
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Política: Usuários podem ver suas próprias roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Apenas admins podem gerenciar roles de outros usuários
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. ADICIONAR POLÍTICA RESTRITIVA PARA USER_UNITS
-- Impedir que usuários se associem a unidades sem permissão

-- Primeiro dropar políticas existentes para recrear
DROP POLICY IF EXISTS "Users can view own units" ON public.user_units;
DROP POLICY IF EXISTS "Admins can manage user units" ON public.user_units;

-- Política: Usuários podem ver suas próprias associações
CREATE POLICY "Users can view own units"
  ON public.user_units
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Apenas admins podem gerenciar associações de unidades
CREATE POLICY "Admins can manage user units"
  ON public.user_units
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 5. ATUALIZAR TRIGGER handle_new_user
-- Não atribuir role 'admin' automaticamente - usar 'user' como role padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Criar profile para o novo usuário
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- NÃO atribuir role 'admin' automaticamente (vulnerabilidade de segurança)
  -- Novos usuários não recebem role por padrão
  -- Admins devem atribuir roles manualmente
  
  -- NÃO associar automaticamente com unidade demo
  -- Admins devem associar usuários a unidades manualmente
  
  RETURN NEW;
END;
$function$;

-- 6. RESTRINGIR WHATSAPP_SETTINGS - Proteger API Tokens
-- Apenas admins e managers da unidade podem ver configurações
DROP POLICY IF EXISTS "Users can view whatsapp settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Users can insert whatsapp settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Users can update whatsapp settings" ON public.whatsapp_settings;

-- Apenas admins/managers podem ver configurações do WhatsApp
CREATE POLICY "Managers can view whatsapp settings"
  ON public.whatsapp_settings
  FOR SELECT
  TO authenticated
  USING (
    has_unit_access(auth.uid(), unit_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

-- Apenas admins/managers podem inserir configurações do WhatsApp
CREATE POLICY "Managers can insert whatsapp settings"
  ON public.whatsapp_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_unit_access(auth.uid(), unit_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

-- Apenas admins/managers podem atualizar configurações do WhatsApp
CREATE POLICY "Managers can update whatsapp settings"
  ON public.whatsapp_settings
  FOR UPDATE
  TO authenticated
  USING (
    has_unit_access(auth.uid(), unit_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

-- 7. RESTRINGIR CASH_REGISTERS E CASH_MOVEMENTS
-- Dados financeiros devem ser restritos a admins/managers/cashiers
DROP POLICY IF EXISTS "Users can view cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Users can insert cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Users can update cash registers" ON public.cash_registers;

CREATE POLICY "Financial users can view cash registers"
  ON public.cash_registers
  FOR SELECT
  TO authenticated
  USING (
    has_unit_access(auth.uid(), unit_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'cashier'))
  );

CREATE POLICY "Financial users can insert cash registers"
  ON public.cash_registers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_unit_access(auth.uid(), unit_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'cashier'))
  );

CREATE POLICY "Financial users can update cash registers"
  ON public.cash_registers
  FOR UPDATE
  TO authenticated
  USING (
    has_unit_access(auth.uid(), unit_id) AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'cashier'))
  );

DROP POLICY IF EXISTS "Users can view cash movements" ON public.cash_movements;
DROP POLICY IF EXISTS "Users can insert cash movements" ON public.cash_movements;

CREATE POLICY "Financial users can view cash movements"
  ON public.cash_movements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cash_registers cr
      WHERE cr.id = cash_movements.cash_register_id
      AND has_unit_access(auth.uid(), cr.unit_id)
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'cashier'))
    )
  );

CREATE POLICY "Financial users can insert cash movements"
  ON public.cash_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cash_registers cr
      WHERE cr.id = cash_movements.cash_register_id
      AND has_unit_access(auth.uid(), cr.unit_id)
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'cashier'))
    )
  );

-- 8. RESTRINGIR ORDER_PAYMENTS - Dados de pagamento sensíveis
DROP POLICY IF EXISTS "Users can view payments" ON public.order_payments;
DROP POLICY IF EXISTS "Users can insert payments" ON public.order_payments;

CREATE POLICY "Financial users can view payments"
  ON public.order_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_payments.order_id
      AND has_unit_access(auth.uid(), o.unit_id)
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'cashier'))
    )
  );

CREATE POLICY "Financial users can insert payments"
  ON public.order_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_payments.order_id
      AND has_unit_access(auth.uid(), o.unit_id)
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'cashier'))
    )
  );