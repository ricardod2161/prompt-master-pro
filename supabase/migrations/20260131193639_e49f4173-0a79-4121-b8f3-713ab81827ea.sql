-- Create whatsapp_messages table for conversation history
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users with unit access
CREATE POLICY "Users can view messages from their unit conversations"
ON public.whatsapp_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.whatsapp_conversations wc
    JOIN public.user_units uu ON uu.unit_id = wc.unit_id
    WHERE wc.id = whatsapp_messages.conversation_id
    AND uu.user_id = auth.uid()
  )
);

-- Service role can insert (for webhook)
CREATE POLICY "Service role can insert messages"
ON public.whatsapp_messages
FOR INSERT
WITH CHECK (true);

-- Enable realtime for whatsapp_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;

-- Create index for faster lookups
CREATE INDEX idx_whatsapp_messages_conversation_id ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);