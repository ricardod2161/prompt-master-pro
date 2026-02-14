
-- Create pix_transactions table
CREATE TABLE public.pix_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  transaction_id TEXT NOT NULL,
  pix_code TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_phone TEXT,
  customer_name TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_pix_transactions_unit_id ON public.pix_transactions(unit_id);
CREATE INDEX idx_pix_transactions_order_id ON public.pix_transactions(order_id);
CREATE INDEX idx_pix_transactions_status ON public.pix_transactions(status);
CREATE INDEX idx_pix_transactions_expires_at ON public.pix_transactions(expires_at) WHERE status = 'pending';
CREATE INDEX idx_pix_transactions_unit_generated ON public.pix_transactions(unit_id, generated_at DESC);

-- Enable RLS
ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;

-- Staff can read transactions for their unit
CREATE POLICY "Staff can read pix transactions"
  ON public.pix_transactions FOR SELECT
  USING (public.has_unit_access(auth.uid(), unit_id));

-- Staff can update transactions (confirm/cancel)
CREATE POLICY "Staff can update pix transactions"
  ON public.pix_transactions FOR UPDATE
  USING (public.has_unit_access(auth.uid(), unit_id));

-- Staff can insert pix transactions
CREATE POLICY "Staff can insert pix transactions"
  ON public.pix_transactions FOR INSERT
  WITH CHECK (public.has_unit_access(auth.uid(), unit_id));

-- Service role / edge functions can insert (anon for webhook)
CREATE POLICY "Anon can insert pix transactions"
  ON public.pix_transactions FOR INSERT
  WITH CHECK (true);

-- Public can read their own pix transaction by order tracking
CREATE POLICY "Public can read pix by order"
  ON public.pix_transactions FOR SELECT
  USING (
    order_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = pix_transactions.order_id
        AND o.tracking_token IS NOT NULL
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_transactions;

-- Function to expire old pending transactions
CREATE OR REPLACE FUNCTION public.expire_pending_pix_transactions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE public.pix_transactions
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;
