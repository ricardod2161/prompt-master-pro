-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier', 'kitchen', 'waiter');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'ready', 'delivered', 'cancelled');

-- Create enum for order channel
CREATE TYPE public.order_channel AS ENUM ('whatsapp', 'table', 'counter', 'delivery');

-- Create enum for kitchen item status
CREATE TYPE public.kitchen_status AS ENUM ('pending', 'preparing', 'ready');

-- Create enum for table status
CREATE TYPE public.table_status AS ENUM ('free', 'occupied', 'pending_order');

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM ('cash', 'credit', 'debit', 'pix', 'voucher');

-- Create enum for cash movement type
CREATE TYPE public.cash_movement_type AS ENUM ('opening', 'sale', 'withdrawal', 'deposit', 'closing');

-- Create enum for inventory movement type
CREATE TYPE public.inventory_movement_type AS ENUM ('purchase', 'sale', 'adjustment', 'waste', 'transfer');

-- ============================================
-- UNITS TABLE
-- ============================================
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  cnpj TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER ROLES TABLE (separate from profiles for security)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER UNITS TABLE (association between users and units)
-- ============================================
CREATE TABLE public.user_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, unit_id)
);

ALTER TABLE public.user_units ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_price DECIMAL(10, 2),
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCT ADDONS TABLE
-- ============================================
CREATE TABLE public.product_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLES TABLE
-- ============================================
CREATE TABLE public.tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  number INTEGER NOT NULL,
  status table_status DEFAULT 'free',
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (unit_id, number)
);

ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  order_number SERIAL,
  status order_status DEFAULT 'pending',
  channel order_channel NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  kitchen_status kitchen_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORDER PAYMENTS TABLE
-- ============================================
CREATE TABLE public.order_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  method payment_method NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CASH REGISTERS TABLE
-- ============================================
CREATE TABLE public.cash_registers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  opened_by UUID REFERENCES auth.users(id),
  closed_by UUID REFERENCES auth.users(id),
  initial_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  final_amount DECIMAL(10, 2),
  expected_amount DECIMAL(10, 2),
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CASH MOVEMENTS TABLE
-- ============================================
CREATE TABLE public.cash_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE CASCADE NOT NULL,
  type cash_movement_type NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INVENTORY ITEMS TABLE
-- ============================================
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  unit_measure TEXT NOT NULL,
  current_stock DECIMAL(10, 3) NOT NULL DEFAULT 0,
  min_stock DECIMAL(10, 3) DEFAULT 0,
  cost_per_unit DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCT INGREDIENTS TABLE (ficha técnica)
-- ============================================
CREATE TABLE public.product_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(10, 3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (product_id, inventory_item_id)
);

ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INVENTORY MOVEMENTS TABLE
-- ============================================
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  type inventory_movement_type NOT NULL,
  quantity DECIMAL(10, 3) NOT NULL,
  previous_stock DECIMAL(10, 3) NOT NULL,
  new_stock DECIMAL(10, 3) NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DELIVERY DRIVERS TABLE
-- ============================================
CREATE TABLE public.delivery_drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DELIVERY ORDERS TABLE
-- ============================================
CREATE TABLE public.delivery_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  dispatch_time TIMESTAMP WITH TIME ZONE,
  delivery_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- WHATSAPP SETTINGS TABLE
-- ============================================
CREATE TABLE public.whatsapp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL UNIQUE,
  instance_name TEXT,
  api_url TEXT,
  api_token TEXT,
  system_prompt TEXT,
  bot_enabled BOOLEAN DEFAULT false,
  welcome_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- WHATSAPP CONVERSATIONS TABLE
-- ============================================
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL,
  customer_name TEXT,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_bot_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECK
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================
-- FUNCTION TO CHECK USER ACCESS TO UNIT
-- ============================================
CREATE OR REPLACE FUNCTION public.has_unit_access(_user_id UUID, _unit_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_units
    WHERE user_id = _user_id
      AND unit_id = _unit_id
  )
$$;

-- ============================================
-- FUNCTION TO UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- TRIGGER FOR AUTO-CREATING PROFILE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_delivery_drivers_updated_at BEFORE UPDATE ON public.delivery_drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_settings_updated_at BEFORE UPDATE ON public.whatsapp_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_conversations_updated_at BEFORE UPDATE ON public.whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles: users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles: only viewable by the user themselves
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- User units: users can see their own unit associations
CREATE POLICY "Users can view own units" ON public.user_units FOR SELECT USING (auth.uid() = user_id);

-- Units: users can view units they have access to
CREATE POLICY "Users can view accessible units" ON public.units FOR SELECT USING (public.has_unit_access(auth.uid(), id));
CREATE POLICY "Admins can insert units" ON public.units FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update units" ON public.units FOR UPDATE USING (public.has_role(auth.uid(), 'admin') AND public.has_unit_access(auth.uid(), id));

-- Categories: users can manage categories for their units
CREATE POLICY "Users can view categories" ON public.categories FOR SELECT USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can insert categories" ON public.categories FOR INSERT WITH CHECK (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can update categories" ON public.categories FOR UPDATE USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can delete categories" ON public.categories FOR DELETE USING (public.has_unit_access(auth.uid(), unit_id));

-- Products: users can manage products for their units
CREATE POLICY "Users can view products" ON public.products FOR SELECT USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can insert products" ON public.products FOR INSERT WITH CHECK (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can update products" ON public.products FOR UPDATE USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can delete products" ON public.products FOR DELETE USING (public.has_unit_access(auth.uid(), unit_id));

