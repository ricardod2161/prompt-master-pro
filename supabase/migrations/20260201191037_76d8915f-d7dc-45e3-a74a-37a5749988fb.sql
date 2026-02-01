-- Enable public read access to tables (for QR code ordering)
CREATE POLICY "Public can read tables"
ON public.tables
FOR SELECT
TO anon
USING (true);

-- Enable public read access to products (for menu display)
CREATE POLICY "Public can read products"
ON public.products
FOR SELECT
TO anon
USING (available = true);

-- Enable public read access to categories (for menu filtering)
CREATE POLICY "Public can read categories"
ON public.categories
FOR SELECT
TO anon
USING (active = true);

-- Enable public read access to units (for restaurant name display)
CREATE POLICY "Public can read units"
ON public.units
FOR SELECT
TO anon
USING (true);

-- Enable public insert on orders (for customer orders via QR code)
CREATE POLICY "Public can create orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (channel = 'table');

-- Enable public insert on order_items (for customer order items)
CREATE POLICY "Public can create order_items"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (true);