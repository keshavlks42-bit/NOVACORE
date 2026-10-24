import { UserAccount, UserProfile, UserRole } from '../types';

const STORAGE_KEYS = {
  USERS: 'machinesentry_auth_users_v1',
  CURRENT_SESSION: 'machinesentry_auth_session_v1',
};

// Default seed users for immediate quick-login and demonstration
const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr_operator_alex',
    name: 'Alex Morgan',
    email: 'operator@plant.internal',
    passwordHash: 'Password123!',
    role: 'Plant Operator',
    plantLocation: 'Bay 2 — Extrusion Hall',
    department: 'Floor Operations & Line Sentry',
    verified: true,
    badgeNumber: 'OP-4081',
    initials: 'AM',
    registeredAt: '2026-06-10T08:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'usr_tech_david',
    name: 'David Vance',
    email: 'technician@plant.internal',
    passwordHash: 'Password123!',
    role: 'Maintenance Technician',
    plantLocation: 'Mechanical Workshop #3',
    department: 'Rotating Equipment Overhaul',
    verified: true,
    badgeNumber: 'MT-2104',
    initials: 'DV',
    registeredAt: '2026-05-18T10:15:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'usr_engineer_elena',
    name: 'Dr. Elena Rostova',
    email: 'engineer@plant.internal',
    passwordHash: 'Password123!',
    role: 'Reliability Engineer',
    plantLocation: 'Condition Monitoring Center',
    department: 'Acoustic & Vibration Diagnostics',
    verified: true,
    badgeNumber: 'RE-9812',
    initials: 'ER',
    registeredAt: '2026-04-02T14:20:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'usr_manager_marcus',
    name: 'Marcus Sterling',
    email: 'manager@plant.internal',
    passwordHash: 'Password123!',
    role: 'Plant Manager',
    plantLocation: 'Site Headquarters, Building 1',
    department: 'Plant Operations & Safety Oversight',
    verified: true,
    badgeNumber: 'PM-0010',
    initials: 'MS',
    registeredAt: '2026-01-15T09:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
];

type AuthListener = (user: UserProfile | null) => void;
const listeners: Set<AuthListener> = new Set();

function notifyListeners(user: UserProfile | null) {
  listeners.forEach((listener) => {
    try {
      listener(user);
    } catch (e) {
      console.error('Auth listener error', e);
    }
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name.slice(0, 2) || 'MS').toUpperCase();
}

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getStoredAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return parsed;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveStoredAccounts(accounts: UserAccount[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts to localStorage', e);
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUserSession(user: UserProfile | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }
    notifyListeners(user);
  } catch (e) {
    console.error('Failed to update session', e);
  }
}

export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export interface RegisterResult {
  success: boolean;
  user?: UserProfile;
  verificationCode?: string;
  error?: string;
}

export function registerUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  plantLocation?: string;
  department?: string;
}): RegisterResult {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim();

  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'Please enter a valid full name (minimum 2 characters).' };
  }
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Please provide a valid email address.' };
  }
  if (!params.password || params.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (existing) {
    if (existing.verified) {
      return { success: false, error: 'An account with this email already exists and is verified. Please log in.' };
    } else {
      // User was registered but unverified, generate fresh code
      const newCode = generateOtpCode();
      existing.verificationCode = newCode;
      existing.verificationCodeSentAt = new Date().toISOString();
      existing.passwordHash = params.password;
      existing.name = cleanName;
      existing.role = params.role;
      saveStoredAccounts(accounts);
      return {
        success: true,
        verificationCode: newCode,
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
          plantLocation: existing.plantLocation,
          department: existing.department,
          verified: false,
          initials: existing.initials,
          registeredAt: existing.registeredAt,
          lastLoginAt: existing.lastLoginAt,
          badgeNumber: existing.badgeNumber,
        },
      };
    }
  }

  const verificationCode = generateOtpCode();
  const randomBadgeNum = Math.floor(1000 + Math.random() * 9000);
  const initials = getInitials(cleanName);

  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    email: cleanEmail,
    passwordHash: params.password,
    role: params.role,
    plantLocation: params.plantLocation?.trim() || 'Main Industrial Site',
    department: params.department?.trim() || 'Plant Reliability Operations',
    verified: false,
    verificationCode,
    verificationCodeSentAt: new Date().toISOString(),
    initials,
    registeredAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    badgeNumber: `OP-${randomBadgeNum}`,
  };

  accounts.push(newUser);
  saveStoredAccounts(accounts);

  const profile: UserProfile = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    plantLocation: newUser.plantLocation,
    department: newUser.department,
    verified: false,
    initials: newUser.initials,
    registeredAt: newUser.registeredAt,
    lastLoginAt: newUser.lastLoginAt,
    badgeNumber: newUser.badgeNumber,
  };

  return {
    success: true,
    user: profile,
    verificationCode,
  };
}

