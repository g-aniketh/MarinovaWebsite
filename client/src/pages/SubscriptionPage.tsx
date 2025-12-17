import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubscriptionPageComponent from '../../components/SubscriptionPage';

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    // Check if there's a redirect path stored
    const redirectPath = sessionStorage.getItem('redirectAfterSubscription');
    sessionStorage.removeItem('redirectAfterSubscription');
    
    // Navigate back to where they came from, or dashboard
    navigate(redirectPath || '/');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="relative">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      
      <SubscriptionPageComponent onSubscribe={handleSubscribe} />
    </div>
  );
};

export default SubscriptionPage;
