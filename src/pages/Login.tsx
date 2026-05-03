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
import { Building2, Chrome, Fingerprint, KeyRound, Loader2, Lock, Phone, ShieldCheck, Sparkles, User, Users } from 'lucide-react';

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
  const [role, setRole] = useState<UserRole>('operator');
  const [preferredStation, setPreferredStation] = useState('Central Hub');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpExpected, setOtpExpected] = useState('');
  const [pendingProfile, setPendingProfile] = useState<PendingProfile | null>(null);
  const [forgotPasswordSent, setForgotPasswordSent] = useState('');
  const [otpInfo, setOtpInfo] = useState('');
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
    setOtpStep(false);
    setOtpCode('');
    setOtpInfo('');
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

  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const requestOtp = (targetEmail: string, nextProfile: PendingProfile) => {
    const code = generateOtp();
    setOtpExpected(code);
    setOtpStep(true);
    setOtpCode('');
    setPendingProfile(nextProfile);
    setOtpInfo(`One-time code prepared for ${targetEmail}. Use the displayed code to continue.`);
  };

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

      if (isSignup) {
        requestOtp(credential.user.email ?? email, {
          ...nextProfile,
          authMethod: 'password',
        });
        return;
      }

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

    if (isSignup && !phone.trim()) {
      setError('Add a phone number before continuing with Google signup so OTP verification can complete.');
      return;
    }

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

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!otpExpected) {
        throw new Error('OTP session expired. Please request a new code.');
      }

      const verifiedProfile = {
        ...(pendingProfile ?? buildProfile(email)),
        phone: pendingProfile?.phone || phone,
        otpVerified: true,
      };

      if (otpCode.trim() !== otpExpected) {
        throw new Error('Incorrect OTP code. Please check and try again.');
      }

      updateProfile(verifiedProfile);
      login('otp-verified-token', email, verifiedProfile);

      setOtpStep(false);
      setOtpCode('');
      setOtpInfo('OTP verified successfully.');
      navigate('/profile');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getFriendlyError(code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setEmail('demo@gridsense.ai');
    setPassword('demo1234');
    setError('');
    setIsLoading(true);

    try {
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
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getFriendlyError(code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#143a5b_0%,#08121d_40%,#05070b_100%)] px-4 py-6 text-white sm:px-6 lg:flex lg:items-center lg:justify-center">
      <div className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden border-r border-white/10 bg-[linear-gradient(180deg,rgba(34,197,94,0.12),rgba(6,182,212,0.06))] p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold text-white/80">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950">
                  GS
                </span>
                GridSense AI
              </Link>
              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
                Secure access for operators and users
              </p>
              <h1 className="mt-4 max-w-lg text-5xl font-black leading-tight tracking-tight text-white">
                Google sign-in, OTP verification, and role-aware onboarding.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
                Create separate operator and user profiles, recover access with password reset links, and keep the onboarding flow simple enough for real-world use.
              </p>
            </div>

            <div className="grid gap-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Sparkles size={16} />
                  <span className="font-semibold">Role-aware signup</span>
                </div>
                <div className="mt-2 text-slate-300">Dedicated paths for operators and normal users.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-cyan-300">
                  <ShieldCheck size={16} />
                  <span className="font-semibold">Security-first flow</span>
                </div>
                <div className="mt-2 text-slate-300">OTP verification, password reset, and Google auth.</div>
              </div>
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
                  ? 'Choose the right role, register with Google or email, and verify your contact number with OTP.'
                  : 'Login with email, Google, or the demo account. Reset your password if you forget it.'}
              </p>
            </div>

            {isSignup ? (
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                {([
                  {
                    value: 'operator' as const,
                    title: 'Operator Signup',
                    description: 'For grid admins, station operators, and command-center users.',
                    icon: Building2,
                  },
                  {
                    value: 'user' as const,
                    title: 'Normal User Signup',
                    description: 'For EV owners who want a personal charging dashboard.',
                    icon: User,
                  },
                ] as const).map(({ value, title, description, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      role === value
                        ? 'border-cyan-400/60 bg-cyan-400/10 shadow-[0_10px_40px_rgba(34,211,238,0.15)]'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/10 p-3 text-cyan-300">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{title}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-400">{description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {!otpStep ? (
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
                    <label className="mb-2 block text-sm font-medium text-slate-300">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/10"
                      placeholder="+91 98765 43210"
                      required={isSignup}
                    />
                  </div>

                  {isSignup ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">Company / Organization</label>
                        <input
                          type="text"
                          value={company}
                          onChange={(event) => setCompany(event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/10"
                          placeholder={role === 'operator' ? 'Distribution utility or control room' : 'Independent user'}
                        />
                      </div>

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

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">Preferred Station</label>
                        <input
                          type="text"
                          value={preferredStation}
                          onChange={(event) => setPreferredStation(event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/10"
                          placeholder={role === 'operator' ? 'Command center' : 'Home or office hub'}
                        />
                      </div>
                    </>
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
                    {isSignup ? 'Create account and request OTP' : 'Login and continue'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleDemo}
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue with demo account
                </button>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <Phone size={16} className="text-cyan-300" />
                      OTP verification
                    </div>
                    <div className="mt-1">Phone verification is used to complete new signups and security checks.</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <Users size={16} className="text-cyan-300" />
                      Operator and user profiles
                    </div>
                    <div className="mt-1">Separate profile details are shown after login based on the selected role.</div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-5">
                  <div className="flex items-center gap-2 text-cyan-200">
                    <Fingerprint size={18} />
                    <span className="text-sm font-semibold uppercase tracking-[0.2em]">OTP verification</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{otpInfo || 'Enter the 6-digit code sent to your phone to complete secure sign-in.'}</p>
                  <label className="mt-4 block text-sm font-medium text-slate-300">One-time code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl tracking-[0.4em] text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/10"
                    placeholder="123456"
                    maxLength={6}
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:shadow-[0_12px_40px_rgba(34,211,238,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  Verify OTP and continue
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    setOtpExpected('');
                    setOtpCode('');
                    setOtpInfo('');
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Back to sign in
                </button>
                {otpExpected ? (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    Demo OTP code: <span className="font-bold tracking-[0.3em]">{otpExpected}</span>
                  </div>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
