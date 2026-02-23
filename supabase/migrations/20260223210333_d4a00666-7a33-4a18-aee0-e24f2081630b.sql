
-- Remove permissive/duplicate policies on leads
DROP POLICY IF EXISTS "Allow authenticated users to read leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users to update leads" ON leads;
DROP POLICY IF EXISTS "Anon can insert leads" ON leads;

-- Add update restricted to developers only
CREATE POLICY "Only developers can update leads" ON leads
FOR UPDATE USING (is_developer(auth.uid()));
