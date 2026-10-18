import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { AlertCircle, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

const OAuth2CallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();

  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const exchangeAttempted = useRef(false);

  useEffect(() => {
    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      if (errorParam === 'account_exists_unlinked') {
        setErrorMessage('An account with this email already exists using password authentication. Please sign in with your email and password.');
      } else if (errorParam === 'unverified_email') {
        setErrorMessage('Your Google email address is not verified. Please verify your Google account before signing in.');
      } else if (errorParam === 'account_deactivated') {
        setErrorMessage('Your account has been deactivated. Please contact support.');
      } else {
        setErrorMessage('Google authentication could not be completed. Please try again.');
      }
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code provided in the callback URL.');
      return;
    }

    const exchangeCode = async () => {
      try {
        const data = await authService.exchangeOAuthCode(code);
        setAuthSession(data);
        setStatus('success');

        const role = data.user?.role;
        setTimeout(() => {
          if (role === 'PATIENT') {
            navigate('/patient/dashboard', { replace: true });
          } else if (role === 'DOCTOR') {
            navigate('/doctor/dashboard', { replace: true });
          } else if (role === 'ADMIN') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 800);
      } catch (err) {
        console.error('OAuth code exchange failed:', err);
        setStatus('error');
        const message = err.response?.data?.message || 'Failed to authenticate with Google. The authorization code may have expired.';
        setErrorMessage(message);
      }
    };

    exchangeCode();
  }, [searchParams, navigate, setAuthSession]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50 p-8 text-center">
        {status === 'processing' && (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto text-sky-600">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Authenticating with Google</h2>
              <p className="text-sm text-slate-500 mt-1">Verifying your secure credentials and loading profile...</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Signed In Successfully</h2>
              <p className="text-sm text-slate-500 mt-1">Redirecting to your CareSync dashboard...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Authentication Failed</h2>
              <p className="text-sm text-rose-700 bg-rose-50/70 border border-rose-200/60 rounded-xl p-3.5 text-left">
                {errorMessage}
              </p>
            </div>
            <div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Login</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuth2CallbackPage;
