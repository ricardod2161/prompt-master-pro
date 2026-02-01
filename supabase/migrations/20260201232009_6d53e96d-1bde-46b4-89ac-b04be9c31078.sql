-- Criar tabela de logs administrativos do sistema
CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  category text NOT NULL DEFAULT 'system',
  description text,
  metadata jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX idx_admin_logs_category ON public.admin_logs(category);
CREATE INDEX idx_admin_logs_severity ON public.admin_logs(severity);
CREATE INDEX idx_admin_logs_user_id ON public.admin_logs(user_id);

-- Habilitar RLS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Apenas developer pode ver todos os logs
CREATE POLICY "Developer can view all logs" ON public.admin_logs
FOR SELECT TO authenticated
USING (is_developer(auth.uid()));

-- Developer pode inserir logs
CREATE POLICY "Developer can insert logs" ON public.admin_logs
FOR INSERT TO authenticated
WITH CHECK (is_developer(auth.uid()));

-- Sistema (service_role) pode inserir logs de qualquer lugar
CREATE POLICY "System can insert logs" ON public.admin_logs
FOR INSERT TO service_role
WITH CHECK (true);

-- Função helper para criar logs facilmente
CREATE OR REPLACE FUNCTION public.create_admin_log(
  _action text,
  _category text DEFAULT 'system',
  _description text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}',
  _user_id uuid DEFAULT NULL,
  _unit_id uuid DEFAULT NULL,
  _severity text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id uuid;
BEGIN
  INSERT INTO public.admin_logs (action, category, description, metadata, user_id, unit_id, severity)
  VALUES (_action, _category, _description, _metadata, _user_id, _unit_id, _severity)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;