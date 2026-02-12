
-- Tabela de histórico de prompts
CREATE TABLE public.prompt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  form_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca por unidade
CREATE INDEX idx_prompt_history_unit_id ON public.prompt_history(unit_id);
CREATE INDEX idx_prompt_history_created_at ON public.prompt_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados com acesso à unidade
CREATE POLICY "Users can view prompt history of their units"
ON public.prompt_history FOR SELECT
USING (public.has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert prompt history for their units"
ON public.prompt_history FOR INSERT
WITH CHECK (public.has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete prompt history of their units"
ON public.prompt_history FOR DELETE
USING (public.has_unit_access(auth.uid(), unit_id));
