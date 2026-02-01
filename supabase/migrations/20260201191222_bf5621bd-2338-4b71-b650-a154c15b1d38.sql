-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can create order_items" ON public.order_items;

-- Create a more restrictive policy that verifies the order belongs to a table channel
CREATE POLICY "Public can create order_items for table orders"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.channel = 'table'
  )
);