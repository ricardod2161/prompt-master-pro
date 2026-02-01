-- Adicionar campos a whatsapp_messages para status de entrega e mídia
ALTER TABLE public.whatsapp_messages 
ADD COLUMN IF NOT EXISTS message_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'text' CHECK (media_type IN ('text', 'audio', 'image', 'document', 'video')),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_duration INTEGER,
ADD COLUMN IF NOT EXISTS media_caption TEXT,
ADD COLUMN IF NOT EXISTS transcription TEXT;

-- Criar índice para busca por message_id (para atualização de status)
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_id ON public.whatsapp_messages(message_id);

-- Criar tabela de typing status para indicadores em tempo real
CREATE TABLE IF NOT EXISTS public.whatsapp_typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT FALSE,
  is_recording BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 seconds'),
  UNIQUE(conversation_id)
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.whatsapp_typing_status ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso para typing_status
CREATE POLICY "Users can view typing status for their units"
ON public.whatsapp_typing_status
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.whatsapp_conversations c
    JOIN public.user_units uu ON c.unit_id = uu.unit_id
    WHERE c.id = whatsapp_typing_status.conversation_id
    AND uu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage typing status for their units"
ON public.whatsapp_typing_status
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.whatsapp_conversations c
    JOIN public.user_units uu ON c.unit_id = uu.unit_id
    WHERE c.id = whatsapp_typing_status.conversation_id
    AND uu.user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_typing_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.expires_at = now() + interval '30 seconds';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_whatsapp_typing_status_timestamp
BEFORE UPDATE ON public.whatsapp_typing_status
FOR EACH ROW
EXECUTE FUNCTION public.update_typing_status_timestamp();

-- Apenas adicionar typing_status ao realtime (whatsapp_messages já está)
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_typing_status;