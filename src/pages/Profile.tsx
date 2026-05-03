import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  Building2,
  CarFront,
  Clock,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';

export default function Profile() {
  const { token, email, profile } = useAuth();

  if (!token) {
    return <Navigate to="/login" />;
  }

  const role = profile?.role ?? 'user';
  const commonStats = {
    totalSessions: 47,
    totalEnergy: 1250,
    avgSessionDuration: 35,
    preferredZone: 'Indiranagar',
    memberSince: 'January 2024',
    co2Saved: 312,
  };

  const operatorDetails = [
    ['Organization', profile?.company || 'GridSense Operations'],
    ['Designation', profile?.designation || 'Grid Operations Lead'],
    ['Coverage', '198 wards and feeder clusters'],
    ['Escalation', '24/7 command center monitoring'],
  ] as const;

  const userDetails = [
    ['Vehicle', 'Tata Nexon EV'],
    ['Preferred Station', profile?.preferredStation || 'Indiranagar Hub'],
    ['Commute', 'Koramangala to Whitefield'],
    ['Charging Style', 'Evening off-peak charging'],
  ] as const;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#143a5b_0%,#08121d_40%,#05070b_100%)] px-4 py-6 text-slate-200 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/80">Account Overview</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
              {role === 'operator' ? 'Operator Profile' : 'User Profile'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Review identity, contact details, security status, and role-specific settings after login.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
            <BadgeCheck size={16} className="text-emerald-300" />
            {role === 'operator' ? 'Operator access enabled' : 'User access enabled'}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-emerald-400">
                    <User size={34} className="text-slate-950" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">{profile?.fullName || 'GridSense Member'}</h2>
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                        {role}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{email}</p>
                    <p className="mt-2 text-sm text-slate-500">Member since {commonStats.memberSince}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <div className="font-semibold text-white">Security status</div>
                  <div className="mt-1 flex items-center gap-2 text-emerald-300">
                    <ShieldCheck size={15} />
                    {profile?.otpVerified ? 'OTP verified' : 'OTP pending'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-slate-950/65 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Mail size={18} className="text-cyan-300" />
                  <h2 className="text-xl font-semibold text-white">Contact Details</h2>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                    <span className="text-slate-400">Full Name</span>
                    <span className="text-white">{profile?.fullName || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                    <span className="text-slate-400">Email</span>
                    <span className="text-white">{email}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                    <span className="text-slate-400">Phone</span>
                    <span className="text-white">{profile?.phone || 'Add a phone number for OTP recovery'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">City</span>
                    <span className="text-white">{profile?.city || 'Bengaluru'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-slate-950/65 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-300" />
                  <h2 className="text-xl font-semibold text-white">Account Security</h2>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                    <span className="text-slate-400">Authentication</span>
                    <span className="text-white capitalize">{profile?.authMethod || 'password'}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                    <span className="text-slate-400">Role</span>
                    <span className="text-white capitalize">{role}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                    <span className="text-slate-400">OTP Verification</span>
                    <span className="text-white">{profile?.otpVerified ? 'Completed' : 'Required'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Preferred Station</span>
                    <span className="text-white">{profile?.preferredStation || 'Central Hub'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-slate-950/65 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Zap size={18} className="text-cyan-300" />
                  <h2 className="text-xl font-semibold text-white">Impact Stats</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
                    <p className="text-2xl font-bold text-cyan-300">{commonStats.totalSessions}</p>
                    <p className="mt-1 text-xs text-slate-500">Sessions</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-300">{commonStats.totalEnergy}</p>
                    <p className="mt-1 text-xs text-slate-500">kWh Used</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
                    <p className="text-2xl font-bold text-amber-300">{commonStats.co2Saved}</p>
                    <p className="mt-1 text-xs text-slate-500">kg CO₂ Saved</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
                    <p className="text-2xl font-bold text-purple-300">{commonStats.avgSessionDuration}</p>
                    <p className="mt-1 text-xs text-slate-500">Min Avg</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-slate-950/65 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <MapPin size={18} className="text-cyan-300" />
                  <h2 className="text-xl font-semibold text-white">Preferences</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Preferred Zone</span>
                    <span className="text-white font-medium">{commonStats.preferredZone}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Default Map View</span>
                    <span className="text-white font-medium">{profile?.city || 'Bengaluru'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/65 p-6">
              <div className="flex items-center gap-2">
                {role === 'operator' ? <Building2 size={18} className="text-cyan-300" /> : <CarFront size={18} className="text-cyan-300" />}
                <h2 className="text-xl font-semibold text-white">
                  {role === 'operator' ? 'Operator Profile' : 'User Profile'} Details
                </h2>
              </div>

              <div className="mt-5 grid gap-4">
                {(role === 'operator' ? operatorDetails : userDetails).map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
                    <div className="mt-2 text-white">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 p-4 text-sm text-slate-300">
                <Clock size={16} className="mr-2 inline-block text-cyan-300" />
                {role === 'operator'
                  ? 'Operator workflows include live monitoring, escalation routing, and station planning shortcuts.'
                  : 'User workflows include station discovery, off-peak recommendations, and charging history.'}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-slate-950/65 p-6">
              <div className="mb-5 flex items-center gap-2">
                <Sparkles size={18} className="text-cyan-300" />
                <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  className="block w-full rounded-xl bg-cyan-500/20 py-3 text-center text-cyan-300 transition-colors hover:bg-cyan-500/30"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/settings"
                  className="block w-full rounded-xl bg-white/5 py-3 text-center text-slate-300 transition-colors hover:bg-white/10"
                >
                  Settings
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-slate-950/65 p-6">
              <div className="mb-5 flex items-center gap-2">
                <Activity size={18} className="text-cyan-300" />
                <h2 className="text-xl font-semibold text-white">Session Summary</h2>
              </div>
              <p className="text-sm leading-6 text-slate-400">
                {profile?.otpVerified
                  ? 'Your account has passed OTP verification and is ready for secure access.'
                  : 'Finish OTP verification to unlock the complete secure account experience.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}