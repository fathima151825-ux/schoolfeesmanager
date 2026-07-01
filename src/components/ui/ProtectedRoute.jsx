import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="mx-auto mb-4 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // For superadmin routes: also check sessionStorage directly as safety net
  if (requiredRole === 'superadmin') {
    const isSuperAdminInContext = user && profile?.role === 'superadmin';
    let isSuperAdminInStorage = false;
    try {
      const stored = sessionStorage.getItem('superadmin_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        isSuperAdminInStorage = parsed?.role === 'superadmin' && !!parsed?.username;
      }
    } catch {
      // ignore
    }

    if (!isSuperAdminInContext && !isSuperAdminInStorage) {
      return <Navigate to="/superadmin-login" state={{ from: location }} replace />;
    }
    return children;
  }

  // Redirect to login if not authenticated
  if (!user || !profile) {
    const redirectPath = requiredRole === 'admin' ? '/admin-login' : '/parent-login';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole) {
    if (requiredRole === 'admin' && profile?.role !== 'admin' && profile?.role !== 'owner' && profile?.role !== 'superadmin') {
      return <Navigate to="/parent-dashboard" replace />;
    }
    if (requiredRole === 'parent' && profile?.role !== 'parent') {
      return <Navigate to="/admin-dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;