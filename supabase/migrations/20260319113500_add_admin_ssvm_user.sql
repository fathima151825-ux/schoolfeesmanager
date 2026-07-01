-- Add admin@ssvm.com user for SSVM School Fees Management System
-- This migration creates the admin user with the correct credentials

DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    existing_admin_id UUID;
BEGIN
    -- Check if admin@ssvm.com already exists in auth.users
    SELECT id INTO existing_admin_id FROM auth.users WHERE email = 'admin@ssvm.com' LIMIT 1;

    IF existing_admin_id IS NULL THEN
        -- Create admin@ssvm.com in auth.users
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES (
            admin_uuid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'admin@ssvm.com',
            crypt('admin123', gen_salt('bf', 10)),
            now(),
            now(),
            now(),
            jsonb_build_object('full_name', 'SSVM Admin', 'role', 'admin'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        );

        -- Manually insert into user_profiles in case trigger did not fire
        INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
        VALUES (admin_uuid, 'admin@ssvm.com', 'SSVM Admin', 'admin'::public.user_role, true)
        ON CONFLICT (id) DO NOTHING;

        RAISE NOTICE 'Created admin@ssvm.com successfully';
    ELSE
        -- User exists in auth.users, update password and ensure profile exists
        UPDATE auth.users
        SET encrypted_password = crypt('admin123', gen_salt('bf', 10)),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now(),
            raw_user_meta_data = jsonb_build_object('full_name', 'SSVM Admin', 'role', 'admin')
        WHERE id = existing_admin_id;

        -- Ensure user_profiles row exists
        INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
        VALUES (existing_admin_id, 'admin@ssvm.com', 'SSVM Admin', 'admin'::public.user_role, true)
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin'::public.user_role,
            is_active = true,
            updated_at = now();

        RAISE NOTICE 'Updated existing admin@ssvm.com user';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Migration error: %', SQLERRM;
END $$;
