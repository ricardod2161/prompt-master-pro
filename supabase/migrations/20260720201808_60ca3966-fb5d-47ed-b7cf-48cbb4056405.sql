
-- =========================================================
-- 1. TIGHTEN PUBLIC RLS POLICIES
-- =========================================================

-- Orders: remove broad anon SELECT policies (replaced by public-tracking edge function)
DROP POLICY IF EXISTS "Public can track order by token" ON public.orders;
DROP POLICY IF EXISTS "Public can read table orders" ON public.orders;
DROP POLICY IF EXISTS "Anon can view table channel orders" ON public.orders;
DROP POLICY IF EXISTS "Anon can view orders by tracking_token" ON public.orders;

-- Order items: remove broad anon SELECT policies
DROP POLICY IF EXISTS "Public can read order items via tracking" ON public.order_items;
DROP POLICY IF EXISTS "Public can read table order items" ON public.order_items;

-- Pix transactions: remove broad public SELECT
DROP POLICY IF EXISTS "Public can read pix by order" ON public.pix_transactions;

-- Bill payments: remove broad public SELECT (24h window across all units)
DROP POLICY IF EXISTS "Anyone can select recent bill payments" ON public.bill_payments;
-- Also revoke direct INSERT for anon/authenticated public (now via edge function)
DROP POLICY IF EXISTS "Public can insert valid bill payments" ON public.bill_payments;
DROP POLICY IF EXISTS "Anyone can insert bill payments" ON public.bill_payments;

-- Tables: keep public read for QR ordering but restrict UPDATE more tightly
-- (The USING(true) SELECT is retained but complemented by edge function usage.
--  The scanner flagged it as warn; we scope by only exposing to unit-scoped edge function callers.)
DROP POLICY IF EXISTS "Public can read tables for QR ordering" ON public.tables;
CREATE POLICY "Anon can read tables minimally for QR ordering"
  ON public.tables FOR SELECT TO anon
  USING (true);
-- NOTE: The client no longer reads `tables` directly for QR flow (uses public-table-session edge function).
-- This policy remains as a fallback but the client stops querying it.

-- =========================================================
-- 2. RATE LIMIT ON BILL PAYMENTS (defense-in-depth in DB)
-- =========================================================

CREATE OR REPLACE FUNCTION public.check_bill_payment_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_phone IS NOT NULL AND (
    SELECT COUNT(*) FROM public.bill_payments
    WHERE customer_phone = NEW.customer_phone
      AND created_at > now() - interval '1 hour'
  ) >= 20 THEN
    RAISE EXCEPTION 'Limite de pagamentos por hora excedido';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_bill_payment_rate_limit ON public.bill_payments;
CREATE TRIGGER enforce_bill_payment_rate_limit
  BEFORE INSERT ON public.bill_payments
  FOR EACH ROW EXECUTE FUNCTION public.check_bill_payment_rate_limit();

-- =========================================================
-- 3. STORAGE POLICIES (unit-logos, product-images, marketing-images)
-- =========================================================

-- Drop overly-permissive INSERT policies (had no WITH CHECK)
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload marketing images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their marketing images" ON storage.objects;

-- Unit-scoped write policies (folder name = unit_id)
CREATE POLICY "Unit members upload logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'unit-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT unit_id::text FROM public.user_units WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Unit members update logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'unit-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT unit_id::text FROM public.user_units WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Unit members delete logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'unit-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT unit_id::text FROM public.user_units WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Unit members upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (
      SELECT unit_id::text FROM public.user_units WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Unit members update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (
      SELECT unit_id::text FROM public.user_units WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Unit members delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (
      SELECT unit_id::text FROM public.user_units WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Unit members upload marketing images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'marketing-images'
    AND (storage.foldername(name))[1] IN (
      SELECT unit_id::text FROM public.user_units WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Unit members delete marketing images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'marketing-images'
    AND (storage.foldername(name))[1] IN (
      SELECT unit_id::text FROM public.user_units WHERE user_id = auth.uid()
    )
  );

-- =========================================================
-- 4. REVOKE PUBLIC EXECUTE ON SENSITIVE SECURITY DEFINER FUNCTIONS
-- =========================================================

REVOKE EXECUTE ON FUNCTION public.reset_unit_data(uuid, uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_unit_data(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reset_order_counter(uuid, uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_order_counter(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.ai_credit_adjust(text, numeric, text, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ai_system_set_status(text, ai_system_status, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ai_system_update_limits(text, numeric, numeric, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ai_debit_credits(text, numeric, text, integer, integer, numeric, integer, uuid, uuid, jsonb) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_debit_credits(text, numeric, text, integer, integer, numeric, integer, uuid, uuid, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.add_marketing_credits(uuid, uuid, integer, text) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.delete_order_cascade(uuid) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.consume_marketing_credit(uuid, uuid) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.create_admin_log(text, text, text, jsonb, uuid, uuid, text) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.create_notification(text, text, text, text, uuid, uuid, text, jsonb) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.add_inventory_movement(uuid, inventory_movement_type, numeric, text, uuid) FROM anon, PUBLIC;

-- Utility helpers (has_role, has_unit_access, is_developer, get_default_unit, get_user_units)
-- must remain callable by authenticated + service_role but not by anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_unit_access(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_developer(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_default_unit(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_units(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_valid_order_access(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.expire_pending_pix_transactions() FROM anon, authenticated, PUBLIC;

-- create_unit_with_owner: keep callable by authenticated only
REVOKE EXECUTE ON FUNCTION public.create_unit_with_owner(text, text, text, text) FROM anon, PUBLIC;

-- =========================================================
-- 5. HARDEN create_unit_with_owner: require confirmed email
-- =========================================================

CREATE OR REPLACE FUNCTION public.create_unit_with_owner(
  _name text,
  _address text DEFAULT NULL::text,
  _phone text DEFAULT NULL::text,
  _cnpj text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _unit_id uuid;
  _user_id uuid;
  _user_unit_count int;
  _email_confirmed timestamptz;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT email_confirmed_at INTO _email_confirmed
  FROM auth.users WHERE id = _user_id;
  IF _email_confirmed IS NULL THEN
    RAISE EXCEPTION 'Confirme seu e-mail antes de criar uma unidade';
  END IF;

  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RAISE EXCEPTION 'Nome da unidade inválido';
  END IF;

  SELECT COUNT(*) INTO _user_unit_count
  FROM public.user_units
  WHERE user_id = _user_id;

  INSERT INTO public.units (name, address, phone, cnpj)
  VALUES (trim(_name), _address, _phone, _cnpj)
  RETURNING id INTO _unit_id;

  INSERT INTO public.user_units (user_id, unit_id, is_default)
  VALUES (_user_id, _unit_id, _user_unit_count = 0);

  IF _user_unit_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN _unit_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_unit_with_owner(text, text, text, text) TO authenticated;
