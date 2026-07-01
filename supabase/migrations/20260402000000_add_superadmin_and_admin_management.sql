-- Add superadmin user and admin_users table for managing admin credentials
-- Superadmin: username=superadmin, password=Sana@0210

DO $$
DECLARE
    superadmin_uuid UUID;
    existing_id UUID;
BEGIN
    -- Check if superadmin already exists
    SELECT id INTO existing_id FROM auth.users WHERE email = 'superadmin@ssvm.local' LIMIT 1;

    IF existing_id IS NULL THEN
        superadmin_uuid := gen_random_uuid();

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
            'superadmin@ssvm.local',
            crypt('Sana@0210', gen_salt('bf', 10)),
            now(), now(), now(),
            jsonb_build_object('full_name', 'Super Admin', 'role', 'superadmin', 'username', 'superadmin'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        );

        INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
        VALUES (superadmin_uuid, 'superadmin@ssvm.local', 'Super Admin', 'owner'::public.user_role, true)
        ON CONFLICT (id) DO NOTHING;

        RAISE NOTICE 'Created superadmin user successfully';
    ELSE
        UPDATE auth.users
        SET encrypted_password = crypt('Sana@0210', gen_salt('bf', 10)),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now(),
            raw_user_meta_data = jsonb_build_object('full_name', 'Super Admin', 'role', 'superadmin', 'username', 'superadmin')
        WHERE id = existing_id;

        INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
        VALUES (existing_id, 'superadmin@ssvm.local', 'Super Admin', 'owner'::public.user_role, true)
        ON CONFLICT (id) DO UPDATE SET
            role = 'owner'::public.user_role,
            is_active = true,
            updated_at = now();

        RAISE NOTICE 'Updated existing superadmin user';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Superadmin migration error: %', SQLERRM;
END $$;

-- Create admin_users table for superadmin to manage admin credentials
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'owner')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only authenticated users with owner role can manage admin_users
CREATE POLICY "owner_manage_admin_users" ON public.admin_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Admins can read their own record
CREATE POLICY "admin_read_own" ON public.admin_users
    FOR SELECT
    USING (auth_user_id = auth.uid());
