import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  LogIn,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, signup, loginWithGoogle, forgotPassword, resetPassword, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen) return null;

  const handleSwitchMode = (newMode: 'login' | 'signup' | 'forgot' | 'reset') => {
    setMode(newMode);
    clearError();
    setLocalSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalSuccess(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        await signup(name, email, password);
        onClose();
      } else if (mode === 'forgot') {
        const res = await forgotPassword(email);
        setLocalSuccess(res.message);
        if (res.resetToken) {
          setResetToken(res.resetToken);
          // Transition to reset form with token prefilled
          setTimeout(() => {
            setMode('reset');
          }, 1500);
        }
      } else if (mode === 'reset') {
        const res = await resetPassword(resetToken, newPassword);
        setLocalSuccess(res.message);
        setTimeout(() => {
          setMode('login');
          setLocalSuccess('Password reset successfully. Please log in with your new password.');
        }, 1500);
      }
    } catch {
      // AuthContext sets error state
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo Quick-Fill Accounts
  const handleQuickFill = (demoEmail: string, demoPass: string, demoName?: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    if (demoName) setName(demoName);
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle('demo.shopper@google.com', 'Alex Mercer');
      onClose();
    } catch {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="auth-modal-container"
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
              {mode === 'login' && <LogIn className="w-4 h-4" />}
              {mode === 'signup' && <UserPlus className="w-4 h-4" />}
              {mode === 'forgot' && <KeyRound className="w-4 h-4" />}
              {mode === 'reset' && <ShieldCheck className="w-4 h-4" />}
            </span>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {mode === 'login' && 'Sign In to Account'}
              {mode === 'signup' && 'Create Your Account'}
              {mode === 'forgot' && 'Reset Your Password'}
              {mode === 'reset' && 'Enter New Password'}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {mode === 'login' && 'Access your personalized cart, order history, and AI recommendations'}
            {mode === 'signup' && 'Sign up in seconds to start shopping with full checkout capabilities'}
            {mode === 'forgot' && "Enter your email to receive a password reset token"}
            {mode === 'reset' && 'Provide your reset token and new secure password'}
          </p>

          {/* Tab Switcher (Login / Sign Up) */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg mt-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className={`py-1.5 rounded-md transition cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('signup')}
                className={`py-1.5 rounded-md transition cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Banners */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {localSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{localSuccess}</span>
            </div>
          )}

          {/* Quick Demo Credentials Bar for Easy Testing */}
          {mode === 'login' && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  1-Click Demo Logins
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">password123</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('sophia.r@example.com', 'password123')}
                  className="flex-1 py-1.5 px-2 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[11px] text-neutral-700 dark:text-neutral-300 font-medium transition cursor-pointer text-center"
                >
                  Sophia (Customer)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('elena.vance@agenticcommerce.com', 'password123')}
                  className="flex-1 py-1.5 px-2 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[11px] text-neutral-700 dark:text-neutral-300 font-medium transition cursor-pointer text-center"
                >
                  Elena (Admin)
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name Field (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Password Field (Login & Signup) */}
            {(mode === 'login' || mode === 'signup') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('forgot')}
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Reset Token & New Password (Reset mode only) */}
            {mode === 'reset' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="rst_..."
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    New Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Generate Reset Token'}
                  {mode === 'reset' && 'Update Password'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign-In Divider */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
                <span className="bg-white dark:bg-neutral-900 px-3 text-[11px] text-neutral-400 uppercase tracking-wider font-medium">
                  or
                </span>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2 px-4 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 transition cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google OAuth
              </button>
            </>
          )}

          {/* Footer Back Links */}
          {(mode === 'forgot' || mode === 'reset') && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
