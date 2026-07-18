
-- 1) Trigger gera tracking_token para TODOS os canais
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_token IS NULL THEN
    NEW.tracking_token := encode(extensions.gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_generate_tracking_token ON public.orders;
CREATE TRIGGER orders_generate_tracking_token
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_token();

-- 2) Backfill dos pedidos existentes sem token
UPDATE public.orders
SET tracking_token = encode(extensions.gen_random_bytes(16), 'hex')
WHERE tracking_token IS NULL;

-- 3) Ampliar política: anon pode acompanhar qualquer canal via token
DROP POLICY IF EXISTS "Public can track order by token" ON public.orders;
CREATE POLICY "Public can track order by token"
  ON public.orders FOR SELECT TO anon
  USING (tracking_token IS NOT NULL);

-- 4) Permitir anon ler order_items via token
DROP POLICY IF EXISTS "Public can read order items via tracking" ON public.order_items;
CREATE POLICY "Public can read order items via tracking"
  ON public.order_items FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.tracking_token IS NOT NULL
    )
  );
