import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, getUserProfile } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase?.auth?.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session?.user);
        loadProfile(session?.user?.id);
      } else if (event === 'SIGNED_OUT') {
        // Only clear if no parent or superadmin session exists
        const parentSession = sessionStorage.getItem('parentSession');
        const superadminSession = sessionStorage.getItem('superadmin_session');
        if (!parentSession && !superadminSession) {
          setUser(null);
          setProfile(null);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      // First check for a parent session in sessionStorage
      const parentSessionStr = sessionStorage.getItem('parentSession');
      if (parentSessionStr) {
        try {
          const parentSession = JSON.parse(parentSessionStr);
          // Validate session has required fields
          if (parentSession?.id && parentSession?.role === 'parent') {
            const parentUser = {
              id: parentSession?.id,
              email: parentSession?.email,
              role: 'parent'
            };
            const parentProfile = {
              id: parentSession?.id,
              email: parentSession?.email,
              full_name: parentSession?.full_name,
              role: 'parent',
              is_active: true
            };
            setUser(parentUser);
            setProfile(parentProfile);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Invalid session data, clear it
          sessionStorage.removeItem('parentSession');
        }
      }

      // Check for superadmin session in sessionStorage
      const superadminSessionStr = sessionStorage.getItem('superadmin_session');
      if (superadminSessionStr) {
        try {
          const superadminSession = JSON.parse(superadminSessionStr);
          if (superadminSession?.role === 'superadmin' && superadminSession?.username) {
            const superadminUser = {
              id: superadminSession?.username,
              email: `${superadminSession?.username}@ssvm.com`,
              role: 'superadmin'
            };
            const superadminProfile = {
              id: superadminSession?.username,
              email: `${superadminSession?.username}@ssvm.com`,
              full_name: superadminSession?.fullName || 'Super Admin',
              role: 'superadmin',
              is_active: true
            };
            setUser(superadminUser);
            setProfile(superadminProfile);
            setLoading(false);
            return;
          }
        } catch (e) {
          sessionStorage.removeItem('superadmin_session');
        }
      }

      // Fall back to Supabase auth for admin/owner
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser?.id) {
        loadProfile(currentUser?.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId) => {
    try {
      const userProfile = await getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin' || profile?.role === 'owner',
    isSuperAdmin: profile?.role === 'superadmin',
    isParent: profile?.role === 'parent',
    refreshAuth: checkUser,
    clearParentSession: () => {
      sessionStorage.removeItem('parentSession');
      sessionStorage.removeItem('currentStudentId');
      setUser(null);
      setProfile(null);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
