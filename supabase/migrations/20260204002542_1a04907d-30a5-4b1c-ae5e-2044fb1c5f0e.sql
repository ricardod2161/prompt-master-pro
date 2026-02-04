-- Permitir que clientes anônimos vejam pedidos de mesa (necessário para .insert().select())
CREATE POLICY "Public can read table orders"
ON public.orders
FOR SELECT
TO anon
USING (channel = 'table');

-- Permitir que clientes anônimos vejam itens de pedidos de mesa
CREATE POLICY "Public can read table order items"
ON public.order_items
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.channel = 'table'
  )
);