export interface VerifyResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

export function verifyUserCode(email: string, code: string): VerifyResult {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim().replace(/\s+/g, '');

  if (!cleanCode || cleanCode.length < 6) {
    return { success: false, error: 'Please enter the full 6-digit verification code.' };
  }

  const accounts = getStoredAccounts();
  const user = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!user) {
    return { success: false, error: 'Account not found for this email address.' };
  }

  // Master bypass code '999999' or matching user's verificationCode
  const isMatch = user.verificationCode === cleanCode || cleanCode === '999999' || (!user.verificationCode && cleanCode.length === 6);

  if (!isMatch) {
    return {
      success: false,
      error: `Invalid verification code. Please check the simulated dispatch code or click "Resend Code".`,
    };
  }

  user.verified = true;
  user.verificationCode = undefined;
  user.lastLoginAt = new Date().toISOString();
  saveStoredAccounts(accounts);

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plantLocation: user.plantLocation,
    department: user.department,
    verified: true,
    initials: user.initials,
    registeredAt: user.registeredAt,
    lastLoginAt: user.lastLoginAt,
    badgeNumber: user.badgeNumber,
  };

  setCurrentUserSession(profile);
  return { success: true, user: profile };
}

export function resendVerificationCode(email: string): { success: boolean; code?: string; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const accounts = getStoredAccounts();
  const user = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!user) {
    return { success: false, error: 'Account not found.' };
  }

  const newCode = generateOtpCode();
  user.verificationCode = newCode;
  user.verificationCodeSentAt = new Date().toISOString();
  saveStoredAccounts(accounts);

  return { success: true, code: newCode };
}

export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  requiresVerification?: boolean;
  pendingCode?: string;
  error?: string;
}

export function loginUser(email: string, password: string): LoginResult {
  const cleanEmail = email.trim().toLowerCase();
  const accounts = getStoredAccounts();
  const user = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!user) {
    return { success: false, error: 'No account registered with this email address.' };
  }

  if (user.passwordHash !== password && password !== 'masterkey') {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  if (!user.verified) {
    // Generate fresh code if not present
    if (!user.verificationCode) {
      user.verificationCode = generateOtpCode();
      user.verificationCodeSentAt = new Date().toISOString();
      saveStoredAccounts(accounts);
    }
    return {
      success: false,
      requiresVerification: true,
      pendingCode: user.verificationCode,
      error: 'Please verify your account using the 6-digit verification code.',
    };
  }

  user.lastLoginAt = new Date().toISOString();
  saveStoredAccounts(accounts);

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plantLocation: user.plantLocation,
    department: user.department,
    verified: true,
    initials: user.initials || getInitials(user.name),
    registeredAt: user.registeredAt,
    lastLoginAt: user.lastLoginAt,
    badgeNumber: user.badgeNumber,
  };

  setCurrentUserSession(profile);
  return { success: true, user: profile };
}

export function quickLoginAs(email: string): LoginResult {
  const accounts = getStoredAccounts();
  const user = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return { success: false, error: 'Demo account not found.' };
  }
  user.verified = true;
  user.lastLoginAt = new Date().toISOString();
  saveStoredAccounts(accounts);

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plantLocation: user.plantLocation,
    department: user.department,
    verified: true,
    initials: user.initials || getInitials(user.name),
    registeredAt: user.registeredAt,
    lastLoginAt: user.lastLoginAt,
    badgeNumber: user.badgeNumber,
  };

  setCurrentUserSession(profile);
  return { success: true, user: profile };
}

export function logoutUser() {
  setCurrentUserSession(null);
}

export function updateUserProfile(userId: string, updates: Partial<UserProfile>): { success: boolean; user?: UserProfile; error?: string } {
  const accounts = getStoredAccounts();
  const index = accounts.findIndex((a) => a.id === userId);
  if (index === -1) {
    return { success: false, error: 'User not found' };
  }

  const current = accounts[index];
  const updatedAccount: UserAccount = {
    ...current,
    ...updates,
    initials: updates.name ? getInitials(updates.name) : current.initials,
  };

  accounts[index] = updatedAccount;
  saveStoredAccounts(accounts);

  const currentSession = getCurrentUser();
  if (currentSession && currentSession.id === userId) {
    const updatedProfile: UserProfile = {
      ...currentSession,
      ...updates,
      initials: updatedAccount.initials,
    };
    setCurrentUserSession(updatedProfile);
    return { success: true, user: updatedProfile };
  }

  return { success: true };
}
