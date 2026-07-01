-- Add superadmin role and create superadmin user
-- SuperAdmin credentials: username=superadmin, password=Sana@0210

-- ============================================
-- STEP 1: Add superadmin to user_role enum
-- Must be done OUTSIDE any transaction/DO block
-- ============================================

-- Create the type if it doesn't exist at all
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'user_role' 
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'owner', 'parent', 'superadmin');
    END IF;
END $$;

-- Add 'superadmin' value if the type exists but doesn't have it yet
-- NOTE: This runs outside any DO block so it commits immediately
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- ============================================
-- STEP 2: Create admin_users table
-- (Managed by superadmin to create/manage admin accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Superadmin can manage all admin users
-- Use text comparison to avoid referencing the new enum value in same transaction
DROP POLICY IF EXISTS "superadmin_manage_admin_users" ON public.admin_users;
CREATE POLICY "superadmin_manage_admin_users"
ON public.admin_users
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid() AND up.role::text = 'superadmin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid() AND up.role::text = 'superadmin'
    )
);

-- Admins can read their own record
DROP POLICY IF EXISTS "admins_read_own_admin_users" ON public.admin_users;
CREATE POLICY "admins_read_own_admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
    email = (SELECT email FROM public.user_profiles WHERE id = auth.uid() LIMIT 1)
);

-- ============================================
-- STEP 3: Create superadmin user in auth.users
-- Use text casting to avoid "unsafe use of new enum value" error
-- ============================================
DO $$
DECLARE
    superadmin_uuid UUID := gen_random_uuid();
    existing_superadmin_id UUID;
    superadmin_role text := 'superadmin';
BEGIN
    -- Check if superadmin already exists
    SELECT id INTO existing_superadmin_id 
    FROM auth.users 
    WHERE email = 'superadmin@ssvm.com' 
    LIMIT 1;

    IF existing_superadmin_id IS NULL THEN
        -- Create superadmin in auth.users
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES (
            superadmin_uuid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'superadmin@ssvm.com',
            crypt('Sana@0210', gen_salt('bf', 10)),
            now(),
            now(),
            now(),
            jsonb_build_object('full_name', 'Super Admin', 'role', superadmin_role, 'username', 'superadmin'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        );

        -- Create user_profiles entry for superadmin using text cast to avoid enum transaction issue
        EXECUTE format(
            'INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
             VALUES ($1, $2, $3, $4::public.user_role, $5)
             ON CONFLICT (id) DO NOTHING'
        ) USING superadmin_uuid, 'superadmin@ssvm.com', 'Super Admin', superadmin_role, true;

        RAISE NOTICE 'Created superadmin user successfully';
    ELSE
        -- Update existing superadmin password and profile
        UPDATE auth.users
        SET encrypted_password = crypt('Sana@0210', gen_salt('bf', 10)),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now(),
            raw_user_meta_data = jsonb_build_object('full_name', 'Super Admin', 'role', superadmin_role, 'username', 'superadmin')
        WHERE id = existing_superadmin_id;

        EXECUTE format(
            'INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
             VALUES ($1, $2, $3, $4::public.user_role, $5)
             ON CONFLICT (id) DO UPDATE SET
                 role = $4::public.user_role,
                 is_active = true,
                 updated_at = now()'
        ) USING existing_superadmin_id, 'superadmin@ssvm.com', 'Super Admin', superadmin_role, true;

        RAISE NOTICE 'Updated existing superadmin user';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Migration error: %', SQLERRM;
END $$;
