-- Fix Student Search with Direct Access RLS Policy
-- This migration simplifies RLS policies to allow authenticated admin users direct access

-- Drop existing complex policies that may cause issues
DROP POLICY IF EXISTS "admin_owner_full_access_students" ON public.students;
DROP POLICY IF EXISTS "parents_read_own_students" ON public.students;
DROP POLICY IF EXISTS "admin_owner_full_access_parent_students" ON public.parent_students;
DROP POLICY IF EXISTS "parents_read_own_parent_students" ON public.parent_students;

-- Create simplified function to check admin role from auth metadata
-- This avoids circular dependency by checking auth.users directly instead of user_profiles
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      (au.raw_user_meta_data->>'role' IN ('admin', 'owner'))
      OR (au.raw_app_meta_data->>'role' IN ('admin', 'owner'))
    )
  )
$$;

-- Alternative: Check user_profiles but with proper security definer
CREATE OR REPLACE FUNCTION public.check_user_role()
RETURNS TABLE(user_id UUID, user_role TEXT, is_active BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id, role::TEXT, is_active
  FROM public.user_profiles
  WHERE id = auth.uid()
$$;

-- Policy 1: Admin/Owner full access to students
CREATE POLICY "admin_read_all_students"
ON public.students
FOR SELECT
TO authenticated
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1 FROM public.check_user_role() cur
    WHERE cur.user_role IN ('admin', 'owner')
    AND cur.is_active = true
  )
);

CREATE POLICY "admin_manage_students"
ON public.students
FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1 FROM public.check_user_role() cur
    WHERE cur.user_role IN ('admin', 'owner')
    AND cur.is_active = true
  )
)
WITH CHECK (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1 FROM public.check_user_role() cur
    WHERE cur.user_role IN ('admin', 'owner')
    AND cur.is_active = true
  )
);

-- Policy 2: Parents can view their own students
CREATE POLICY "parents_read_own_students"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_students ps
    WHERE ps.student_id = students.id
    AND ps.parent_id = auth.uid()
  )
);

-- Policy 3: Admin/Owner full access to parent_students
CREATE POLICY "admin_read_parent_students"
ON public.parent_students
FOR SELECT
TO authenticated
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1 FROM public.check_user_role() cur
    WHERE cur.user_role IN ('admin', 'owner')
    AND cur.is_active = true
  )
);

CREATE POLICY "admin_manage_parent_students"
ON public.parent_students
FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1 FROM public.check_user_role() cur
    WHERE cur.user_role IN ('admin', 'owner')
    AND cur.is_active = true
  )
)
WITH CHECK (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1 FROM public.check_user_role() cur
    WHERE cur.user_role IN ('admin', 'owner')
    AND cur.is_active = true
  )
);

-- Policy 4: Parents can view their own relationships
CREATE POLICY "parents_read_own_relationships"
ON public.parent_students
FOR SELECT
TO authenticated
USING (parent_id = auth.uid());

-- Add comprehensive logging
DO $$
BEGIN
  RAISE NOTICE '✅ Student search RLS policies updated with direct access';
  RAISE NOTICE '✅ Admin users can now query students table';
  RAISE NOTICE '✅ Helper functions created: is_admin_user(), check_user_role()';
END $$;