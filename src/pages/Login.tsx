import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  useAuth,
  firebaseLogin,
  firebaseRegister,
  firebaseGoogleLogin,
  firebaseResetPassword,
  firebaseSendVerificationEmail,
  type UserRole,
} from '../context/AuthContext';
import { Chrome, Loader2, Lock, KeyRound } from 'lucide-react';

type AuthMode = 'login' | 'signup';

interface PendingProfile {
  fullName: string;
  phone: string;
  role: UserRole;
  company: string;
  city: string;
  designation: string;
  preferredStation: string;
  authMethod: 'google' | 'password' | 'demo';
}

function getMode(mode: string | null): AuthMode {
  return mode === 'signup' ? 'signup' : 'login';
}

function getFriendlyError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'Email already registered. Please log in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before it finished.';
    case 'auth/invalid-phone-number':
      return 'Please enter a valid phone number with country code.';
    case 'auth/code-expired':
    case 'auth/invalid-verification-code':
      return 'OTP code is invalid or expired. Request a new code.';
    case 'auth/captcha-check-failed':
      return 'OTP verification could not complete. Try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [role, setRole] = useState<UserRole>('user');
  const [preferredStation, setPreferredStation] = useState('Central Hub');
  const [forgotPasswordSent, setForgotPasswordSent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, profile, updateProfile } = useAuth();
  const navigate = useNavigate();

  const mode = getMode(searchParams.get('mode'));
  const isSignup = mode === 'signup';

  useEffect(() => {
    if (!searchParams.get('mode')) {
      setSearchParams({ mode: 'login' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFullName((current) => current || profile.fullName);
    setPhone((current) => current || profile.phone);
    setCompany((current) => current || profile.company);
    setCity((current) => current || profile.city);
    setRole(profile.role);
    setPreferredStation((current) => current || profile.preferredStation);
  }, [profile]);

  const setMode = (nextMode: AuthMode) => {
    setError('');
    setForgotPasswordSent('');
    setSearchParams({ mode: nextMode });
  };

  const buildProfile = (nextEmail: string): PendingProfile => ({
    fullName: fullName.trim() || profile?.fullName || nextEmail.split('@')[0].replace(/[._-]/g, ' '),
    phone: phone.trim() || profile?.phone || '',
    role,
    company: company.trim() || (role === 'operator' ? 'GridSense Operations' : 'Independent EV Owner'),
    city: city.trim() || 'Bengaluru',
    designation: role === 'operator' ? 'Grid Operations Lead' : 'EV Driver',
    preferredStation: preferredStation.trim() || (role === 'operator' ? 'Command Center' : 'Central Hub'),
    authMethod: 'password',
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setForgotPasswordSent('');
    setIsLoading(true);

    try {
      if (email === 'demo@gridsense.ai' && password === 'demo1234') {
        login('demo-token', 'demo@gridsense.ai', {
          fullName: 'Demo Operator',
          phone: '+911234567890',
          role: 'operator',
          company: 'GridSense Demo Lab',
          city: 'Bengaluru',
          designation: 'Command Center Operator',
          preferredStation: 'Demo Hub',
          authMethod: 'demo',
          otpVerified: true,
        });
        navigate('/profile');
        return;
      }

      const credential = isSignup
        ? await firebaseRegister(email, password, fullName.trim() || email.split('@')[0])
        : await firebaseLogin(email, password);

      const nextProfile = buildProfile(credential.user.email ?? email);

      if (isSignup && credential.user.email) {
        await firebaseSendVerificationEmail(credential.user).catch(() => {});
      }

      const idToken = await credential.user.getIdToken();
      login(idToken, credential.user.email ?? email, {
        ...nextProfile,
        authMethod: 'password',
      });
      updateProfile({
        ...nextProfile,
        authMethod: 'password',
      });

      // After signup/login, go to profile
      navigate('/profile');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getFriendlyError(code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setForgotPasswordSent('');
    setIsLoading(true);

    try {
      await firebaseGoogleLogin();
      return;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getFriendlyError(code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = email.trim();

    if (!targetEmail) {
      setError('Enter your email first, then request a reset link.');
      return;
    }

    setError('');
    setForgotPasswordSent('');

    try {
      await firebaseResetPassword(targetEmail);
      setForgotPasswordSent(`Password reset link sent to ${targetEmail}.`);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getFriendlyError(code));
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#143a5b_0%,#08121d_40%,#05070b_100%)] px-4 py-6 text-white sm:px-6 lg:flex lg:items-center lg:justify-center">
      <div className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden border-r border-white/10 bg-[linear-gradient(180deg,rgba(34,197,94,0.06),rgba(6,182,212,0.02))] p-10 lg:flex lg:flex-col lg:justify-center">
            <div>
              <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold text-white/80">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950">
                  GS
                </span>
                GridSense AI
              </Link>
              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
                Secure access
              </p>
              <h1 className="mt-4 max-w-lg text-4xl font-black leading-tight tracking-tight text-white">
                Google sign-in and email onboarding.
              </h1>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                {isSignup
                  ? 'Sign up quickly with Google or email. Provide your city; phone is optional.'
                  : 'Login with email, Google, or the demo account.'}
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Link to="/" className="text-sm font-medium text-white/60 transition hover:text-white">
                Back to landing
              </Link>
              <div className="rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    !isSignup ? 'bg-white text-slate-950' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isSignup ? 'bg-emerald-400 text-slate-950' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {isSignup ? 'Create your account' : 'Login to your account'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isSignup
                  ? 'Sign up with Google or email. Provide your city; phone is optional.'
                  : 'Login with email, Google, or the demo account. Reset your password if you forget it.'}
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {isSignup ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/10"
                      placeholder="Aman Sharma"
                      required
                    />
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/10"
                    placeholder="operator@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/10"
                    placeholder="Enter a secure password"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Phone Number (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/10"
                    placeholder="+91 98765 43210"
                  />
                </div>

                {isSignup ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/10"
                      placeholder="Bengaluru"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Chrome size={16} />}
                  Continue with Google
                </button>
                {!isSignup ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    <KeyRound size={16} />
                    Forgot Password
                  </button>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {forgotPasswordSent ? (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                  {forgotPasswordSent}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:shadow-[0_12px_40px_rgba(34,211,238,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Lock size={16} />
                  )}
                  {isSignup ? 'Create account' : 'Login and continue'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
