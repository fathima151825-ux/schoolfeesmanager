-- Add RPC function for superadmin to create admin users
CREATE OR REPLACE FUNCTION public.create_admin_user_by_superadmin(
    p_username TEXT,
    p_full_name TEXT,
    p_email TEXT,
    p_password TEXT,
    p_role TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role TEXT;
    v_new_user_id UUID;
    v_existing_id UUID;
BEGIN
    -- Verify caller is owner/superadmin
    SELECT role INTO v_caller_role FROM public.user_profiles WHERE id = auth.uid();
    IF v_caller_role != 'owner' THEN
        RAISE EXCEPTION 'Only superadmin can create admin users';
    END IF;

    -- Check username uniqueness
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE username = p_username) THEN
        RAISE EXCEPTION 'Username already exists';
    END IF;

    -- Check if auth user with this email already exists
    SELECT id INTO v_existing_id FROM auth.users WHERE email = p_email LIMIT 1;

    IF v_existing_id IS NULL THEN
        v_new_user_id := gen_random_uuid();

        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES (
            v_new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated', 'authenticated',
            p_email,
            crypt(p_password, gen_salt('bf', 10)),
            now(), now(), now(),
            jsonb_build_object('full_name', p_full_name, 'role', p_role, 'username', p_username),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        );
    ELSE
        v_new_user_id := v_existing_id;
        UPDATE auth.users
        SET encrypted_password = crypt(p_password, gen_salt('bf', 10)),
            updated_at = now(),
            raw_user_meta_data = jsonb_build_object('full_name', p_full_name, 'role', p_role, 'username', p_username)
        WHERE id = v_existing_id;
    END IF;

    -- Insert into user_profiles
    INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
    VALUES (v_new_user_id, p_email, p_full_name, p_role::public.user_role, true)
    ON CONFLICT (id) DO UPDATE SET
        full_name = p_full_name,
        role = p_role::public.user_role,
        is_active = true,
        updated_at = now();

    -- Insert into admin_users table
    INSERT INTO public.admin_users (username, full_name, email, role, is_active, auth_user_id, created_by)
    VALUES (p_username, p_full_name, p_email, p_role, true, v_new_user_id, auth.uid());

    RETURN jsonb_build_object('success', true, 'user_id', v_new_user_id, 'username', p_username);

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_admin_user_by_superadmin TO authenticated;
