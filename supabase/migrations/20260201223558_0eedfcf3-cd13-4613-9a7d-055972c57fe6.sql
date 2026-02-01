-- Correção adicional: remover políticas antigas duplicadas

-- Garantir remoção da política pública da tabela units
DROP POLICY IF EXISTS "Public can read units" ON public.units;

-- Remover políticas antigas de cash_registers que ficaram duplicadas
DROP POLICY IF EXISTS "Users can view cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Users can insert cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Users can update cash registers" ON public.cash_registers;

-- Remover políticas antigas de cash_movements que ficaram duplicadas
DROP POLICY IF EXISTS "Users can view cash movements" ON public.cash_movements;
DROP POLICY IF EXISTS "Users can insert cash movements" ON public.cash_movements;

-- Remover políticas antigas de order_payments que ficaram duplicadas  
DROP POLICY IF EXISTS "Users can view payments" ON public.order_payments;
DROP POLICY IF EXISTS "Users can insert payments" ON public.order_payments;

-- Remover políticas antigas de whatsapp_settings que ficaram duplicadas
DROP POLICY IF EXISTS "Users can view whatsapp settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Users can insert whatsapp settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Users can update whatsapp settings" ON public.whatsapp_settings;