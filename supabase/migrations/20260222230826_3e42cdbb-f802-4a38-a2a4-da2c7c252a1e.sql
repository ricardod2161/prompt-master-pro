
-- Item 2: Atomic inventory movement RPC to prevent race conditions
CREATE OR REPLACE FUNCTION public.add_inventory_movement(
  _item_id uuid,
  _type inventory_movement_type,
  _quantity numeric,
  _notes text DEFAULT NULL,
  _created_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _previous_stock numeric;
  _new_stock numeric;
  _is_subtraction boolean;
BEGIN
  -- Lock the row to prevent concurrent modifications
  SELECT current_stock INTO _previous_stock
  FROM public.inventory_items
  WHERE id = _item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item de inventário não encontrado';
  END IF;

  _is_subtraction := _type IN ('sale', 'waste', 'transfer');
  
  IF _is_subtraction THEN
    _new_stock := _previous_stock - _quantity;
  ELSE
    _new_stock := _previous_stock + _quantity;
  END IF;

  -- Insert movement record
  INSERT INTO public.inventory_movements (
    inventory_item_id, type, quantity, previous_stock, new_stock, notes, created_by
  ) VALUES (
    _item_id, _type, _quantity, _previous_stock, _new_stock, _notes, _created_by
  );

  -- Update stock
  UPDATE public.inventory_items
  SET current_stock = _new_stock
  WHERE id = _item_id;
END;
$$;

-- Item 11: Cascading order delete RPC
CREATE OR REPLACE FUNCTION public.delete_order_cascade(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.order_items WHERE order_id = _order_id;
  DELETE FROM public.order_payments WHERE order_id = _order_id;
  DELETE FROM public.delivery_orders WHERE order_id = _order_id;
  DELETE FROM public.pix_transactions WHERE order_id = _order_id;
  DELETE FROM public.orders WHERE id = _order_id;
END;
$$;

-- Item 6: Restrict anonymous pix_transactions INSERT to valid orders only
DROP POLICY IF EXISTS "Anon can insert pix transactions" ON public.pix_transactions;
CREATE POLICY "Anon can insert pix transactions with valid order"
ON public.pix_transactions
FOR INSERT
WITH CHECK (
  order_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = pix_transactions.order_id
      AND o.unit_id = pix_transactions.unit_id
  )
);
