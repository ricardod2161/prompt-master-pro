-- Add payment method and change columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS change_for NUMERIC;