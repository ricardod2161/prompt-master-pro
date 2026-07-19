
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
          'admin_adjust'::public.ai_transaction_type,
          _amount, jsonb_build_object('reason', _reason));

  INSERT INTO public.admin_logs (action, category, user_id, severity, metadata)
  VALUES ('Ajuste de créditos IA: '||_system_slug||' ('||_amount||')', 'ai', _actor, 'info',
          jsonb_build_object('system', _system_slug, 'amount', _amount, 'reason', _reason));

  RETURN jsonb_build_object('ok', true);
END; $$;
