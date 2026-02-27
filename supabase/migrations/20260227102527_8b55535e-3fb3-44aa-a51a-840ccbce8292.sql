
-- Drop overly permissive policies, replace with proper ones
DROP POLICY IF EXISTS "System can insert audio logs" ON public.audio_transcription_logs;
DROP POLICY IF EXISTS "System can update audio logs" ON public.audio_transcription_logs;

-- Allow authenticated users with unit access to insert (for edge function via service role)
CREATE POLICY "Authenticated users can insert audio logs"
  ON public.audio_transcription_logs FOR INSERT
  WITH CHECK (has_unit_access(auth.uid(), unit_id) OR auth.role() = 'service_role');
