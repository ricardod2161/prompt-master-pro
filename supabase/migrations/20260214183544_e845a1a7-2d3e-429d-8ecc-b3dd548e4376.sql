-- Allow developer to delete profiles
CREATE POLICY "Developer can delete profiles"
ON public.profiles
FOR DELETE
USING (is_developer(auth.uid()));

-- Allow developer to delete orders (needed for cascading user cleanup)
CREATE POLICY "Developer can delete orders"
ON public.orders
FOR DELETE
USING (is_developer(auth.uid()));

-- Allow developer to delete order_items
CREATE POLICY "Developer can delete order_items"
ON public.order_items
FOR DELETE
USING (is_developer(auth.uid()));

-- Allow developer to delete order_payments
CREATE POLICY "Developer can delete order_payments"
ON public.order_payments
FOR DELETE
USING (is_developer(auth.uid()));

-- Allow developer to delete delivery_orders
CREATE POLICY "Developer can delete delivery_orders"
ON public.delivery_orders
FOR DELETE
USING (is_developer(auth.uid()));

-- Allow developer to delete notifications
CREATE POLICY "Developer can delete notifications"
ON public.notifications
FOR DELETE
USING (is_developer(auth.uid()));