-- Table to track partial bill payments
CREATE TABLE public.bill_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  payment_method TEXT DEFAULT 'pix',
  split_type TEXT DEFAULT 'equal', -- 'equal', 'by_order', 'custom'
  split_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

-- Policy for public inserts (customers can pay without auth)
CREATE POLICY "Anyone can insert bill payments"
ON public.bill_payments
FOR INSERT
WITH CHECK (true);

-- Policy for selecting (needed for insert...returning)
CREATE POLICY "Anyone can select recent bill payments"
ON public.bill_payments
FOR SELECT
USING (created_at > now() - interval '24 hours');

-- Policy for unit staff to view all payments
CREATE POLICY "Unit staff can view all payments"
ON public.bill_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_units
    WHERE user_units.user_id = auth.uid()
      AND user_units.unit_id = bill_payments.unit_id
  )
);

-- Index for efficient queries
CREATE INDEX idx_bill_payments_table_id ON public.bill_payments(table_id);
CREATE INDEX idx_bill_payments_created_at ON public.bill_payments(created_at DESC);