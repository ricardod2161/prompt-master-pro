-- Remover política pública da tabela tables também
DROP POLICY IF EXISTS "Public can read tables" ON public.tables;