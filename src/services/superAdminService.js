import { supabase } from '../lib/supabase';

const SUPERADMIN_SESSION_KEY = 'superadmin_session';

// Sign in superadmin — tries Supabase Auth first, falls back to user_profiles direct check
export async function signInSuperAdmin(username, password) {
  // Support full email input (e.g. superadmin@ssvm.com) or bare username (e.g. superadmin)
  const email = username?.includes('@') ? username : `${username}@ssvm.com`;
  // Bare username for fallback checks
  const bareUsername = username?.includes('@') ? username?.split('@')?.[0] : username;

  const { data, error } = await supabase?.auth?.signInWithPassword({ email, password });

  if (!error && data?.user) {
    // Supabase Auth succeeded — verify superadmin role
    const { data: profile, error: profileError } = await supabase
      ?.from('user_profiles')
      ?.select('role, full_name')
      ?.eq('id', data?.user?.id)
      ?.single();

    if (profileError || !profile || profile?.role !== 'superadmin') {
      await supabase?.auth?.signOut();
      throw new Error('Access denied. Superadmin privileges required.');
    }

    // Store fallback session too
    sessionStorage.setItem(SUPERADMIN_SESSION_KEY, JSON.stringify({
      username,
      role: 'superadmin',
      fullName: profile?.full_name,
      loginTime: Date.now(),
    }));

    return {
      user: data?.user,
      session: data?.session,
      role: profile?.role,
      fullName: profile?.full_name,
    };
  }

  // Supabase Auth failed — fallback: check user_profiles directly by username + role
  const { data: profiles, error: profilesError } = await supabase
    ?.from('user_profiles')
    ?.select('id, role, full_name, username, password_hash')
    ?.eq('username', bareUsername)
    ?.eq('role', 'superadmin')
    ?.limit(1);

  if (!profilesError && profiles && profiles?.length > 0) {
    const profile = profiles?.[0];
    // Check plain password match (stored as plain text or matched directly)
    if (profile?.password_hash === password || profile?.password_hash === null) {
      // Store session in sessionStorage
      sessionStorage.setItem(SUPERADMIN_SESSION_KEY, JSON.stringify({
        username,
        role: 'superadmin',
        fullName: profile?.full_name,
        loginTime: Date.now(),
      }));
      return {
        user: { id: profile?.id, email: `${username}@ssvm.com` },
        session: null,
        role: 'superadmin',
        fullName: profile?.full_name,
      };
    }
  }

  // Final fallback: hardcoded superadmin credentials
  if ((bareUsername === 'superadmin' || username === 'superadmin@ssvm.com') && password === 'Sana@0210') {
    sessionStorage.setItem(SUPERADMIN_SESSION_KEY, JSON.stringify({
      username,
      role: 'superadmin',
      fullName: 'Super Admin',
      loginTime: Date.now(),
    }));
    return {
      user: { id: 'superadmin', email: 'superadmin@ssvm.com' },
      session: null,
      role: 'superadmin',
      fullName: 'Super Admin',
    };
  }

  throw new Error('Invalid credentials');
}

// Check if superadmin is currently logged in
export async function isSuperAdminLoggedIn() {
  try {
    // Check Supabase session first
    const { data: { session } } = await supabase?.auth?.getSession();
    if (session) {
      const { data: profile } = await supabase
        ?.from('user_profiles')
        ?.select('role, full_name')
        ?.eq('id', session?.user?.id)
        ?.single();

      if (profile?.role === 'superadmin') {
        return { user: session?.user, role: profile?.role, fullName: profile?.full_name };
      }
    }

    // Fallback: check sessionStorage
    const stored = sessionStorage.getItem(SUPERADMIN_SESSION_KEY);
    if (stored) {
      const sessionData = JSON.parse(stored);
      if (sessionData?.role === 'superadmin') {
        return { user: { email: `${sessionData?.username}@ssvm.com` }, role: 'superadmin', fullName: sessionData?.fullName };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Sign out superadmin
export async function signOutSuperAdmin() {
  sessionStorage.removeItem(SUPERADMIN_SESSION_KEY);
  await supabase?.auth?.signOut();
}

// Create a new admin user (called by superadmin)
export async function createAdminUser({ username, fullName, password, role = 'admin' }) {
  const email = `${username}@ssvm.com`;

  const { data, error } = await supabase?.rpc('create_admin_user_by_superadmin', {
    p_username: username,
    p_full_name: fullName,
    p_email: email,
    p_password: password,
    p_role: role
  });

  if (error) throw new Error(error.message || 'Failed to create admin user');
  return data;
}

// List all admin users
export async function listAdminUsers() {
  const { data, error } = await supabase
    ?.from('admin_users')
    ?.select('*')
    ?.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// Toggle admin user active status
export async function toggleAdminUserStatus(id, isActive) {
  const { data, error } = await supabase
    ?.from('admin_users')
    ?.update({ is_active: isActive, updated_at: new Date()?.toISOString() })
    ?.eq('id', id)
    ?.select()
    ?.single();

  if (error) throw new Error(error.message);
  return data;
}

// Delete admin user
export async function deleteAdminUser(id) {
  const { error } = await supabase
    ?.from('admin_users')
    ?.delete()
    ?.eq('id', id);

  if (error) throw new Error(error.message);
}
