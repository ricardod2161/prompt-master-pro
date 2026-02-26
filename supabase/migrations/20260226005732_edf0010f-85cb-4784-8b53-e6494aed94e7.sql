
-- Add variable price columns to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_variable_price boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_price numeric DEFAULT NULL;

-- Retrocompatibility: mark products with price=0 as variable price
UPDATE public.products SET is_variable_price = true WHERE price = 0;

COMMENT ON COLUMN public.products.is_variable_price IS 'Product has variable price defined by customer (e.g. portions by value/weight)';
COMMENT ON COLUMN public.products.min_price IS 'Minimum accepted price for variable price products';
COMMENT ON COLUMN public.products.max_price IS 'Maximum accepted price for variable price products';
