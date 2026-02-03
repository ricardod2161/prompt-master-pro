-- Add password protection column to whatsapp_settings
ALTER TABLE public.whatsapp_settings 
ADD COLUMN settings_password TEXT DEFAULT NULL;