-- Product addons
CREATE POLICY "Users can view addons" ON public.product_addons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_unit_access(auth.uid(), p.unit_id))
);
CREATE POLICY "Users can insert addons" ON public.product_addons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_unit_access(auth.uid(), p.unit_id))
);
CREATE POLICY "Users can update addons" ON public.product_addons FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_unit_access(auth.uid(), p.unit_id))
);
CREATE POLICY "Users can delete addons" ON public.product_addons FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_unit_access(auth.uid(), p.unit_id))
);

-- Tables
CREATE POLICY "Users can view tables" ON public.tables FOR SELECT USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can insert tables" ON public.tables FOR INSERT WITH CHECK (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can update tables" ON public.tables FOR UPDATE USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can delete tables" ON public.tables FOR DELETE USING (public.has_unit_access(auth.uid(), unit_id));

-- Orders
CREATE POLICY "Users can view orders" ON public.orders FOR SELECT USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can insert orders" ON public.orders FOR INSERT WITH CHECK (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can update orders" ON public.orders FOR UPDATE USING (public.has_unit_access(auth.uid(), unit_id));

-- Order items
CREATE POLICY "Users can view order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.has_unit_access(auth.uid(), o.unit_id))
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.has_unit_access(auth.uid(), o.unit_id))
);
CREATE POLICY "Users can update order items" ON public.order_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.has_unit_access(auth.uid(), o.unit_id))
);

-- Order payments
CREATE POLICY "Users can view payments" ON public.order_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.has_unit_access(auth.uid(), o.unit_id))
);
CREATE POLICY "Users can insert payments" ON public.order_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.has_unit_access(auth.uid(), o.unit_id))
);

-- Cash registers
CREATE POLICY "Users can view cash registers" ON public.cash_registers FOR SELECT USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can insert cash registers" ON public.cash_registers FOR INSERT WITH CHECK (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can update cash registers" ON public.cash_registers FOR UPDATE USING (public.has_unit_access(auth.uid(), unit_id));

-- Cash movements
CREATE POLICY "Users can view cash movements" ON public.cash_movements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_register_id AND public.has_unit_access(auth.uid(), cr.unit_id))
);
CREATE POLICY "Users can insert cash movements" ON public.cash_movements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.cash_registers cr WHERE cr.id = cash_register_id AND public.has_unit_access(auth.uid(), cr.unit_id))
);

-- Inventory items
CREATE POLICY "Users can view inventory" ON public.inventory_items FOR SELECT USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can insert inventory" ON public.inventory_items FOR INSERT WITH CHECK (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can update inventory" ON public.inventory_items FOR UPDATE USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can delete inventory" ON public.inventory_items FOR DELETE USING (public.has_unit_access(auth.uid(), unit_id));

-- Product ingredients
CREATE POLICY "Users can view ingredients" ON public.product_ingredients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_unit_access(auth.uid(), p.unit_id))
);
CREATE POLICY "Users can insert ingredients" ON public.product_ingredients FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_unit_access(auth.uid(), p.unit_id))
);
CREATE POLICY "Users can update ingredients" ON public.product_ingredients FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_unit_access(auth.uid(), p.unit_id))
);
CREATE POLICY "Users can delete ingredients" ON public.product_ingredients FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.has_unit_access(auth.uid(), p.unit_id))
);

-- Inventory movements
CREATE POLICY "Users can view inventory movements" ON public.inventory_movements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.inventory_items ii WHERE ii.id = inventory_item_id AND public.has_unit_access(auth.uid(), ii.unit_id))
);
CREATE POLICY "Users can insert inventory movements" ON public.inventory_movements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.inventory_items ii WHERE ii.id = inventory_item_id AND public.has_unit_access(auth.uid(), ii.unit_id))
);

-- Delivery drivers
CREATE POLICY "Users can view drivers" ON public.delivery_drivers FOR SELECT USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can insert drivers" ON public.delivery_drivers FOR INSERT WITH CHECK (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can update drivers" ON public.delivery_drivers FOR UPDATE USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can delete drivers" ON public.delivery_drivers FOR DELETE USING (public.has_unit_access(auth.uid(), unit_id));

-- Delivery orders
CREATE POLICY "Users can view delivery orders" ON public.delivery_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.has_unit_access(auth.uid(), o.unit_id))
);
CREATE POLICY "Users can insert delivery orders" ON public.delivery_orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.has_unit_access(auth.uid(), o.unit_id))
);
CREATE POLICY "Users can update delivery orders" ON public.delivery_orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.has_unit_access(auth.uid(), o.unit_id))
);

-- WhatsApp settings
CREATE POLICY "Users can view whatsapp settings" ON public.whatsapp_settings FOR SELECT USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can insert whatsapp settings" ON public.whatsapp_settings FOR INSERT WITH CHECK (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can update whatsapp settings" ON public.whatsapp_settings FOR UPDATE USING (public.has_unit_access(auth.uid(), unit_id));

-- WhatsApp conversations
CREATE POLICY "Users can view conversations" ON public.whatsapp_conversations FOR SELECT USING (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can insert conversations" ON public.whatsapp_conversations FOR INSERT WITH CHECK (public.has_unit_access(auth.uid(), unit_id));
CREATE POLICY "Users can update conversations" ON public.whatsapp_conversations FOR UPDATE USING (public.has_unit_access(auth.uid(), unit_id));