
-- =========================================================
-- Multi-Wallet AI Credits Architecture
-- =========================================================

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE public.ai_system_status AS ENUM ('active', 'blocked', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_transaction_type AS ENUM ('debit','credit','refund','monthly_reset','admin_adjust');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. ai_systems
CREATE TABLE IF NOT EXISTS public.ai_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  status public.ai_system_status NOT NULL DEFAULT 'active',
  provider text NOT NULL DEFAULT 'lovable',
  default_model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  api_key_secret_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_systems TO authenticated;
GRANT ALL ON public.ai_systems TO service_role;
ALTER TABLE public.ai_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/devs read ai_systems" ON public.ai_systems
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_developer(auth.uid()));

CREATE TRIGGER trg_ai_systems_updated
  BEFORE UPDATE ON public.ai_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. ai_system_wallets
CREATE TABLE IF NOT EXISTS public.ai_system_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid NOT NULL UNIQUE REFERENCES public.ai_systems(id) ON DELETE CASCADE,
  available_credits numeric(14,4) NOT NULL DEFAULT 0,
  used_credits numeric(14,4) NOT NULL DEFAULT 0,
  monthly_limit numeric(14,4),
  daily_limit numeric(14,4),
  last_reset_at timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  last_used_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_system_wallets TO authenticated;
GRANT ALL ON public.ai_system_wallets TO service_role;
ALTER TABLE public.ai_system_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/devs read wallets" ON public.ai_system_wallets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_developer(auth.uid()));

CREATE TRIGGER trg_ai_wallets_updated
  BEFORE UPDATE ON public.ai_system_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. ai_system_transactions
