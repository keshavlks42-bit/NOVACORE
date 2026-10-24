import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  UserRole,
} from '../types';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  verifyUserCode,
  resendVerificationCode,
  quickLoginAs,
  logoutUser,
  updateUserProfile,
  getStoredAccounts,
} from '../services/authService';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Cpu,
  BadgeCheck,
  ChevronRight,
  Wrench,
  Radio,
  FileCheck,
} from 'lucide-react';

interface AuthViewProps {
  onSuccessRedirect?: () => void;
  onNavigateTab?: (tab: any) => void;
}

const INDUSTRIAL_ROLES: {
  role: UserRole;
  label: string;
  desc: string;
  badgeClass: string;
}[] = [
  {
    role: 'Plant Operator',
    label: 'Plant Operator',
    desc: 'Floor operations, quick audio/video machine inspection',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    role: 'Maintenance Technician',
    label: 'Maintenance Tech',
    desc: 'Work order resolution, lubrication, component replacements',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    role: 'Reliability Engineer',
    label: 'Reliability Engineer',
    desc: 'Acoustic FFT analysis, ML baseline training, threshold tuning',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  {
    role: 'Plant Manager',
    label: 'Plant Manager',
    desc: 'OEE tracking, fleet health summary, risk and audit compliance',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    role: 'Quality Inspector',
    label: 'Quality Inspector',
    desc: 'Pre-shipment verification and vibration/noise certification',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
];

export const AuthView: React.FC<AuthViewProps> = ({ onSuccessRedirect, onNavigateTab }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Plant Operator');
  const [regLocation, setRegLocation] = useState('Bay 2 — Main Plant Floor');
  const [regDepartment, setRegDepartment] = useState('Rotating Equipment Operations');

  // Verification state
  const [verifyEmail, setVerifyEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeCodeNotification, setActiveCodeNotification] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Plant Operator');

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setEditName(user.name);
      setEditLocation(user.plantLocation);
      setEditRole(user.role);
    }
  }, []);

  // Timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = loginUser(loginEmail, loginPassword);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setSuccessMessage(`Welcome back, ${result.user.name}!`);
        if (onSuccessRedirect) {
          setTimeout(onSuccessRedirect, 800);
        }
      } else if (result.requiresVerification) {
        setVerifyEmail(loginEmail.toLowerCase().trim());
        if (result.pendingCode) {
          setActiveCodeNotification(result.pendingCode);
        }
        setMode('verify');
        setErrorMessage(result.error || 'Please complete account verification.');
      } else {
        setErrorMessage(result.error || 'Failed to sign in. Please verify your email and password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        plantLocation: regLocation,
        department: regDepartment,
      });

      if (result.success && result.verificationCode) {
        setVerifyEmail(regEmail.toLowerCase().trim());
        setActiveCodeNotification(result.verificationCode);
        setMode('verify');
        setSuccessMessage('Registration initiated! Please enter your 6-digit verification code below.');
        setResendCooldown(30);
      } else {
        setErrorMessage(result.error || 'Failed to register account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    // Only accept numbers
    const clean = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (clean.length > 1) {
      // User pasted full code
      const pasted = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        handleVerificationVerify(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = clean.slice(-1);
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleVerificationVerify(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerificationVerify = (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    setErrorMessage(null);
    setSuccessMessage(null);

    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = verifyUserCode(verifyEmail, code);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setSuccessMessage(`Account verified successfully! Welcome, ${result.user.name}.`);
        setActiveCodeNotification(null);
        setTimeout(() => {
          if (onSuccessRedirect) {
            onSuccessRedirect();
          }
        }, 1200);
      } else {
        setErrorMessage(result.error || 'Invalid verification code.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    const result = resendVerificationCode(verifyEmail);
    if (result.success && result.code) {
      setActiveCodeNotification(result.code);
      setSuccessMessage('A fresh verification code has been dispatched.');
      setResendCooldown(30);
    } else {
      setErrorMessage(result.error || 'Failed to resend code.');
    }
  };

  const handleQuickFillCode = () => {
    if (!activeCodeNotification) return;
    const digits = activeCodeNotification.slice(0, 6).split('');
    setOtpDigits(digits);
    handleVerificationVerify(activeCodeNotification);
  };

  const handleQuickLogin = (email: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const result = quickLoginAs(email);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setSuccessMessage(`Signed in as ${result.user.name} (${result.user.role})`);
      if (onSuccessRedirect) {
        setTimeout(onSuccessRedirect, 600);
      }
    } else {
      setErrorMessage(result.error || 'Could not sign in with demo account.');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setSuccessMessage('You have logged out successfully.');
    setMode('login');
  };

  const handleSaveProfileEdits = () => {
    if (!currentUser) return;
    if (!editName.trim()) {
      setErrorMessage('Name cannot be empty.');
      return;
    }
    const result = updateUserProfile(currentUser.id, {
      name: editName.trim(),
      plantLocation: editLocation.trim(),
      role: editRole,
    });
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated successfully.');
    } else {
      setErrorMessage(result.error || 'Failed to update profile.');
    }
  };

  // Logged In Profile Screen
  if (currentUser) {
    const roleConfig = INDUSTRIAL_ROLES.find((r) => r.role === currentUser.role);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-cyan-500/25 shrink-0 border-2 border-cyan-400/30">
                {currentUser.initials || 'MS'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{currentUser.name}</h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleConfig?.badgeClass || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'}`}>
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {currentUser.role}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Operator
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {currentUser.email}
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-cyan-400">ID: {currentUser.badgeNumber || 'OP-4081'}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> {currentUser.plantLocation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Plant Session Active: Machine access granted with full telemetry write rights</span>
            </div>
            {onNavigateTab && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('simple_upload')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-sm flex items-center gap-1"
                >
                  Go to Easy Upload <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onNavigateTab('overview')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all"
                >
                  Fleet Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback message */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        {isEditingProfile && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Update Industrial Identity & Station
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Plant Location / Station</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Industrial Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  {INDUSTRIAL_ROLES.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfileEdits}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Fast Account Switcher for Testing & Demonstration */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Fast Demo Account Switcher
              </h3>
              <p className="text-xs text-slate-400">
                Switch instantly between roles to experience MachineSentry from operator, technician, or engineer perspective.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { email: 'operator@plant.internal', name: 'Alex Morgan', role: 'Plant Operator', icon: User, color: 'text-emerald-400' },
              { email: 'technician@plant.internal', name: 'David Vance', role: 'Maintenance Tech', icon: Wrench, color: 'text-amber-400' },
              { email: 'engineer@plant.internal', name: 'Dr. Elena Rostova', role: 'Reliability Eng.', icon: Cpu, color: 'text-cyan-400' },
              { email: 'manager@plant.internal', name: 'Marcus Sterling', role: 'Plant Manager', icon: Building2, color: 'text-purple-400' },
            ].map((acc) => {
              const isCurrent = currentUser.email.toLowerCase() === acc.email.toLowerCase();
              return (
                <button
                  key={acc.email}
                  onClick={() => !isCurrent && handleQuickLogin(acc.email)}
                  disabled={isCurrent}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-cyan-500/10 border-cyan-500/50 cursor-default ring-1 ring-cyan-500/30'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${acc.color}`}>{acc.role}</span>
                    {isCurrent ? (
                      <span className="text-[10px] bg-cyan-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">Active</span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-white">{acc.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{acc.email}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security & Access Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Access Scope</span>
            </div>
            <div className="text-sm font-bold text-white">Full Plant Fleet Read/Write</div>
            <p className="text-[11px] text-slate-400 mt-1">Authorized for Edge audio anomaly logging, digital twin inspection, and ticket creation.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <FileCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Verification Status</span>
            </div>
            <div className="text-sm font-bold text-emerald-300">Email & 2FA Confirmed</div>
            <p className="text-[11px] text-slate-400 mt-1">Cryptographic token active in local credential store.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Radio className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Assigned Node</span>
            </div>
            <div className="text-sm font-bold text-white">Sentry Node #04 (Extrusion)</div>
            <p className="text-[11px] text-slate-400 mt-1">Direct bridge to ESP32 / MEMS I2S acoustic telemetry sensors.</p>
          </div>
        </div>
      </div>
    );
  }

  // Not Logged In Screens: Login, Register, or Verify OTP
  return (
    <div className="max-w-xl mx-auto py-4 sm:py-8 px-2 sm:px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-mono font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          Plant Sentry Security Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          MachineSentry Access Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          {mode === 'verify'
            ? 'Complete code verification to activate your industrial operator badge.'
            : 'Register a new verified account or sign in with your industrial plant credentials.'}
        </p>
      </div>

      {/* Tabs: Sign In vs Register (Hidden if in Verify mode) */}
      {mode !== 'verify' && (
        <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account & Verify
          </button>
        </div>
      )}

      {/* Error & Success Feedback Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <div className="flex-1">{successMessage}</div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODE 1: VERIFICATION SCREEN (Where user verifies itself) */}
      {/* ---------------------------------------------------- */}
      {mode === 'verify' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Enter 6-Digit Verification Code</h2>
                <p className="text-xs text-slate-400">
                  Verification sent to <span className="text-cyan-300 font-mono">{verifyEmail}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setMode('login')}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Back to Sign In
            </button>
          </div>

          {/* SIMULATED DISPATCH PREVIEW BANNER - Extremely helpful and simple */}
          {activeCodeNotification && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Simulated Plant Dispatch Inbox:</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400/80 uppercase">Simulated OTP</span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">Your security code:</span>
                  <span className="font-mono text-lg font-extrabold tracking-widest text-cyan-300 bg-slate-900/80 px-2.5 py-1 rounded border border-cyan-500/30">
                    {activeCodeNotification}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFillCode}
                  className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Fill Code
                </button>
              </div>
            </div>
          )}

          {/* 6 Digit Input Boxes */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 text-center">
              Type or paste the 6-digit security code:
            </label>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono font-bold text-lg sm:text-xl rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleVerificationVerify()}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Verify & Complete Registration
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Didn't receive the code?</span>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                className="text-cyan-400 hover:text-cyan-300 font-semibold disabled:text-slate-600 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODE 2: SIGN IN FORM */}
      {/* ---------------------------------------------------- */}
      {mode === 'login' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                Work Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. operator@plant.internal"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLoginPassword('Password123!');
                    if (!loginEmail) setLoginEmail('operator@plant.internal');
                  }}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Fill default password
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-cyan-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              Sign In to MachineSentry
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Quick 1-Click Demo Accounts
              </span>
              <span className="text-[10px] text-slate-500">No typing needed</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('operator@plant.internal')}
                className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group"
              >
                <div className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center justify-between">
                  <span>👷 Alex Morgan</span>
                  <span className="text-[10px] text-slate-500">Log In</span>
                </div>
                <div className="text-[11px] text-slate-300">Plant Operator</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('technician@plant.internal')}
                className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group"
              >
                <div className="text-xs font-bold text-amber-400 group-hover:text-amber-300 flex items-center justify-between">
                  <span>🔧 David Vance</span>
                  <span className="text-[10px] text-slate-500">Log In</span>
                </div>
                <div className="text-[11px] text-slate-300">Maintenance Tech</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('engineer@plant.internal')}
                className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group"
              >
                <div className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center justify-between">
                  <span>🔬 Dr. Elena Rostova</span>
                  <span className="text-[10px] text-slate-500">Log In</span>
                </div>
                <div className="text-[11px] text-slate-300">Reliability Engineer</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager@plant.internal')}
                className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group"
              >
                <div className="text-xs font-bold text-purple-400 group-hover:text-purple-300 flex items-center justify-between">
                  <span>🏢 Marcus Sterling</span>
                  <span className="text-[10px] text-slate-500">Log In</span>
                </div>
                <div className="text-[11px] text-slate-300">Plant Manager</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODE 3: CREATE ACCOUNT & VERIFY */}
      {/* ---------------------------------------------------- */}
      {mode === 'register' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">1</span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Account Registration & Role Assignment</span>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Lee"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="jordan.lee@plant.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Password (min 6 characters)
              </label>
              <input
                type="password"
                required
                placeholder="Choose a strong password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                Select Your Industrial Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INDUSTRIAL_ROLES.map((r) => {
                  const isSelected = regRole === r.role;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setRegRole(r.role)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500 text-white ring-1 ring-cyan-500/40'
                          : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>{r.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{r.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  Plant Section / Station
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bay 2 — Extrusion Hall"
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Department / Team
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operations Team A"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              Register & Proceed to Verification
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-cyan-400 hover:underline font-semibold"
            >
              Sign in here
            </button>
          </p>
        </div>
      )}

      {/* Guest Mode option */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => {
            if (onNavigateTab) {
              onNavigateTab('simple_upload');
            }
          }}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
        >
          <span>Continue browsing as guest without signing in</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
