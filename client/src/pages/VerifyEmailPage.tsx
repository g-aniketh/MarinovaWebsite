import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, verifyEmail } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleVerification = async () => {
      if (!token) {
        setMessage('❌ Invalid verification link');
        setIsSuccess(false);
        setVerifying(false);
        return;
      }

      if (!isAuthenticated) {
        setMessage('⚠️ Please sign in first, then click the verification link again.');
        setIsSuccess(false);
        setVerifying(false);
        setTimeout(() => navigate('/?login=true'), 3000);
        return;
      }

      try {
        const result = await verifyEmail(token);
        
        if (result.success) {
          setMessage('✅ Email verified successfully! You now have 3 free credits.');
          setIsSuccess(true);
          setTimeout(() => navigate('/'), 3000);
        } else {
          setMessage('❌ Verification failed: ' + result.message);
          setIsSuccess(false);
        }
      } catch (error) {
        setMessage('❌ An error occurred during verification');
        setIsSuccess(false);
      } finally {
        setVerifying(false);
      }
    };

    handleVerification();
  }, [token, isAuthenticated, verifyEmail, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f172a] via-[#172554]/20 to-[#0f172a]">
      <div className="max-w-md w-full mx-4">
        <div className={`bg-[#1e293b] border ${isSuccess ? 'border-green-500/50' : 'border-slate-700/50'} rounded-2xl p-8 shadow-2xl`}>
          <div className="text-center">
            {verifying ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                <h2 className="text-2xl font-bold text-white mb-2">Verifying Email</h2>
                <p className="text-slate-400">Please wait...</p>
              </>
            ) : (
              <>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <span className="text-4xl">{isSuccess ? '✅' : '❌'}</span>
                </div>
                <h2 className={`text-2xl font-bold mb-4 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                  {isSuccess ? 'Success!' : 'Verification Failed'}
                </h2>
                <p className="text-slate-300 mb-6">{message}</p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all shadow-lg"
                >
                  Go to Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
