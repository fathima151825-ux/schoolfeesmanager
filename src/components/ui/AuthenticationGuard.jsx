import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    userRole: null,
    sessionTimeout: null
  });

  useEffect(() => {
    if (authState?.isAuthenticated && authState?.sessionTimeout) {
      const timeout = setTimeout(() => {
        handleLogout();
      }, authState?.sessionTimeout);

      return () => clearTimeout(timeout);
    }
  }, [authState?.isAuthenticated, authState?.sessionTimeout]);

  const handleLogin = (role, timeout = 3600000) => {
    setAuthState({
      isAuthenticated: true,
      userRole: role,
      sessionTimeout: timeout
    });
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      userRole: null,
      sessionTimeout: null
    });
  };

  return (
    <AuthContext.Provider value={{ authState, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { authState } = useAuth();
  const location = useLocation();

  if (!authState?.isAuthenticated) {
    const redirectPath = requiredRole === 'admin' ? '/admin-login' : '/parent-login';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (requiredRole && authState?.userRole !== requiredRole) {
    const redirectPath = authState?.userRole === 'admin' ? '/admin-dashboard' : '/parent-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};