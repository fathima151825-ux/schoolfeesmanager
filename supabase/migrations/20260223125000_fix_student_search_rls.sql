-- Fix Student Search RLS Policy
-- This migration adds a more direct RLS policy for students table to fix search functionality

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "admin_manage_all_students" ON public.students;
DROP POLICY IF EXISTS "parents_view_own_students" ON public.students;

-- Create new simplified policies
-- Policy 1: Admin/Owner can manage all students
CREATE POLICY "admin_owner_full_access_students"
ON public.students
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role IN ('admin'::public.user_role, 'owner'::public.user_role)
        AND user_profiles.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role IN ('admin'::public.user_role, 'owner'::public.user_role)
        AND user_profiles.is_active = true
    )
);

-- Policy 2: Parents can view their own students
CREATE POLICY "parents_read_own_students"
ON public.students
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.parent_students
        WHERE parent_students.student_id = students.id
        AND parent_students.parent_id = auth.uid()
    )
);

-- Update parent_students RLS policies for better search support
DROP POLICY IF EXISTS "admin_manage_all_parent_students" ON public.parent_students;
DROP POLICY IF EXISTS "parents_view_own_parent_students" ON public.parent_students;

-- Policy 1: Admin/Owner can manage all parent_students
CREATE POLICY "admin_owner_full_access_parent_students"
ON public.parent_students
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role IN ('admin'::public.user_role, 'owner'::public.user_role)
        AND user_profiles.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role IN ('admin'::public.user_role, 'owner'::public.user_role)
        AND user_profiles.is_active = true
    )
);

-- Policy 2: Parents can view their own relationships
CREATE POLICY "parents_read_own_parent_students"
ON public.parent_students
FOR SELECT
TO authenticated
USING (parent_id = auth.uid());

-- Add notice for successful migration
DO $$
BEGIN
    RAISE NOTICE 'Student search RLS policies updated successfully';
END $$;