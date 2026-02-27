CREATE TABLE public.access_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier text NOT NULL DEFAULT 'pro',
  granted_by uuid NOT NULL,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developer can manage overrides"
ON public.access_overrides FOR ALL
USING (is_developer(auth.uid()))
WITH CHECK (is_developer(auth.uid()));

CREATE TRIGGER update_access_overrides_updated_at
  BEFORE UPDATE ON public.access_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();