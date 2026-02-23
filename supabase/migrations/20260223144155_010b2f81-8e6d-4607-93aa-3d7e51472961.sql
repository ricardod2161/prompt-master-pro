
-- Marketing credits per unit
CREATE TABLE public.marketing_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 3,
  used_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(unit_id)
);

ALTER TABLE public.marketing_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credits for their units"
  ON public.marketing_credits FOR SELECT
  USING (has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update credits for their units"
  ON public.marketing_credits FOR UPDATE
  USING (has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert credits for their units"
  ON public.marketing_credits FOR INSERT
  WITH CHECK (has_unit_access(auth.uid(), unit_id));

-- Credit transactions history
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('usage', 'purchase', 'bonus', 'monthly_reset')),
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credit transactions for their units"
  ON public.credit_transactions FOR SELECT
  USING (has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert credit transactions for their units"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (has_unit_access(auth.uid(), unit_id));

-- Function to consume a credit (atomic, prevents race conditions)
CREATE OR REPLACE FUNCTION public.consume_marketing_credit(_unit_id UUID, _user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _credits RECORD;
  _available INTEGER;
BEGIN
  -- Get or create credit record
  INSERT INTO public.marketing_credits (unit_id)
  VALUES (_unit_id)
  ON CONFLICT (unit_id) DO NOTHING;

  -- Lock and check
  SELECT * INTO _credits
  FROM public.marketing_credits
  WHERE unit_id = _unit_id
  FOR UPDATE;

  -- Check if monthly reset is needed
  IF _credits.reset_at <= now() THEN
    UPDATE public.marketing_credits
    SET used_credits = 0,
        total_credits = 3,
        reset_at = date_trunc('month', now()) + interval '1 month',
        updated_at = now()
    WHERE unit_id = _unit_id;

    INSERT INTO public.credit_transactions (unit_id, user_id, type, amount, description)
    VALUES (_unit_id, _user_id, 'monthly_reset', 3, 'Reset mensal de créditos gratuitos');

    -- Re-read
    SELECT * INTO _credits FROM public.marketing_credits WHERE unit_id = _unit_id;
  END IF;

  _available := (_credits.total_credits + _credits.bonus_credits) - _credits.used_credits;

  IF _available <= 0 THEN
    RETURN false;
  END IF;

  -- Consume
  UPDATE public.marketing_credits
  SET used_credits = used_credits + 1, updated_at = now()
  WHERE unit_id = _unit_id;

  INSERT INTO public.credit_transactions (unit_id, user_id, type, amount, description)
  VALUES (_unit_id, _user_id, 'usage', -1, 'Geração de imagem de marketing');

  RETURN true;
END;
$$;

-- Function to add purchased credits
CREATE OR REPLACE FUNCTION public.add_marketing_credits(_unit_id UUID, _user_id UUID, _amount INTEGER, _description TEXT DEFAULT 'Compra de créditos')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.marketing_credits (unit_id, bonus_credits)
  VALUES (_unit_id, _amount)
  ON CONFLICT (unit_id)
  DO UPDATE SET bonus_credits = marketing_credits.bonus_credits + _amount, updated_at = now();

  INSERT INTO public.credit_transactions (unit_id, user_id, type, amount, description)
  VALUES (_unit_id, _user_id, 'purchase', _amount, _description);
END;
$$;
