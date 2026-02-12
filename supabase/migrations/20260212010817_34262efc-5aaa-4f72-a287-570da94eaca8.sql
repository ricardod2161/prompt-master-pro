
-- Tabela de variações de produtos
CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  delivery_price NUMERIC,
  available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Novo campo variation_name em order_items
ALTER TABLE public.order_items ADD COLUMN variation_name TEXT;

-- RLS para product_variations
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- SELECT: usuários autenticados com acesso à unidade do produto
CREATE POLICY "Users can view variations of their products"
ON public.product_variations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_units uu ON uu.unit_id = p.unit_id
    WHERE p.id = product_variations.product_id
    AND uu.user_id = auth.uid()
  )
);

-- INSERT
CREATE POLICY "Users can create variations for their products"
ON public.product_variations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_units uu ON uu.unit_id = p.unit_id
    WHERE p.id = product_variations.product_id
    AND uu.user_id = auth.uid()
  )
);

-- UPDATE
CREATE POLICY "Users can update variations of their products"
ON public.product_variations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_units uu ON uu.unit_id = p.unit_id
    WHERE p.id = product_variations.product_id
    AND uu.user_id = auth.uid()
  )
);

-- DELETE
CREATE POLICY "Users can delete variations of their products"
ON public.product_variations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_units uu ON uu.unit_id = p.unit_id
    WHERE p.id = product_variations.product_id
    AND uu.user_id = auth.uid()
  )
);

-- Acesso público para leitura (cardápio digital)
CREATE POLICY "Public can view available variations"
ON public.product_variations FOR SELECT
USING (
  available = true
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_variations.product_id
    AND p.available = true
  )
);

-- Índice para performance
CREATE INDEX idx_product_variations_product_id ON public.product_variations(product_id);
