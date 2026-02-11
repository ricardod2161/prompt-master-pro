
-- 1. Add capacity column to tables
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 4;

-- 2. Fix orders RLS - drop overly permissive public read, add restricted policies
-- First check existing policies and drop them
DROP POLICY IF EXISTS "Anyone can view orders by tracking token" ON public.orders;
DROP POLICY IF EXISTS "Public can view table orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Anon can view orders by tracking_token" ON public.orders;
DROP POLICY IF EXISTS "Public can read orders by tracking token" ON public.orders;

-- Create restricted public access (anon only by tracking_token)
CREATE POLICY "Anon can view orders by tracking_token"
ON public.orders
FOR SELECT
TO anon
USING (tracking_token IS NOT NULL AND tracking_token = current_setting('request.headers', true)::json->>'x-tracking-token');

-- Alternative: allow anon to read orders for table channel only (needed for customer order flow)
DROP POLICY IF EXISTS "Anon can view table channel orders" ON public.orders;
CREATE POLICY "Anon can view table channel orders"
ON public.orders
FOR SELECT
TO anon
USING (channel = 'table' AND created_at > NOW() - INTERVAL '24 hours');

-- Ensure authenticated users with unit access can read orders
DROP POLICY IF EXISTS "Staff can view unit orders" ON public.orders;
CREATE POLICY "Staff can view unit orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.has_unit_access(auth.uid(), unit_id)
  OR public.is_developer(auth.uid())
);

-- 3. Fix leads RLS - restrict to developers only
DROP POLICY IF EXISTS "Authenticated users can read leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated can read leads" ON public.leads;

CREATE POLICY "Only developers can read leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.is_developer(auth.uid()));

-- Keep anon insert for lead capture form
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anon can insert leads" ON public.leads;
CREATE POLICY "Anon can insert leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);
