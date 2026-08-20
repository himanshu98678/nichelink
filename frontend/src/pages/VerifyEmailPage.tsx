import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, KeyRound, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, completePendingVerification } = useAuth();

  // Get email from location state, auth user, or default fallback
  const rawEmail = (location.state as any)?.email || user?.email || 'rajeshkumarlamba82@gmail.com';
  const initialOtpSent = (location.state as any)?.otpSent !== false;
  
  // Mask email: rajeshkumarlamba82@gmail.com -> rajesh********@gmail.com
  const maskEmail = (emailStr: string): string => {
    if (!emailStr || !emailStr.includes('@')) return 'your***@email.com';
    const [name, domain] = emailStr.split('@');
    if (name.length <= 3) {
      return `${name[0]}***@${domain}`;
    }
    const visibleChars = Math.min(6, Math.floor(name.length / 2));
    const maskedPortion = '*'.repeat(Math.max(4, name.length - visibleChars));
    return `${name.slice(0, visibleChars)}${maskedPortion}@${domain}`;
  };

  const maskedEmail = maskEmail(rawEmail);

  // OTP State: 6-digit array
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialOtpSent ? null : 'Unable to send OTP. Please try again.');
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [resendNotice, setResendNotice] = useState<string | null>(initialOtpSent ? 'OTP sent successfully. Check your email.' : null);
  // Removed mock OTP configurations

  // Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Digits only
    if (!/^\d*$/.test(value)) return;

    setErrorMessage(null);
    setResendNotice(null);

    const newOtp = [...otp];
    // Take the last character if typed
    const digit = value.slice(-1);
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto advance focus
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move back and clear previous
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.DragEvent | React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = 'clipboardData' in e ? e.clipboardData.getData('text') : '';
    const cleanNumbers = pastedData.replace(/\D/g, '').slice(0, 6);

    if (cleanNumbers.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = cleanNumbers[i] || '';
      }
      setOtp(newOtp);

      const nextFocusIndex = Math.min(cleanNumbers.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
    }
  };

  // Real OTP Verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResendNotice(null);

    const enteredOtp = otp.join('');

    if (enteredOtp.length === 0) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    if (enteredOtp.length < 6) {
      setErrorMessage('Please enter all 6 digits.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/email/otp/verify', {
        email: rawEmail,
        code: enteredOtp,
        type: 'VERIFY',
      });
      await completePendingVerification();
      setIsSuccess(true);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Real Resend OTP
  const handleResend = async () => {
    if (resendCountdown > 0) return;

    setErrorMessage(null);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    setIsLoading(true);

    try {
      await api.post<{ success: boolean }>('/email/otp', {
        email: rawEmail,
        type: 'VERIFY',
      });
      setResendCountdown(30);
      setResendNotice('New OTP sent successfully.');
    } catch (err: any) {
      setErrorMessage(api.getFriendlyMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Top Header / Brand */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center space-x-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-black text-xl">
            N
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Niche<span className="text-indigo-600">Link</span>
          </span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 space-y-6">
        
        {isSuccess ? (
          /* ================= SUCCESS STATE ================= */
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Email Verified! ✓</h2>
              <p className="text-sm text-slate-600">
                Your email has been successfully verified. Welcome to the NicheLink builder collective.
              </p>
            </div>

            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-900 font-medium">
              <Sparkles className="w-4 h-4 text-indigo-600 inline mr-1" />
              Your account is now fully unlocked with standard member privileges.
            </div>

            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>Continue to NicheLink</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ================= VERIFICATION FORM ================= */
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Verify your email</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                We've sent a 6-digit verification code to
              </p>
              <p className="text-sm font-bold text-slate-900 bg-slate-100 py-1 px-3 rounded-lg inline-block">
                {maskedEmail}
              </p>
            </div>

            {/* Error / Resend Alerts */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {resendNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-medium flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{resendNotice}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              
              {/* 6-Digit OTP Input Boxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-2xl border transition-all focus:outline-none ${
                        digit
                          ? 'border-indigo-600 bg-indigo-50/30 text-slate-900 ring-2 ring-indigo-500/20'
                          : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20'
                      }`}
                    />
                  ))}
                </div>

              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Email</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend & Change Email Footer Actions */}
            <div className="space-y-3 pt-2 text-center text-xs border-t border-slate-100">
              <div className="text-slate-600">
                <span>Didn't receive the code? </span>
                {resendCountdown > 0 ? (
                  <span className="font-bold text-slate-400">
                    Resend OTP in {resendCountdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 cursor-pointer"
                  >
                    {isLoading ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => navigate('/register', { state: { email: rawEmail } })}
                  className="text-slate-500 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
                >
                  Wrong email? <span className="text-indigo-600 hover:underline">Change email</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Security Note */}
      <div className="mt-6 text-center text-xs text-slate-500 flex items-center space-x-1.5">
        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
        <span>End-to-end encrypted registration verification</span>
      </div>
    </div>
  );
};
