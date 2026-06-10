import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye, EyeOff, AlertCircle, Mail, Clock, Lock, Key,
  ArrowLeft, CheckCircle, GraduationCap, ArrowRight, Check, X
} from 'lucide-react';
import { useAppStore } from '../store';

// ==========================================
// MOCK EMAIL OTP STORAGE (In memory context)
// ==========================================
let MOCK_RESET_EMAIL = 'user@example.com';

// ==========================================
// SHARED COLLABORATIVE LEFT PANEL
// ==========================================
export function DecorativeLeftPanel({ quoteMode = false }: { quoteMode?: boolean }) {
  return (
    <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-[#143642] to-[#0F8B8D] p-12 text-white relative overflow-hidden" id="auth-brand-left-panel">
      {/* Subtle grid and glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-white/5 filter blur-3xl" />

      {/* Top logo block */}
      <Link to="/" className="flex items-center gap-3 relative z-10 self-start group">
        <div className="w-10 h-10 rounded-full bg-[#0F8B8D]/35 flex items-center justify-center text-white scale-100 group-hover:scale-105 transition-transform border border-white/20">
          <GraduationCap className="w-5 h-5" />
        </div>
        <span className="font-display font-black text-xl text-white tracking-wide">
          LearnSphere
        </span>
      </Link>

      {/* Center content */}
      <div className="my-auto relative z-10 max-w-md" id="left-panel-middle-msg">
        {quoteMode ? (
          <div className="space-y-6">
            <h2 className="font-serif text-3xl font-bold leading-normal italic text-yellow-100">
              "Education is not the filling of a pail, but the lighting of a fire."
            </h2>
            <p className="font-display font-bold text-sm tracking-wide text-white/70 uppercase">
              — W.B. Yeats
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="font-display font-black text-4xl leading-tight">
              Where Knowledge Meets Collaboration
            </h2>
            <p className="font-sans text-brand-light/80 text-sm">
              An all-in-one education cockpit designed with modern aesthetic choices to maximize engagement, clarity, and metrics reporting.
            </p>
            <div className="pt-4 flex flex-wrap gap-2" id="left-panel-badges">
              {['✓ Free to use', '✓ No credit card', '✓ Instant setup'].map((b) => (
                <span key={b} className="bg-white/10 text-white rounded-full px-3 py-1.5 text-xs font-semibold">
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer info */}
      <div className="relative z-10 font-sans text-xs text-white/50 flex justify-between uppercase tracking-wider" id="left-panel-footer">
        <span>© 2026 LearnSphere Inc.</span>
        <span>Secure Session</span>
      </div>
    </div>
  );
}


// ==========================================
// 1. LOGIN PAGE
// ==========================================
export function LoginPage() {
  const navigate = useNavigate();
  const login = useAppStore(state => state.login);
  const addToast = useAppStore(state => state.addToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [loading, setLoading] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner('');

    if (!email) {
      setErrorBanner('Please enter your email address.');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrorBanner('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorBanner('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      setLoading(false);
      if (success) {
        addToast('Logged in successfully!', 'success');
        navigate('/dashboard');
      } else {
        setErrorBanner('Invalid email or password. Try again.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorBanner(err.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex text-left font-sans" id="login-page-root">
      <DecorativeLeftPanel quoteMode={true} />

      {/* Right panel side form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-6 md:px-16 py-12 relative">
        <div className="max-w-md w-full mx-auto" id="login-form-container">

          {/* Mobile Back and Logo */}
          <div className="flex justify-between items-center lg:hidden mb-8">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#0F8B8D] flex items-center justify-center text-white font-bold text-xs">LS</span>
              <span className="font-display font-black text-base text-[#143642]">LearnSphere</span>
            </div>
            <Link to="/" className="text-xs font-semibold text-brand-primary flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back Home
            </Link>
          </div>

          <div className="mb-8" id="login-welcome-messages">
            <h2 className="font-display font-black text-3xl text-brand-dark mb-2">
              Welcome Back 👋
            </h2>
            <p className="text-sm text-brand-dark/60 font-medium">
              New here?{' '}
              <Link to="/signup" className="text-[#0F8B8D] hover:underline font-bold">
                Create an account
              </Link>
            </p>
          </div>



          {errorBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#A8201A]/10 border border-[#A8201A] text-[#A8201A] p-4 rounded-xl flex items-start gap-2.5 mb-6 text-sm"
              id="login-error-banner"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorBanner}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" id="login-form-form">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 p-3.5 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none transition-shadow"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-brand-dark uppercase tracking-wide">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[#0F8B8D] hover:underline font-bold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-gray-200 p-3.5 pr-12 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all shadow-md mt-4 flex items-center justify-center gap-2 ${loading ? 'bg-brand-dark/45 cursor-not-allowed' : 'bg-[#0F8B8D] hover:bg-[#0a7173] scale-100 hover:scale-[1.01] teal-glow'
                }`}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          <p className="text-[11px] text-gray-400 font-sans text-center mt-8">
            By signing in, you agree to our <span className="underline cursor-not-allowed">Terms of Service</span> and <span className="underline cursor-not-allowed">Privacy Policy</span>.
          </p>

        </div>
      </div>
    </div>
  );
}


// ==========================================
// 2. SIGNUP PAGE
// ==========================================
export function SignupPage() {
  const navigate = useNavigate();
  const signupStore = useAppStore(state => state.signup);
  const addToast = useAppStore(state => state.addToast);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Custom Errors object
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper live password quality meter checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const passwordStrength = () => {
    if (!password) return { label: 'Empty', color: 'bg-gray-100', width: 'w-0' };
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasUppercase) score += 1;
    if (hasNumber) score += 1;

    if (score <= 1) return { label: 'Weak', color: 'bg-[#A8201A]', width: 'w-1/3' };
    if (score === 2) return { label: 'Medium', color: 'bg-[#EC9A29]', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-[#0F8B8D]', width: 'w-full' };
  };

  const handleValidation = () => {
    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    const letterCount = (trimmedName.match(/[a-zA-Z]/g) || []).length;
    const nameRegex = /^[a-zA-Z][a-zA-Z\s@]*$/;

    if (!trimmedName) {
      errs.name = 'Full Name is required.';
    } else if (!nameRegex.test(trimmedName)) {
      errs.name = 'Name must start with a letter and contain only letters, spaces, or "@".';
    } else if (letterCount < 3) {
      errs.name = 'Name must contain at least 3 letters (A-Z).';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      errs.email = 'Enter a valid email address.';
    }

    if (!password) errs.password = 'Password is required.';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    else if (!hasUppercase || !hasNumber) errs.password = 'Password needs at least one uppercase and one number.';

    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setLoading(true);
    try {
      await signupStore(name, email, password);
      setLoading(false);
      navigate('/dashboard');
    } catch (err: any) {
      setLoading(false);
    }
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex text-left font-sans" id="signup-page-root">
      <DecorativeLeftPanel quoteMode={false} />

      {/* Right panel side form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-6 md:px-16 py-8 relative overflow-y-auto">
        <div className="max-w-md w-full mx-auto" id="signup-form-container">

          {/* Mobile Back & Logo */}
          <div className="flex justify-between items-center lg:hidden mb-6">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#0F8B8D] flex items-center justify-center text-white font-bold text-xs">LS</span>
              <span className="font-display font-black text-base text-[#143642]">LearnSphere</span>
            </div>
            <Link to="/" className="text-xs font-semibold text-[#0F8B8D] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back Home
            </Link>
          </div>

          <div className="mb-6" id="signup-top-banner">
            <h2 className="font-display font-black text-3xl text-brand-dark mb-2">
              Create Your Account
            </h2>
            <p className="text-sm text-brand-dark/60 font-medium">
              Already have one?{' '}
              <Link to="/login" className="text-[#0F8B8D] hover:underline font-bold">
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="signup-form-form">

            {/* Role selection is now dynamic and context-based */}

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1 uppercase tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={`w-full rounded-xl border p-3 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none transition-shadow ${errors.name ? 'border-[#A8201A]' : 'border-gray-200'
                  }`}
              />
              {errors.name && (
                <p className="text-[#A8201A] text-xs font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full rounded-xl border p-3 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none transition-shadow ${errors.email ? 'border-[#A8201A]' : 'border-gray-200'
                  }`}
              />
              {errors.email && (
                <p className="text-[#A8201A] text-xs font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`w-full rounded-xl border p-3 pr-12 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none transition-shadow ${errors.password ? 'border-[#A8201A]' : 'border-gray-200'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* LIVE PASSWORD STRENGTH DISPLAY METER */}
              {password && (
                <div className="mt-2.5 space-y-1.5" id="pstrength-meter">
                  <div className="flex justify-between items-center text-[10px] font-bold text-brand-dark">
                    <span>Password Strength:</span>
                    <span className="uppercase tracking-wide font-black">{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                  </div>
                  {/* Validation status bullets */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[10px] text-brand-dark/70 font-semibold">
                    <span className="flex items-center gap-1">
                      {hasMinLength ? <Check className="w-3 h-3 text-[#0F8B8D]" /> : <X className="w-3 h-3 text-[#A8201A]" />}
                      Min. 8 characters
                    </span>
                    <span className="flex items-center gap-1">
                      {hasUppercase ? <Check className="w-3 h-3 text-[#0F8B8D]" /> : <X className="w-3 h-3 text-[#A8201A]" />}
                      At least 1 uppercase
                    </span>
                    <span className="flex items-center gap-1 col-span-2">
                      {hasNumber ? <Check className="w-3 h-3 text-[#0F8B8D]" /> : <X className="w-3 h-3 text-[#A8201A]" />}
                      At least 1 number digit
                    </span>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="text-[#A8201A] text-xs font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1 uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={`w-full rounded-xl border p-3 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none transition-shadow ${errors.confirmPassword ? 'border-[#A8201A]' : 'border-gray-200'
                  }`}
              />
              {errors.confirmPassword && (
                <p className="text-[#A8201A] text-xs font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all shadow-md mt-6 flex items-center justify-center gap-2 ${loading ? 'bg-brand-dark/45 cursor-not-allowed' : 'bg-[#0F8B8D] hover:bg-[#0a7173] scale-100 hover:scale-[1.01] teal-glow'
                }`}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}


// ==========================================
// 3. FORGOT PASSWORD PAGE
// ==========================================
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const addToast = useAppStore(state => state.addToast);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(59);

  const forgotPassword = useAppStore(state => state.forgotPassword);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success && resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [success, resendCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast('Please input an email.', 'warning');
      return;
    }

    setLoading(true);
    const token = await forgotPassword(email);
    setLoading(false);

    if (token) {
      MOCK_RESET_EMAIL = email;
      sessionStorage.setItem('tempToken', token);
      setSuccess(true);
    }
  };

  const handleResend = () => {
    setResendCountdown(59);
    addToast('New 6-digit OTP resent successfully!', 'success');
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-6 text-left font-sans" id="forgot-pwd-root">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center" id="forgot-pwd-card"
      >
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="request-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#0F8B8D]/15 flex items-center justify-center text-[#0F8B8D] mb-6">
                <Mail className="w-8 h-8" />
              </div>

              <h2 className="font-display font-black text-2xl text-brand-dark mb-2 text-center">
                Forgot Password?
              </h2>
              <p className="text-xs text-brand-dark/65 font-semibold text-center mb-6 leading-relaxed">
                No worries! Enter your email address below and we will send you a 6-digit OTP code to safely verify and reset it.
              </p>

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-wide">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0F8B8D] hover:bg-[#0a7173] text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="sent-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#0F8B8D]/15 flex items-center justify-center text-[#0F8B8D] mb-6">
                <CheckCircle className="w-8 h-8" />
              </div>

              <h2 className="font-display font-black text-2xl text-brand-dark mb-2 text-center">
                Check Your Inbox
              </h2>
              <p className="text-sm font-sans font-medium text-brand-dark/75 text-center mb-6 leading-relaxed">
                We sent a secure verification code to <span className="text-[#0F8B8D] font-bold">{email}</span>. Click below to continue.
              </p>



              <button
                onClick={() => navigate('/verify-otp')}
                className="w-full bg-[#0F8B8D] hover:bg-[#0a7173] text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group"
              >
                Continue to Verify
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center font-sans text-xs text-brand-dark/70 mt-6 font-semibold select-none">
                Didn't get the email?{' '}
                {resendCountdown > 0 ? (
                  <span className="text-[#EC9A29] font-black">Resend in 00:{resendCountdown.toString().padStart(2, '0')}</span>
                ) : (
                  <button onClick={handleResend} className="text-[#0F8B8D] font-bold hover:underline">
                    Resend Code
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Link to="/login" className="text-xs font-bold text-[#0F8B8D] hover:underline flex items-center gap-1.5 mt-8 border-t border-gray-100 pt-4 w-full justify-center">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
        </Link>
      </motion.div>
    </div>
  );
}


// ==========================================
// 4. OTP VERIFICATION PAGE
// ==========================================
export function VerifyOtpPage() {
  const navigate = useNavigate();
  const addToast = useAppStore(state => state.addToast);

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [countdown, setCountdown] = useState(299); // 5 mins

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Digit auto expiration countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle focus movement
  const handleDigitChange = (idx: number, val: string) => {
    const freshDigits = [...digits];
    const cleaned = val.replace(/[^0-9]/g, '');

    if (cleaned) {
      freshDigits[idx] = cleaned.slice(-1);
      setDigits(freshDigits);

      // forward focus
      if (idx < 5) {
        inputRefs[idx + 1].current?.focus();
      }
    } else {
      freshDigits[idx] = '';
      setDigits(freshDigits);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      // Move focus background & empty previous
      const freshDigits = [...digits];
      freshDigits[idx - 1] = '';
      setDigits(freshDigits);
      inputRefs[idx - 1].current?.focus();
    }
  };

  // Clipboard paste whole code support
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const freshDigits = pasted.split('');
      setDigits(freshDigits);
      inputRefs[5].current?.focus();
    }
  };

  const formattedTimer = () => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const verifyOtp = useAppStore(state => state.verifyOtp);

  const checkOtpCode = async () => {
    const code = digits.join('');
    if (code.length !== 6) {
      addToast('Please enter all 6 digits.', 'warning');
      return;
    }

    const tempToken = sessionStorage.getItem('tempToken');
    if (!tempToken) {
      addToast('Session expired. Please request OTP again.', 'error');
      navigate('/forgot-password');
      return;
    }

    setLoading(true);
    const verifiedToken = await verifyOtp(code, tempToken);
    setLoading(false);

    if (verifiedToken) {
      sessionStorage.setItem('verifiedToken', verifiedToken);
      navigate('/reset-password');
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  const maskedEmail = () => {
    const email = MOCK_RESET_EMAIL;
    const parts = email.split('@');
    if (parts.length === 2) {
      const first = parts[0];
      const second = parts[1];
      const starred = first.length > 2
        ? first[0] + '*'.repeat(first.length - 2) + first[first.length - 1]
        : first + '***';
      return `${starred}@${second}`;
    }
    return email;
  };

  const timerExpired = countdown === 0;

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-6 text-left font-sans" id="verify-otp-root">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center" id="verify-otp-card"
      >
        <div className="w-16 h-16 rounded-full bg-[#EC9A29]/15 flex items-center justify-center text-[#EC9A29] mb-5">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="font-display font-black text-2xl text-brand-dark mb-2 text-center select-none">
          Verify Security Code
        </h2>
        <p className="text-xs text-brand-dark/70 font-semibold text-center mb-6 leading-relaxed select-none">
          We sent a 6-digit email confirmation code to <span className="text-[#0F8B8D] font-bold">{maskedEmail()}</span>.
        </p>

        {/* OTP Input Boxes group */}
        <motion.div
          animate={shaking ? { x: [-10, 10, -10, 10, -10, 10, 0] } : {}}
          className="flex justify-between gap-2.5 w-full mb-4"
          id="otp-digits-box-wrapper"
        >
          {digits.map((dig, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={1}
              value={dig}
              onPaste={idx === 0 ? handlePaste : undefined}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-12 h-14 rounded-xl border-2 border-brand-light text-center font-display font-black text-xl text-[#143642] focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/20 focus:outline-none transition-all leading-none"
            />
          ))}
        </motion.div>

        {/* Timer stats info */}
        <div className="flex justify-between items-center w-full mb-6 text-xs select-none">
          <span className="font-semibold text-brand-dark/65 flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${countdown < 60 ? 'text-[#A8201A] animate-pulse' : 'text-gray-400'}`} />
            {timerExpired ? (
              <span className="text-[#A8201A] font-black">Code expired. Please resend!</span>
            ) : (
              <span>Expires in <strong className={countdown < 60 ? 'text-[#A8201A]' : 'text-brand-dark'}>{formattedTimer()}</strong></span>
            )}
          </span>

        </div>

        <button
          type="button"
          onClick={checkOtpCode}
          disabled={loading || timerExpired || digits.includes('')}
          className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-md text-white ${loading || timerExpired || digits.includes('')
            ? 'bg-gray-300 cursor-not-allowed shadow-none'
            : 'bg-[#0F8B8D] hover:bg-[#0a7173] scale-100 hover:scale-[1.01]'
            }`}
        >
          {loading ? 'Verifying...' : 'Verify Secret Code'}
        </button>

        <button
          type="button"
          onClick={() => { setCountdown(299); addToast('A fresh OTP has been emailed!', 'success'); }}
          className="text-xs font-bold text-[#0F8B8D] hover:underline mt-6 select-none"
        >
          Didn't receive code? Resend Email
        </button>

        <Link to="/forgot-password" className="text-xs font-bold text-gray-500 hover:underline flex items-center gap-1.5 mt-8 border-t border-gray-150 pt-4 w-full justify-center">
          <ArrowLeft className="w-3.5 h-3.5" /> Change email
        </Link>
      </motion.div>
    </div>
  );
}


// ==========================================
// 5. RESET PASSWORD PAGE
// ==========================================
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const addToast = useAppStore(state => state.addToast);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Live checker checklist
  const checkLength = password.length >= 8;
  const checkUpper = /[A-Z]/.test(password);
  const checkDigit = /[0-9]/.test(password);

  const resetPassword = useAppStore(state => state.resetPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkLength || !checkUpper || !checkDigit) {
      addToast('Please complete all requirements first.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      addToast('Passwords mismatch.', 'error');
      return;
    }

    const verifiedToken = sessionStorage.getItem('verifiedToken');
    if (!verifiedToken) {
      addToast('Session expired. Please verify OTP again.', 'error');
      navigate('/forgot-password');
      return;
    }

    setLoading(true);
    const successRes = await resetPassword(password, verifiedToken);
    setLoading(false);

    if (successRes) {
      setSuccess(true);
      sessionStorage.removeItem('tempToken');
      sessionStorage.removeItem('verifiedToken');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-6 text-left font-sans" id="reset-pwd-root">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center" id="reset-pwd-card"
      >
        <div className="w-16 h-16 rounded-full bg-[#0F8B8D]/15 flex items-center justify-center text-[#0F8B8D] mb-5">
          <Key className="w-8 h-8" />
        </div>

        <h2 className="font-display font-black text-2xl text-brand-dark mb-2 text-center">
          Set New Password
        </h2>
        <p className="text-xs text-brand-dark/70 font-semibold text-center mb-6 select-none">
          Choose a secure, strong and unique password.
        </p>

        {success ? (
          <div className="w-full py-4 text-center space-y-4" id="success-reset-message">
            <div className="inline-flex py-1.5 px-4 rounded-full bg-[#0F8B8D]/15 text-[#0F8B8D] text-xs font-bold uppercase tracking-wider items-center gap-1">
              <Check className="w-3.5 h-3.5Stroke-2" /> Password Reset Complete!
            </div>
            <p className="text-sm font-sans text-brand-dark/70 font-medium">
              Redirecting you to the portal login interface in 2 seconds...
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#0F8B8D] hover:bg-[#0a7173] text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm"
            >
              Go to Login now →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-4" id="reset-pwd-form-form">
            <div>
              <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter custom password"
                  className="w-full rounded-xl border border-gray-200 p-3 pr-12 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Requirement Checklist dynamic bubbles */}
              <div className="bg-gray-50 border border-gray-150 p-3 rounded-xl mt-3 space-y-1.5 select-none text-[10px] font-semibold text-brand-dark/85">
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${checkLength ? 'bg-[#0F8B8D]' : 'bg-red-400'}`}>
                    {checkLength ? '✓' : '✗'}
                  </span>
                  <span>At least 8 parameters length</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${checkUpper ? 'bg-[#0F8B8D]' : 'bg-red-400'}`}>
                    {checkUpper ? '✓' : '✗'}
                  </span>
                  <span>Contains an Uppercase letter [A-Z]</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${checkDigit ? 'bg-[#0F8B8D]' : 'bg-red-400'}`}>
                    {checkDigit ? '✓' : '✗'}
                  </span>
                  <span>Contains at least one number [0-9]</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-brand-dark mb-1.5 uppercase tracking-wide">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[#A8201A] text-[10px] font-black mt-1 flex items-center gap-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Passwords must match.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || password !== confirmPassword || !checkLength || !checkUpper || !checkDigit}
              className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-md text-white flex items-center justify-center gap-2 ${loading || password !== confirmPassword || !checkLength || !checkUpper || !checkDigit
                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                : 'bg-[#0F8B8D] hover:bg-[#0a7173] scale-100 hover:scale-[1.01]'
                }`}
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
