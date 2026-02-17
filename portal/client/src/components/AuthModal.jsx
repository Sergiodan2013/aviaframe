import { useState } from 'react';
import { X, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase, signInWithEmail, signInWithGoogle } from '../lib/supabase';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await signInWithGoogle();

      if (error) {
        throw error;
      }

      // Google OAuth will redirect, no need to handle success here
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to login with Google. Please try again.');
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Apple Sign In через Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        throw error;
      }

      // Apple OAuth will redirect, no need to handle success here
    } catch (err) {
      console.error('Apple login error:', err);
      setError('Apple Sign In is not configured yet. Please use email login.');
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending Magic Link to:', email);

      const { data, error } = await signInWithEmail(email);

      if (error) {
        throw error;
      }

      console.log('Magic Link sent successfully:', data);

      // Show success message - check email for magic link
      setEmailSent(true);
      setError(null);
    } catch (err) {
      console.error('Email login error:', err);
      setError(err.message || 'Failed to send login link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isLoading}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sign In
          </h2>
          <p className="text-gray-600">
            Continue to complete your booking
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Social login buttons */}
        <div className="space-y-3 mb-6">
          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Apple button */}
          <button
            onClick={handleAppleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Email form or OTP verification */}
        {!emailSent ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Sending code...' : 'Continue with Email'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Success message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col items-center gap-4 text-center">
              <CheckCircle className="text-green-600" size={48} />
              <div>
                <p className="text-green-800 font-bold text-lg mb-2">Check your email!</p>
                <p className="text-green-700 text-sm mb-3">
                  We sent a magic link to <strong>{email}</strong>
                </p>
                <p className="text-green-600 text-xs">
                  Click the link in the email to sign in. The link expires in 60 minutes.
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm font-semibold mb-2">📧 Didn't receive the email?</p>
              <ul className="text-blue-700 text-xs space-y-1 ml-4 list-disc">
                <li>Check your spam/junk folder</li>
                <li>Make sure you entered the correct email</li>
                <li>Wait a few minutes for the email to arrive</li>
              </ul>
            </div>

            {/* Resend link */}
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setEmailSent(false);
                  setError(null);
                }}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                ← Use a different email
              </button>
              <p className="text-xs text-gray-500">
                You can close this window and return after clicking the link.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">Terms</a>
          {' '}and{' '}
          <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
