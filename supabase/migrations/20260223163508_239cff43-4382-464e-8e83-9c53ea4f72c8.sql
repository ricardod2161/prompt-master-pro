
-- Criar funcao reset_order_counter
CREATE OR REPLACE FUNCTION public.reset_order_counter(_unit_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (has_unit_access(_user_id, _unit_id) AND 
         (has_role(_user_id, 'admin') OR is_developer(_user_id))) THEN
    RAISE EXCEPTION 'Sem permissao';
  END IF;

  ALTER SEQUENCE public.orders_order_number_seq RESTART WITH 1;

  INSERT INTO admin_logs (action, category, user_id, unit_id, severity)
  VALUES ('Contador de pedidos resetado', 'system', _user_id, _unit_id, 'warning');
END;
$$;

-- Atualizar reset_unit_data para tambem resetar o contador
CREATE OR REPLACE FUNCTION public.reset_unit_data(_unit_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (has_unit_access(_user_id, _unit_id) AND 
         (has_role(_user_id, 'admin') OR is_developer(_user_id))) THEN
    RAISE EXCEPTION 'Sem permissao para resetar esta unidade';
  END IF;

  DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE unit_id = _unit_id);
  DELETE FROM order_payments WHERE order_id IN (SELECT id FROM orders WHERE unit_id = _unit_id);
  DELETE FROM delivery_orders WHERE order_id IN (SELECT id FROM orders WHERE unit_id = _unit_id);
  DELETE FROM pix_transactions WHERE unit_id = _unit_id;
  DELETE FROM orders WHERE unit_id = _unit_id;
  DELETE FROM product_variations WHERE product_id IN (SELECT id FROM products WHERE unit_id = _unit_id);
  DELETE FROM product_addons WHERE product_id IN (SELECT id FROM products WHERE unit_id = _unit_id);
  DELETE FROM product_ingredients WHERE product_id IN (SELECT id FROM products WHERE unit_id = _unit_id);
  DELETE FROM products WHERE unit_id = _unit_id;
  DELETE FROM categories WHERE unit_id = _unit_id;
  DELETE FROM inventory_movements WHERE inventory_item_id IN (SELECT id FROM inventory_items WHERE unit_id = _unit_id);
  DELETE FROM inventory_items WHERE unit_id = _unit_id;
  DELETE FROM tables WHERE unit_id = _unit_id;
  DELETE FROM whatsapp_messages WHERE conversation_id IN (SELECT id FROM whatsapp_conversations WHERE unit_id = _unit_id);
  DELETE FROM whatsapp_typing_status WHERE conversation_id IN (SELECT id FROM whatsapp_conversations WHERE unit_id = _unit_id);
  DELETE FROM whatsapp_conversations WHERE unit_id = _unit_id;
  DELETE FROM whatsapp_settings WHERE unit_id = _unit_id;
  DELETE FROM notifications WHERE unit_id = _unit_id;
  DELETE FROM admin_logs WHERE unit_id = _unit_id;
  DELETE FROM marketing_images WHERE unit_id = _unit_id;
  DELETE FROM credit_transactions WHERE unit_id = _unit_id;
  DELETE FROM marketing_credits WHERE unit_id = _unit_id;
  DELETE FROM bill_payments WHERE unit_id = _unit_id;
  DELETE FROM cash_movements WHERE cash_register_id IN (SELECT id FROM cash_registers WHERE unit_id = _unit_id);
  DELETE FROM cash_registers WHERE unit_id = _unit_id;
  DELETE FROM prompt_history WHERE unit_id = _unit_id;
  DELETE FROM unit_settings WHERE unit_id = _unit_id;

  -- Resetar contador de pedidos
  ALTER SEQUENCE public.orders_order_number_seq RESTART WITH 1;

  INSERT INTO admin_logs (action, category, user_id, severity, description)
  VALUES ('Reset completo de unidade', 'system', _user_id, 'warning', 
          'Unidade ' || _unit_id || ' foi resetada');
END;
$$;
