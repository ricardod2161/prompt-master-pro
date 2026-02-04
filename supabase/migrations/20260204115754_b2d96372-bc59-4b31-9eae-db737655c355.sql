CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Gerar token apenas para pedidos de mesa
  IF NEW.channel = 'table' AND NEW.tracking_token IS NULL THEN
    -- Usar schema completo para evitar erro de search_path
    NEW.tracking_token := encode(extensions.gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$function$;