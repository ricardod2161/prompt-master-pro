-- =====================================================
-- CORREÇÃO DE SEGURANÇA: Notificações e WhatsApp
-- =====================================================

-- 1. Corrigir política de notificações que expõe dados publicamente
-- Remove a condição (unit_id IS NULL AND user_id IS NULL) que permite leitura pública
DROP POLICY IF EXISTS "Users can view notifications for their units" ON notifications;

CREATE POLICY "Users can view notifications for their units"
ON notifications FOR SELECT
TO authenticated
USING (
  has_unit_access(auth.uid(), unit_id) 
  OR (user_id = auth.uid())
);

-- 2. Criar view segura para WhatsApp settings (oculta api_token e api_url)
CREATE OR REPLACE VIEW public.whatsapp_settings_public
WITH (security_invoker = on) AS
SELECT 
  id, 
  unit_id, 
  instance_name, 
  bot_enabled, 
  welcome_message, 
  system_prompt, 
  created_at, 
  updated_at
FROM public.whatsapp_settings;

-- Comentário: api_token e api_url ficam ocultos nesta view
COMMENT ON VIEW public.whatsapp_settings_public IS 'View segura que oculta credenciais sensíveis (api_token, api_url)';