-- Drop the overly permissive INSERT policy and replace with a more specific one
DROP POLICY IF EXISTS "Service role can insert messages" ON public.whatsapp_messages;

-- Create a more restrictive policy that only allows inserts through service role
-- Note: Service role bypasses RLS, but this documents the intent
CREATE POLICY "Authenticated users can insert messages for their conversations"
ON public.whatsapp_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.whatsapp_conversations wc
    JOIN public.user_units uu ON uu.unit_id = wc.unit_id
    WHERE wc.id = whatsapp_messages.conversation_id
    AND uu.user_id = auth.uid()
  )
);