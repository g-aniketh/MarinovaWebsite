import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

interface SubscriptionRouteProps {
  children: React.ReactNode;
}

const SubscriptionRoute: React.FC<SubscriptionRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <div className="text-cyan-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    return <Navigate to="/?login=true" replace />;
  }

  if (user && user.subscriptionStatus === 'free') {
    // Store where they tried to go so they can return after subscribing
    sessionStorage.setItem('redirectAfterSubscription', window.location.pathname);
    return <Navigate to="/subscription" replace />;
  }

  return <>{children}</>;
};

export default SubscriptionRoute;
