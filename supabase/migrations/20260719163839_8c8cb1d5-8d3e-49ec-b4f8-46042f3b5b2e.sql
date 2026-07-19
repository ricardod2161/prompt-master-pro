
-- 1) Fix ledger inconsistency: use REAL applied delta in transaction record
CREATE OR REPLACE FUNCTION public.ai_credit_adjust(
  _system_slug text,
  _amount numeric,
  _reason text DEFAULT 'admin adjust'::text,
  _actor uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _sys public.ai_systems;
  _saldo_antes numeric;
  _saldo_depois numeric;
  _delta numeric;
BEGIN
  IF _actor IS NULL THEN _actor := auth.uid(); END IF;
  IF NOT (public.has_role(_actor,'admin') OR public.is_developer(_actor)) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO _sys FROM public.ai_systems WHERE slug = _system_slug;
  IF NOT FOUND THEN RAISE EXCEPTION 'AI_SYSTEM_NOT_FOUND'; END IF;

  SELECT available_credits INTO _saldo_antes
    FROM public.ai_system_wallets WHERE system_id = _sys.id FOR UPDATE;

  UPDATE public.ai_system_wallets
     SET available_credits = GREATEST(0, available_credits + _amount),
         updated_at = now()
   WHERE system_id = _sys.id
   RETURNING available_credits INTO _saldo_depois;

  _delta := _saldo_depois - _saldo_antes;

  INSERT INTO public.ai_system_transactions (system_id, user_id, type, amount, metadata)
  VALUES (_sys.id, _actor,
          'admin_adjust'::public.ai_transaction_type,
          _delta,
          jsonb_build_object('reason', _reason, 'requested', _amount, 'applied', _delta));

  INSERT INTO public.admin_logs (action, category, user_id, severity, metadata)
  VALUES ('Ajuste de créditos IA: '||_system_slug||' ('||_delta||')', 'ai', _actor, 'info',
          jsonb_build_object('system', _system_slug, 'requested', _amount, 'applied', _delta, 'reason', _reason));

  RETURN jsonb_build_object('ok', true, 'requested', _amount, 'applied', _delta,
                            'previous', _saldo_antes, 'current', _saldo_depois);
END; $function$;

-- 2) Register 'admin' system (used by analyze-logs)
INSERT INTO public.ai_systems (slug, name, description, status, provider, default_model)
VALUES ('admin', 'Admin / Diagnóstico', 'Análise de logs e diagnósticos do sistema', 'active', 'lovable', 'google/gemini-3-flash-preview')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.ai_system_wallets (system_id, available_credits, used_credits)
SELECT id, 0, 0 FROM public.ai_systems WHERE slug = 'admin'
ON CONFLICT (system_id) DO NOTHING;

-- 3) Centralized model pricing (per 1M tokens, USD)
CREATE TABLE IF NOT EXISTS public.ai_model_pricing (
  model text PRIMARY KEY,
  price_per_1m_tokens numeric NOT NULL DEFAULT 1.0,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_model_pricing TO authenticated;
GRANT ALL ON public.ai_model_pricing TO service_role;

ALTER TABLE public.ai_model_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_model_pricing_select_auth" ON public.ai_model_pricing;
CREATE POLICY "ai_model_pricing_select_auth"
  ON public.ai_model_pricing FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ai_model_pricing_admin_write" ON public.ai_model_pricing;
CREATE POLICY "ai_model_pricing_admin_write"
  ON public.ai_model_pricing FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_developer(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_developer(auth.uid()));

CREATE OR REPLACE TRIGGER trg_ai_model_pricing_updated
BEFORE UPDATE ON public.ai_model_pricing
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ai_model_pricing (model, price_per_1m_tokens) VALUES
  ('google/gemini-2.5-flash', 0.30),
  ('google/gemini-2.5-flash-image', 0.30),
  ('google/gemini-3-flash-preview', 0.35),
  ('google/gemini-2.5-pro', 3.50),
  ('google/gemini-3-pro-image-preview', 5.00),
  ('google/gemini-3.1-pro-preview', 5.00),
  ('openai/gpt-5', 5.00),
  ('openai/gpt-5-mini', 0.50),
  ('openai/gpt-5.5', 5.00),
  ('gpt-4o-mini', 0.30),
  ('gpt-4o', 5.00)
ON CONFLICT (model) DO NOTHING;
