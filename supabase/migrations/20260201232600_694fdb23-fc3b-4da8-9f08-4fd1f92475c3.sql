-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error, order, payment, stock
  category TEXT NOT NULL DEFAULT 'system', -- system, order, payment, stock, whatsapp
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view notifications for their units
CREATE POLICY "Users can view notifications for their units"
  ON public.notifications
  FOR SELECT
  USING (
    public.has_unit_access(auth.uid(), unit_id)
    OR user_id = auth.uid()
    OR (unit_id IS NULL AND user_id IS NULL)
  );

-- Policy: Users can update (mark as read) their notifications
CREATE POLICY "Users can update their notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    public.has_unit_access(auth.uid(), unit_id)
    OR user_id = auth.uid()
  );

-- Policy: Users can delete their notifications
CREATE POLICY "Users can delete their notifications"
  ON public.notifications
  FOR DELETE
  USING (
    public.has_unit_access(auth.uid(), unit_id)
    OR user_id = auth.uid()
  );

-- Policy: System can insert notifications (via edge functions or triggers)
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_notifications_unit_id ON public.notifications(unit_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  _title TEXT,
  _message TEXT,
  _type TEXT DEFAULT 'info',
  _category TEXT DEFAULT 'system',
  _unit_id UUID DEFAULT NULL,
  _user_id UUID DEFAULT NULL,
  _action_url TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
BEGIN
  INSERT INTO public.notifications (title, message, type, category, unit_id, user_id, action_url, metadata)
  VALUES (_title, _message, _type, _category, _unit_id, _user_id, _action_url, _metadata)
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;