-- Fix missing GRANTs on ai_provider_logs so edge functions (service_role) can insert
GRANT SELECT ON public.ai_provider_logs TO authenticated;
GRANT ALL ON public.ai_provider_logs TO service_role;

-- Ensure realtime picks up inserts for live updates in the Admin panel
ALTER TABLE public.ai_provider_logs REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='ai_provider_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_provider_logs';
  END IF;
END $$;