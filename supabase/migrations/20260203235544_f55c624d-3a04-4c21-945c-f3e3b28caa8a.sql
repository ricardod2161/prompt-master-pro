-- Política para permitir leitura pública de mesas (para QR Code)
CREATE POLICY "Public can read tables for QR ordering"
ON public.tables
FOR SELECT
USING (true);

-- Política para permitir leitura pública de produtos (para cardápio)
CREATE POLICY "Public can read available products"
ON public.products
FOR SELECT
USING (available = true);

-- Política para permitir leitura pública de categorias (para cardápio)
CREATE POLICY "Public can read active categories"
ON public.categories
FOR SELECT
USING (active = true);

-- Política para permitir leitura pública de unidades (para nome do restaurante)
CREATE POLICY "Public can read units"
ON public.units
FOR SELECT
USING (true);