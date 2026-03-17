
-- Add occupied_at column to tables to track when a table became occupied
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS occupied_at timestamp with time zone NULL;

-- Create trigger function to auto-set occupied_at when status changes
CREATE OR REPLACE FUNCTION public.handle_table_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set occupied_at when table becomes occupied or pending_order
  IF NEW.status IN ('occupied', 'pending_order') AND OLD.status = 'free' THEN
    NEW.occupied_at = now();
  END IF;
  -- Clear occupied_at when table is freed
  IF NEW.status = 'free' THEN
    NEW.occupied_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_table_status_change ON public.tables;
CREATE TRIGGER on_table_status_change
  BEFORE UPDATE OF status ON public.tables
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_table_status_change();