CREATE TABLE IF NOT EXISTS public.ai_system_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid NOT NULL REFERENCES public.ai_systems(id) ON DELETE CASCADE,
  user_id uuid,
  unit_id uuid,
  type public.ai_transaction_type NOT NULL,
  amount numeric(14,4) NOT NULL,
  model text,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  estimated_cost_usd numeric(12,6) DEFAULT 0,
  response_time_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_tx_system_created ON public.ai_system_transactions(system_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tx_created ON public.ai_system_transactions(created_at DESC);
GRANT SELECT ON public.ai_system_transactions TO authenticated;
GRANT ALL ON public.ai_system_transactions TO service_role;
ALTER TABLE public.ai_system_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/devs read tx" ON public.ai_system_transactions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_developer(auth.uid()));

-- 5. RPC: debit
CREATE OR REPLACE FUNCTION public.ai_debit_credits(
  _system_slug text,
  _amount numeric,
  _model text DEFAULT NULL,
  _tokens_in integer DEFAULT 0,
  _tokens_out integer DEFAULT 0,
  _cost_usd numeric DEFAULT 0,
  _response_ms integer DEFAULT NULL,
  _user_id uuid DEFAULT NULL,
  _unit_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _sys public.ai_systems;
  _w public.ai_system_wallets;
  _today_used numeric;
  _month_used numeric;
BEGIN
  SELECT * INTO _sys FROM public.ai_systems WHERE slug = _system_slug;
  IF NOT FOUND THEN RAISE EXCEPTION 'AI_SYSTEM_NOT_FOUND: %', _system_slug; END IF;
  IF _sys.status <> 'active' THEN RAISE EXCEPTION 'AI_SYSTEM_BLOCKED: %', _system_slug; END IF;

  SELECT * INTO _w FROM public.ai_system_wallets WHERE system_id = _sys.id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'AI_WALLET_NOT_FOUND: %', _system_slug; END IF;

  IF _w.available_credits < _amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS: system=% available=% needed=%',
      _system_slug, _w.available_credits, _amount;
  END IF;

  IF _w.daily_limit IS NOT NULL THEN
    SELECT COALESCE(SUM(ABS(amount)),0) INTO _today_used
    FROM public.ai_system_transactions
    WHERE system_id=_sys.id AND type='debit' AND created_at >= date_trunc('day', now());
    IF _today_used + _amount > _w.daily_limit THEN
      RAISE EXCEPTION 'DAILY_LIMIT_EXCEEDED: %', _system_slug;
    END IF;
  END IF;

  IF _w.monthly_limit IS NOT NULL THEN
    SELECT COALESCE(SUM(ABS(amount)),0) INTO _month_used
    FROM public.ai_system_transactions
    WHERE system_id=_sys.id AND type='debit' AND created_at >= date_trunc('month', now());
    IF _month_used + _amount > _w.monthly_limit THEN
      RAISE EXCEPTION 'MONTHLY_LIMIT_EXCEEDED: %', _system_slug;
    END IF;
  END IF;

  UPDATE public.ai_system_wallets
     SET available_credits = available_credits - _amount,
         used_credits = used_credits + _amount,
         last_used_at = now(),
         updated_at = now()
   WHERE system_id = _sys.id;

  INSERT INTO public.ai_system_transactions
    (system_id, user_id, unit_id, type, amount, model, tokens_input, tokens_output,
     estimated_cost_usd, response_time_ms, metadata)
  VALUES
    (_sys.id, _user_id, _unit_id, 'debit', -_amount, _model, _tokens_in, _tokens_out,
     _cost_usd, _response_ms, _metadata);

  RETURN jsonb_build_object('ok',true,'system',_system_slug,'debited',_amount);
END; $$;

REVOKE ALL ON FUNCTION public.ai_debit_credits(text,numeric,text,integer,integer,numeric,integer,uuid,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_debit_credits(text,numeric,text,integer,integer,numeric,integer,uuid,uuid,jsonb) TO service_role, authenticated;

-- 6. RPC: admin adjust (add/remove credits)
CREATE OR REPLACE FUNCTION public.ai_credit_adjust(
  _system_slug text,
  _amount numeric,
  _reason text DEFAULT 'admin adjust',
  _actor uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _sys public.ai_systems;
BEGIN
  IF _actor IS NULL THEN _actor := auth.uid(); END IF;
  IF NOT (public.has_role(_actor,'admin') OR public.is_developer(_actor)) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO _sys FROM public.ai_systems WHERE slug = _system_slug;
  IF NOT FOUND THEN RAISE EXCEPTION 'AI_SYSTEM_NOT_FOUND'; END IF;

  UPDATE public.ai_system_wallets
     SET available_credits = GREATEST(0, available_credits + _amount),
         updated_at = now()
   WHERE system_id = _sys.id;

  INSERT INTO public.ai_system_transactions (system_id, user_id, type, amount, metadata)
  VALUES (_sys.id, _actor,
          CASE WHEN _amount >= 0 THEN 'admin_adjust' ELSE 'admin_adjust' END,
          _amount, jsonb_build_object('reason', _reason));

  INSERT INTO public.admin_logs (action, category, user_id, severity, metadata)
  VALUES ('Ajuste de créditos IA: '||_system_slug||' ('||_amount||')', 'ai', _actor, 'info',
          jsonb_build_object('system', _system_slug, 'amount', _amount, 'reason', _reason));

  RETURN jsonb_build_object('ok', true);
END; $$;

REVOKE ALL ON FUNCTION public.ai_credit_adjust(text,numeric,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_credit_adjust(text,numeric,text,uuid) TO authenticated, service_role;

-- 7. RPC: set status (block/unblock)
CREATE OR REPLACE FUNCTION public.ai_system_set_status(
  _system_slug text,
  _status public.ai_system_status,
  _actor uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF _actor IS NULL THEN _actor := auth.uid(); END IF;
  IF NOT (public.has_role(_actor,'admin') OR public.is_developer(_actor)) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  UPDATE public.ai_systems SET status = _status, updated_at = now() WHERE slug = _system_slug;
  INSERT INTO public.admin_logs (action, category, user_id, severity)
  VALUES ('Sistema IA '||_system_slug||' -> '||_status::text, 'ai', _actor, 'warning');
END; $$;

REVOKE ALL ON FUNCTION public.ai_system_set_status(text, public.ai_system_status, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_system_set_status(text, public.ai_system_status, uuid) TO authenticated, service_role;

-- 8. RPC: update limits
CREATE OR REPLACE FUNCTION public.ai_system_update_limits(
  _system_slug text,
  _daily numeric DEFAULT NULL,
  _monthly numeric DEFAULT NULL,
  _actor uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _sys_id uuid;
BEGIN
  IF _actor IS NULL THEN _actor := auth.uid(); END IF;
  IF NOT (public.has_role(_actor,'admin') OR public.is_developer(_actor)) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  SELECT id INTO _sys_id FROM public.ai_systems WHERE slug=_system_slug;
  IF _sys_id IS NULL THEN RAISE EXCEPTION 'AI_SYSTEM_NOT_FOUND'; END IF;
  UPDATE public.ai_system_wallets
    SET daily_limit = _daily, monthly_limit = _monthly, updated_at = now()
    WHERE system_id = _sys_id;
END; $$;

REVOKE ALL ON FUNCTION public.ai_system_update_limits(text,numeric,numeric,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_system_update_limits(text,numeric,numeric,uuid) TO authenticated, service_role;

-- 9. Seed
INSERT INTO public.ai_systems (slug, name, description, icon, status, default_model) VALUES
  ('restaurant', 'Restaurante',   'Módulo de pedidos, cardápio e KDS', 'utensils',   'active', 'google/gemini-2.5-flash'),
  ('whatsapp',   'WhatsApp Bot',  'Atendimento automatizado via WhatsApp', 'message-circle', 'active', 'google/gemini-2.5-pro'),
  ('marketing',  'Marketing',     'Geração de imagens e conteúdos', 'megaphone', 'active', 'google/gemini-2.5-flash-image'),
  ('clinic',     'Clínica',       'Sistema para clínicas',     'stethoscope', 'suspended', 'google/gemini-2.5-flash'),
  ('crm',        'CRM',           'Gestão de clientes',        'users',       'suspended', 'google/gemini-2.5-flash'),
  ('financial',  'Financeiro',    'Módulo financeiro',         'dollar-sign', 'suspended', 'google/gemini-2.5-flash'),
  ('realestate', 'Imobiliária',   'Sistema imobiliário',       'home',        'suspended', 'google/gemini-2.5-flash'),
  ('legal',      'Jurídico',      'Sistema jurídico',          'scale',       'suspended', 'google/gemini-2.5-flash'),
  ('inventory',  'Estoque',       'Gestão de estoque',         'package',     'suspended', 'google/gemini-2.5-flash'),
  ('support',    'Atendimento',   'Suporte ao cliente',        'headphones',  'suspended', 'google/gemini-2.5-flash')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.ai_system_wallets (system_id, available_credits)
SELECT id, 0 FROM public.ai_systems
ON CONFLICT (system_id) DO NOTHING;
