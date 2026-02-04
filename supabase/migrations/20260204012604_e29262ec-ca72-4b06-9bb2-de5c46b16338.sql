-- Remove the public access policy for units - not needed for digital menu
-- The digital menu gets unit_id from the tables table (which is public)
DROP POLICY IF EXISTS "Public can read unit by id" ON public.units;

-- Now only these policies remain:
-- 1. "Users can view accessible units" - authenticated users see only units they have access to via user_units
-- 2. "Developer full access to units" - developers see all units
-- 3. "Admins can update units" - admins can update their units
-- 4. "Authenticated users can create units" - users can create new units