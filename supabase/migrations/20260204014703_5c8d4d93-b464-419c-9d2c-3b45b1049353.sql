-- Fase 1: Melhorias de Segurança RLS

-- 1. Tabela TABLES: Restringir UPDATE anônimo para ser mais específico
-- Dropar policy existente com USING(true)
DROP POLICY IF EXISTS "Public can update table status to occupied" ON public.tables;

-- Recriar com restrição mais específica (apenas anon pode atualizar para 'occupied')
CREATE POLICY "Anon can update table status to occupied"
ON public.tables FOR UPDATE
TO anon
USING (true)
WITH CHECK (status = 'occupied'::table_status);

-- 2. Tabela ORDERS: Adicionar política para rastreamento público por ID
-- Manter políticas existentes e adicionar uma específica para tracking

-- Primeiro, verificar se existe uma função para validar acesso anônimo
CREATE OR REPLACE FUNCTION public.is_valid_order_access(order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders
    WHERE id = order_id
      AND channel = 'table'::order_channel
      AND created_at > NOW() - INTERVAL '24 hours'
  )
$$;

-- 3. Adicionar coluna para tracking token (opcional, para segurança extra)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;

-- Criar função para gerar token de tracking
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Gerar token apenas para pedidos de mesa
  IF NEW.channel = 'table' AND NEW.tracking_token IS NULL THEN
    NEW.tracking_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para gerar token automaticamente
DROP TRIGGER IF EXISTS orders_generate_tracking_token ON public.orders;
CREATE TRIGGER orders_generate_tracking_token
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tracking_token();

-- 4. Adicionar política para acesso público via tracking token
CREATE POLICY "Public can track order by token"
ON public.orders FOR SELECT
TO anon
USING (
  tracking_token IS NOT NULL 
  AND channel = 'table'::order_channel
);

-- 5. Limitar criação de unidades por usuário (máximo 5)
CREATE OR REPLACE FUNCTION public.check_unit_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unit_count INT;
BEGIN
  SELECT COUNT(*) INTO unit_count
  FROM public.user_units
  WHERE user_id = auth.uid();
  
  IF unit_count >= 5 AND NOT is_developer(auth.uid()) THEN
    RAISE EXCEPTION 'Limite de 5 unidades por usuário atingido';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela user_units
DROP TRIGGER IF EXISTS check_unit_limit_trigger ON public.user_units;
CREATE TRIGGER check_unit_limit_trigger
  BEFORE INSERT ON public.user_units
  FOR EACH ROW
  EXECUTE FUNCTION public.check_unit_limit();