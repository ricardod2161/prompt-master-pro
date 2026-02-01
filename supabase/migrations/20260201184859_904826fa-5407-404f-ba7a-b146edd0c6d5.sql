ALTER TABLE public.unit_settings 
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '142 76% 36%',
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '217 91% 60%',
ADD COLUMN IF NOT EXISTS success_color text DEFAULT '142 76% 36%',
ADD COLUMN IF NOT EXISTS warning_color text DEFAULT '38 92% 50%',
ADD COLUMN IF NOT EXISTS error_color text DEFAULT '0 84% 60%',
ADD COLUMN IF NOT EXISTS sidebar_color text,
ADD COLUMN IF NOT EXISTS dark_mode_enabled boolean DEFAULT true;