-- Fix: Allow anonymous/unauthenticated access to academic_years and fee_categories
-- Parent sessions do not use Supabase auth, so they query as anon role

-- Academic Years: Allow anon (unauthenticated) read access
DROP POLICY IF EXISTS "anon_read_academic_years" ON public.academic_years;
CREATE POLICY "anon_read_academic_years"
ON public.academic_years
FOR SELECT
TO anon
USING (true);

-- Fee Categories: Allow anon (unauthenticated) read access
DROP POLICY IF EXISTS "anon_read_fee_categories" ON public.fee_categories;
CREATE POLICY "anon_read_fee_categories"
ON public.fee_categories
FOR SELECT
TO anon
USING (true);
