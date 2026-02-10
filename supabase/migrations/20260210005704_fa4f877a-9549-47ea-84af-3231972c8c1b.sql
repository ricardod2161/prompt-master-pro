
ALTER TABLE public.whatsapp_settings
ADD COLUMN tts_mode text NOT NULL DEFAULT 'auto',
ADD COLUMN tts_voice_id text NOT NULL DEFAULT 'FGY2WhTYpPnrIDTdsKH5';
