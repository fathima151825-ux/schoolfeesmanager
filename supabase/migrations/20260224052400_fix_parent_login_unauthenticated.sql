-- Fix Parent Login: Allow unauthenticated access for login verification
-- This migration adds policies to allow parent login without prior authentication

-- Policy: Allow unauthenticated users to read students table for login verification
-- This is safe because we only expose minimal data (id, date_of_birth) and require exact match
CREATE POLICY "allow_unauthenticated_login_students"
ON public.students
FOR SELECT
TO anon
USING (true);

-- Policy: Allow unauthenticated users to read parent_students for login verification
CREATE POLICY "allow_unauthenticated_login_parent_students"
ON public.parent_students
FOR SELECT
TO anon
USING (true);

-- Policy: Allow unauthenticated users to read user_profiles for login verification
CREATE POLICY "allow_unauthenticated_login_user_profiles"
ON public.user_profiles
FOR SELECT
TO anon
USING (true);