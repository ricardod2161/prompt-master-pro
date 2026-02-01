-- Create unit_settings table for operational configurations
CREATE TABLE public.unit_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE UNIQUE NOT NULL,
  auto_print_enabled boolean DEFAULT true,
  auto_notify_enabled boolean DEFAULT true,
  delivery_enabled boolean DEFAULT true,
  table_ordering_enabled boolean DEFAULT true,
  counter_ordering_enabled boolean DEFAULT true,
  whatsapp_ordering_enabled boolean DEFAULT true,
  default_preparation_time integer DEFAULT 30,
  service_fee_percentage numeric(5,2) DEFAULT 0,
  delivery_fee numeric(10,2) DEFAULT 0,
  min_delivery_order numeric(10,2) DEFAULT 0,
  opening_hours jsonb DEFAULT '{"monday":{"open":"08:00","close":"22:00","closed":false},"tuesday":{"open":"08:00","close":"22:00","closed":false},"wednesday":{"open":"08:00","close":"22:00","closed":false},"thursday":{"open":"08:00","close":"22:00","closed":false},"friday":{"open":"08:00","close":"23:00","closed":false},"saturday":{"open":"10:00","close":"23:00","closed":false},"sunday":{"open":"10:00","close":"20:00","closed":false}}',
  timezone text DEFAULT 'America/Sao_Paulo',
  currency text DEFAULT 'BRL',
  payment_methods jsonb DEFAULT '{"cash":true,"credit":true,"debit":true,"pix":true,"voucher":false}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unit_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view unit settings"
  ON public.unit_settings FOR SELECT
  USING (has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert unit settings"
  ON public.unit_settings FOR INSERT
  WITH CHECK (has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update unit settings"
  ON public.unit_settings FOR UPDATE
  USING (has_unit_access(auth.uid(), unit_id));

-- Trigger for updated_at
CREATE TRIGGER update_unit_settings_updated_at
  BEFORE UPDATE ON public.unit_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();