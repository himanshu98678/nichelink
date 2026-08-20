import React, { useState } from 'react';
import { X, Network, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('Web Developers');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSuccess(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-md transition-opacity animate-fade-rise"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            {/* Header */}
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <Network className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-gray-900 tracking-tight">
                NicheLink<span className="text-indigo-600">t</span>
              </span>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mt-3">
              {mode === 'signup' ? 'Join the Professional Network' : 'Welcome back to NicheLink'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {mode === 'signup'
                ? 'Connect with verified peers, join niche communities, and access opportunities.'
                : 'Enter your credentials to access your feeds, messages, and projects.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Primary Niche Hub</label>
                  <select
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Web Developers">Web Developers & Engineers</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="Designers & Product">UI/UX Designers & Product Leads</option>
                    <option value="Entrepreneurs & Founders">Entrepreneurs & Founders</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{mode === 'signup' ? 'Create Free Account' : 'Log In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Toggle mode */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
              {mode === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Log in
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account yet?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Join NicheLink
                  </button>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {mode === 'signup' ? 'Welcome to NicheLink!' : 'Logged In Successfully!'}
            </h3>
            <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
              {mode === 'signup'
                ? `Your profile has been created and registered in the ${niche} community.`
                : `Welcome back! Redirecting you to your personalized NicheLink dashboard.`}
            </p>
            <button
              onClick={() => {
                setIsSuccess(false);
                onClose();
              }}
              className="mt-4 px-8 py-3 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Enter Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
