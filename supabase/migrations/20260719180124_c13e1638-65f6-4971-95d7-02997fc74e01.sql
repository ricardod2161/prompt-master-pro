GRANT ALL ON public.ai_provider_logs TO service_role;
GRANT SELECT ON public.ai_provider_logs TO authenticated;

GRANT ALL ON public.ai_system_transactions TO service_role;
GRANT SELECT ON public.ai_system_transactions TO authenticated;

GRANT ALL ON public.ai_system_wallets TO service_role;
GRANT SELECT, UPDATE ON public.ai_system_wallets TO authenticated;

GRANT ALL ON public.ai_systems TO service_role;
GRANT SELECT, UPDATE ON public.ai_systems TO authenticated;

GRANT ALL ON public.ai_model_pricing TO service_role;
GRANT SELECT ON public.ai_model_pricing TO authenticated;

GRANT EXECUTE ON FUNCTION public.ai_debit_credits(text, numeric, text, integer, integer, numeric, integer, uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_credit_adjust(text, numeric, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_system_set_status(text, public.ai_system_status, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_system_update_limits(text, numeric, numeric, uuid) TO authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ai_provider_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_provider_logs;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ai_system_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_system_transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ai_system_wallets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_system_wallets;
  END IF;
END $$;