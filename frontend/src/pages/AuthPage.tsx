import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Network, ArrowRight, CheckCircle2, Sparkles, ShieldCheck, Zap, Mail, Lock, User, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register, login } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(() => {
    if (location.pathname === '/signup' || location.pathname === '/register') return 'register';
    if (location.pathname === '/forgot-password') return 'forgot-password';
    return 'login';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('Senior Full Stack Engineer');
  const [niche, setNiche] = useState('saas-developers');
  const [resetSent, setResetSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirmation, setResetPasswordConfirmation] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Determine intended destination
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    setErrorMessage('');
    if (location.pathname === '/signin' || location.pathname === '/login') {
      setMode('login');
      setResetSent(false);
      setResetComplete(false);
    } else if (location.pathname === '/signup' || location.pathname === '/register') {
      setMode('register');
      setResetSent(false);
      setResetComplete(false);
    } else if (location.pathname === '/forgot-password') {
      setMode('forgot-password');
    }
  }, [location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'forgot-password') {
      if (!email.trim()) {
        setErrorMessage('Please enter your email address to reset password.');
        return;
      }
      setIsLoading(true);
      try {
        await api.post('/auth/forgot-password', { email: email.trim() });
        setResetSent(true);
      } catch (err: any) {
        setErrorMessage(api.getFriendlyMessage(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      if (!email.trim() || !password.trim()) {
        setErrorMessage('Please provide both email and password.');
        return;
      }
      const registeredEmail = email.trim();
      setIsLoading(true);
      try {
        const registration = await register({
          name: name || 'Alex Morgan',
          email: registeredEmail,
          password: password,
          role: headline,
          primaryCommunity: niche,
        });
        navigate('/verify-email', { state: { email: registeredEmail, otpSent: registration.otpSent } });
      } catch (err: any) {
        setErrorMessage(api.getFriendlyMessage(err));
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setErrorMessage('Please enter your email and password.');
        return;
      }
      setIsLoading(true);
      try {
        await login(email.trim(), password);
        navigate(from, { replace: true });
      } catch (err: any) {
        const errorMsg = api.getFriendlyMessage(err);
        setErrorMessage(errorMsg);

        if (errorMsg.toLowerCase().includes('verify your email')) {
          navigate('/verify-email', { state: { email: email.trim() } });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!resetToken.trim() || !resetPassword) {
      setErrorMessage('Please enter the reset token and a new password.');
      return;
    }

    if (resetPassword !== resetPasswordConfirmation) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: resetToken.trim(),
        password: resetPassword,
      });
      setResetSent(false);
      setResetComplete(true);
      setResetToken('');
      setResetPassword('');
      setResetPasswordConfirmation('');
      setMode('login');
      navigate('/login', { replace: true });
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoRegister = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const registration = await register({
        name: 'Jordan Lee',
        email: 'jordan@nichelink.dev',
        role: 'Full-Stack SaaS Builder',
        primaryCommunity: 'saas-developers',
      });
      navigate('/verify-email', { state: { email: 'jordan@nichelink.dev', otpSent: registration.otpSent } });
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'FreeMember' | 'ProMember') => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login(role === 'ProMember' ? 'alex@nichelink.dev' : 'taylor@nichelink.dev', role);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Back to Landing Page Link */}
      <div className="mb-6">
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <span>← Back to Landing Page</span>
        </Link>
      </div>

      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <Network className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              NicheLink
            </span>
          </Link>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight pt-2">
            {mode === 'register'
              ? 'Create Your Account'
              : mode === 'forgot-password'
              ? 'Reset Your Password'
              : 'Sign In to NicheLink'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'register'
              ? 'Connect with verified remote peers, join micro-tribes, and access project matches.'
              : mode === 'forgot-password'
              ? 'Enter your account email to receive a password reset link.'
              : 'Sign in to access your dashboard, discussions, and community hubs.'}
          </p>
        </div>

        {/* Intended Destination Notice if redirected */}
        {from && from !== '/dashboard' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Please sign in to access <strong className="font-semibold">{from}</strong>.</span>
          </div>
        )}

        {/* Mode Toggle Tabs: Sign Up vs Sign In */}
        {mode !== 'forgot-password' && (
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                navigate('/register', { replace: true, state: location.state });
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                navigate('/login', { replace: true, state: location.state });
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Quick Reviewer Presets for Fast Verification */}
        {mode !== 'forgot-password' && (
          <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
              ⚡ Quick Demo Login (One-Click)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('FreeMember')}
                className="py-1.5 px-2.5 bg-white text-indigo-900 hover:bg-indigo-100/80 rounded-xl text-[11px] font-bold border border-indigo-200 text-center transition-colors cursor-pointer"
              >
                Free Member Demo →
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ProMember')}
                className="py-1.5 px-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-[11px] font-bold text-center transition-colors cursor-pointer"
              >
                Pro Member Demo →
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        {resetComplete && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
            Your password has been reset. You can now sign in with your new password.
          </div>
        )}

        {resetSent ? (
          <div className="space-y-4">
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900">Reset Instructions Sent</h4>
              <p className="text-xs text-emerald-700">
                If an account exists for <strong>{email}</strong>, reset instructions have been sent.
              </p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reset Token</label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={resetPasswordConfirmation}
                  onChange={(e) => setResetPasswordConfirmation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setResetSent(false);
                setMode('login');
                navigate('/login', { replace: true });
              }}
              className="w-full py-2 bg-slate-100 text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Headline / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Full-Stack Engineer"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                required
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {mode !== 'forgot-password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  {mode === 'login' && (
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Niche Community</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="saas-developers">SaaS Developers Hub</option>
                  <option value="ai-engineers">AI & Machine Learning</option>
                  <option value="designers">UI/UX & Product Designers</option>
                  <option value="digital-nomads">Digital Nomads & Global Remote</option>
                  <option value="technical-writers">Technical Documentation</option>
                  <option value="freelancers">Independent Consultants</option>
                  <option value="founders">Early Stage Founders</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {isLoading ? (
                  mode === 'register' ? 'Creating Account...' : 'Processing...'
                ) : (
                  mode === 'register'
                    ? 'Create Account'
                    : mode === 'forgot-password'
                    ? 'Send Reset Instructions'
                    : 'Enter Dashboard'
                )}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
              {mode === 'register' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      navigate('/login', { replace: true, state: location.state });
                    }}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              ) : mode === 'forgot-password' ? (
                <p>
                  Remembered your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      navigate('/login', { replace: true, state: location.state });
                    }}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      navigate('/register', { replace: true, state: location.state });
                    }}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Join NicheLink Free
                  </button>
                </p>
              )}
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
