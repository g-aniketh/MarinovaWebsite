import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireEmailVerification = false 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <div className="text-cyan-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the attempted URL to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    return <Navigate to="/?login=true" replace />;
  }

  if (requireEmailVerification && user && !user.isEmailVerified) {
    return <Navigate to="/?verify=required" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
