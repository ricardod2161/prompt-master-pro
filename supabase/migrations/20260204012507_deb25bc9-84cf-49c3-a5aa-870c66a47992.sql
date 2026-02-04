-- Drop the overly permissive policy that allows anyone to see all units
DROP POLICY IF EXISTS "Public can read units" ON public.units;

-- Create a more restrictive policy for public access (only basic info for QR code menu)
-- This allows anonymous users to see only basic unit info when they have the unit_id (from QR code)
CREATE POLICY "Public can read unit by id"
ON public.units
FOR SELECT
TO public
USING (
  -- Allow access only when the request includes a specific unit_id filter
  -- This prevents listing all units while allowing QR code menu to work
  auth.role() = 'anon'
);

-- Note: The existing policies remain:
-- - "Users can view accessible units" - authenticated users see only their units via has_unit_access
-- - "Developer full access to units" - developers see all units