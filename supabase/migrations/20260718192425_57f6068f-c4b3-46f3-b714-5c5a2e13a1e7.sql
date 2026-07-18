
-- 1) bill_payments: validar que a mesa existe e pertence à unidade informada
DROP POLICY IF EXISTS "Anyone can insert bill payments" ON public.bill_payments;
CREATE POLICY "Public can insert valid bill payments"
  ON public.bill_payments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    amount > 0
    AND EXISTS (
      SELECT 1 FROM public.tables t
      WHERE t.id = bill_payments.table_id
        AND t.unit_id = bill_payments.unit_id
    )
  );

-- 2) tables (anon): só permitir ocupar mesas livres
DROP POLICY IF EXISTS "Anon can update table status to occupied" ON public.tables;
CREATE POLICY "Anon can occupy free tables only"
  ON public.tables
  FOR UPDATE
  TO anon
  USING (status = 'free'::table_status)
  WITH CHECK (status = 'occupied'::table_status);

-- 3) units INSERT: exigir autenticação
DROP POLICY IF EXISTS "Authenticated users can create units" ON public.units;
CREATE POLICY "Authenticated users can create units"
  ON public.units
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4) admin_logs INSERT: exigir autenticação
DROP POLICY IF EXISTS "System can insert logs" ON public.admin_logs;
CREATE POLICY "Authenticated can insert logs"
  ON public.admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5) Revogar EXECUTE público em funções administrativas sensíveis
REVOKE EXECUTE ON FUNCTION public.reset_unit_data(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reset_order_counter(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_marketing_credits(uuid, uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_marketing_credit(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_inventory_movement(uuid, inventory_movement_type, numeric, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_order_cascade(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_admin_log(text, text, text, jsonb, uuid, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_notification(text, text, text, text, uuid, uuid, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.expire_pending_pix_transactions() FROM PUBLIC, anon, authenticated;

-- 6) Revogar EXECUTE de funções de trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_low_stock() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_tracking_token() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_unit_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_typing_status_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_table_status_change() FROM PUBLIC, anon, authenticated;
