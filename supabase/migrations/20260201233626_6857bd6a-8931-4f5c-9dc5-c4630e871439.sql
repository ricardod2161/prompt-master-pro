-- ============================================
-- STORAGE BUCKET PARA LOGOS DAS UNIDADES
-- ============================================

-- Criar bucket para logos (público para exibição)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'unit-logos',
  'unit-logos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket de logos
CREATE POLICY "Logos são visíveis publicamente"
ON storage.objects FOR SELECT
USING (bucket_id = 'unit-logos');

CREATE POLICY "Usuários autenticados podem fazer upload de logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'unit-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuários autenticados podem atualizar logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'unit-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuários autenticados podem deletar logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'unit-logos' 
  AND auth.role() = 'authenticated'
);

-- Adicionar coluna logo_url na tabela units
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS logo_url TEXT;