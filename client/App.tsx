import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './src/components/Layout';
import ProtectedRoute from './src/components/routing/ProtectedRoute';
import SubscriptionRoute from './src/components/routing/SubscriptionRoute';
import DashboardPage from './src/pages/DashboardPage';
import ForecastPage from './src/pages/ForecastPage';
import InsightsPage from './src/pages/InsightsPage';
import ChatPage from './src/pages/ChatPage';
import ReportPage from './src/pages/ReportPage';
import SubscriptionPage from './src/pages/SubscriptionPage';
import VerifyEmailPage from './src/pages/VerifyEmailPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<DashboardPage />} />
          
          {/* Protected Routes - Require Authentication + Email Verification */}
          <Route 
            path="forecast" 
            element={
              <ProtectedRoute requireEmailVerification>
                <ForecastPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Subscription Routes - Require Active Subscription */}
          <Route 
            path="insights" 
            element={
              <SubscriptionRoute>
                <InsightsPage />
              </SubscriptionRoute>
            } 
          />
          
          <Route 
            path="chat" 
            element={
              <SubscriptionRoute>
                <ChatPage />
              </SubscriptionRoute>
            } 
          />
          
          <Route 
            path="research" 
            element={
              <SubscriptionRoute>
                <ReportPage />
              </SubscriptionRoute>
            } 
          />
          
          {/* Subscription Page - Accessible to All Authenticated Users */}
          <Route 
            path="subscription" 
            element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Email Verification Route */}
          <Route path="verify/:token" element={<VerifyEmailPage />} />
          
          {/* Catch All - Redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;