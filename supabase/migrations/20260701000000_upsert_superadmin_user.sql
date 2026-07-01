-- Upsert superadmin user: superadmin@ssvm.com / Sana@0210
-- This migration ensures the superadmin exists in both auth.users and user_profiles
-- Safe to run multiple times (idempotent)

DO $$
DECLARE
    v_superadmin_id UUID;
    v_superadmin_role TEXT := 'superadmin';
BEGIN
    -- Check if superadmin already exists in auth.users
    SELECT id INTO v_superadmin_id
    FROM auth.users
    WHERE email = 'superadmin@ssvm.com'
    LIMIT 1;

    IF v_superadmin_id IS NULL THEN
        -- Create new superadmin in auth.users
        v_superadmin_id := gen_random_uuid();

        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES (
            v_superadmin_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'superadmin@ssvm.com',
            crypt('Sana@0210', gen_salt('bf', 10)),
            now(),
            now(),
            now(),
            jsonb_build_object('full_name', 'Super Admin', 'role', v_superadmin_role, 'username', 'superadmin'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        );

        RAISE NOTICE 'Created superadmin auth user with id: %', v_superadmin_id;
    ELSE
        -- Update existing superadmin password to ensure it matches
        UPDATE auth.users
        SET
            encrypted_password = crypt('Sana@0210', gen_salt('bf', 10)),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now(),
            raw_user_meta_data = jsonb_build_object('full_name', 'Super Admin', 'role', v_superadmin_role, 'username', 'superadmin')
        WHERE id = v_superadmin_id;

        RAISE NOTICE 'Updated existing superadmin auth user with id: %', v_superadmin_id;
    END IF;

    -- Ensure user_profiles row exists for superadmin
    -- Use EXECUTE with format to avoid "unsafe use of new enum value" error
    EXECUTE format(
        'INSERT INTO public.user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4::public.user_role, true, now(), now())
         ON CONFLICT (id) DO UPDATE SET
             role = $4::public.user_role,
             is_active = true,
             full_name = $3,
             updated_at = now()'
    ) USING v_superadmin_id, 'superadmin@ssvm.com', 'Super Admin', v_superadmin_role;

    RAISE NOTICE 'Superadmin user_profiles entry ensured for id: %', v_superadmin_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Superadmin upsert failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;
