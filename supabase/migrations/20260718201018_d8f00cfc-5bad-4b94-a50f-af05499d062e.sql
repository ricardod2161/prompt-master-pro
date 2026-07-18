CREATE TABLE public.ai_provider_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  function_name text NOT NULL,
  provider text NOT NULL,
  model text,
  status text NOT NULL,
  http_status int,
  duration_ms int,
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  estimated_cost_usd numeric(10,6),
  fallback_used boolean NOT NULL DEFAULT false,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

GRANT SELECT ON public.ai_provider_logs TO authenticated;
GRANT ALL ON public.ai_provider_logs TO service_role;

ALTER TABLE public.ai_provider_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and developers can view AI logs"
ON public.ai_provider_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_developer(auth.uid())
);

CREATE INDEX idx_ai_logs_created_at ON public.ai_provider_logs (created_at DESC);
CREATE INDEX idx_ai_logs_provider_status ON public.ai_provider_logs (provider, status);
CREATE INDEX idx_ai_logs_unit_created ON public.ai_provider_logs (unit_id, created_at DESC);
CREATE INDEX idx_ai_logs_function ON public.ai_provider_logs (function_name, created_at DESC);