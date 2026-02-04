-- Adicionar campos para configuração profissional do Pix
ALTER TABLE public.unit_settings
ADD COLUMN IF NOT EXISTS pix_merchant_name TEXT,
ADD COLUMN IF NOT EXISTS pix_merchant_city TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.unit_settings.pix_merchant_name IS 'Nome do beneficiário como registrado no Pix (aparece no comprovante)';
COMMENT ON COLUMN public.unit_settings.pix_merchant_city IS 'Cidade do beneficiário (obrigatório no padrão EMV do Pix)';