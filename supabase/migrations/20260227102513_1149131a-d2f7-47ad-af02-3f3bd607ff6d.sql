
CREATE TABLE public.audio_transcription_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
  message_id text,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'failed',
  failure_reason text,
  mimetype text,
  file_size integer,
  transcription_result text,
  retry_count integer DEFAULT 0,
  audio_base64 text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audio_transcription_logs_unit_id ON public.audio_transcription_logs(unit_id);
CREATE INDEX idx_audio_transcription_logs_created_at ON public.audio_transcription_logs(created_at DESC);
CREATE INDEX idx_audio_transcription_logs_status ON public.audio_transcription_logs(status);

ALTER TABLE public.audio_transcription_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audio logs for their units"
  ON public.audio_transcription_logs FOR SELECT
  USING (has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update audio logs for their units"
  ON public.audio_transcription_logs FOR UPDATE
  USING (has_unit_access(auth.uid(), unit_id));

CREATE POLICY "System can insert audio logs"
  ON public.audio_transcription_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update audio logs"
  ON public.audio_transcription_logs FOR UPDATE
  USING (true);

CREATE TRIGGER update_audio_transcription_logs_updated_at
  BEFORE UPDATE ON public.audio_transcription_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.audio_transcription_logs;
