-- Add pix_key column to unit_settings for Pix payments
ALTER TABLE public.unit_settings
ADD COLUMN IF NOT EXISTS pix_key TEXT;

COMMENT ON COLUMN public.unit_settings.pix_key IS 'Chave Pix para recebimento de pagamentos (CPF, CNPJ, email, telefone ou chave aleatória)';