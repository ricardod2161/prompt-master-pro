-- Criar tabela para captura de leads
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  restaurant_name TEXT,
  employee_count TEXT,
  message TEXT,
  source TEXT DEFAULT 'landing_page',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Permitir inserção pública (visitantes da landing page)
CREATE POLICY "Allow public insert on leads"
  ON public.leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Permitir leitura apenas para usuários autenticados
CREATE POLICY "Allow authenticated users to read leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

-- Permitir atualização apenas para usuários autenticados
CREATE POLICY "Allow authenticated users to update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();