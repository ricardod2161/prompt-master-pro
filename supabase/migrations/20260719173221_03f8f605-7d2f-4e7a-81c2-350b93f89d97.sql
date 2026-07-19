
-- Adiciona colunas de créditos e system_slug ao log de IA
ALTER TABLE public.ai_provider_logs
  ADD COLUMN IF NOT EXISTS credits_debited numeric(14,4),
  ADD COLUMN IF NOT EXISTS system_slug text;

CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_system_slug
  ON public.ai_provider_logs(system_slug);

-- Garante o ai_system "admin" (usado pelo analyze-logs)
INSERT INTO public.ai_systems (slug, name, description, provider, status)
VALUES ('admin', 'Admin / Diagnóstico', 'Análise de logs e diagnósticos operacionais', 'lovable', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.ai_system_wallets (system_id, available_credits, used_credits)
SELECT s.id, 0, 0 FROM public.ai_systems s
WHERE s.slug = 'admin'
  AND NOT EXISTS (SELECT 1 FROM public.ai_system_wallets w WHERE w.system_id = s.id);
