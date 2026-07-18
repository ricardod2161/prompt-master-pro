
-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_unit_id ON public.orders(unit_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_unit_created ON public.orders(unit_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON public.order_payments(order_id);

CREATE INDEX IF NOT EXISTS idx_products_unit_id ON public.products(unit_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(unit_id, available);
CREATE INDEX IF NOT EXISTS idx_categories_unit_id ON public.categories(unit_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_product_id ON public.product_addons(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product_id ON public.product_ingredients(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_items_unit_id ON public.inventory_items(unit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON public.inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON public.inventory_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_registers_unit_id ON public.cash_registers(unit_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_register_id ON public.cash_movements(cash_register_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_unit_id ON public.whatsapp_conversations(unit_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON public.whatsapp_conversations(unit_id, phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_updated ON public.whatsapp_conversations(unit_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON public.whatsapp_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_drivers_unit_id ON public.delivery_drivers(unit_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_driver_id ON public.delivery_orders(driver_id);

CREATE INDEX IF NOT EXISTS idx_marketing_images_unit_id ON public.marketing_images(unit_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_unit_id ON public.credit_transactions(unit_id);

CREATE INDEX IF NOT EXISTS idx_tables_unit_status ON public.tables(unit_id, status);
CREATE INDEX IF NOT EXISTS idx_bill_payments_unit_id ON public.bill_payments(unit_id);

CREATE INDEX IF NOT EXISTS idx_admin_logs_unit_id ON public.admin_logs(unit_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_units_user_id ON public.user_units(user_id);
CREATE INDEX IF NOT EXISTS idx_user_units_unit_id ON public.user_units(unit_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_access_overrides_user_id ON public.access_overrides(user_id);
