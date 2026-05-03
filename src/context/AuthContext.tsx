import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as updateFirebaseProfile,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

export type UserRole = 'operator' | 'user';

export interface UserProfile {
  fullName: string;
  phone: string;
  role: UserRole;
  company: string;
  city: string;
  designation: string;
  preferredStation: string;
  otpVerified: boolean;
  authMethod: 'google' | 'password' | 'demo';
}

const PROFILE_STORAGE_KEY = 'gridsense_demo_profile';

function getStoredProfile(): UserProfile | null {
  try {
    const rawProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return rawProfile ? (JSON.parse(rawProfile) as UserProfile) : null;
  } catch {
    return null;
  }
}

function persistProfile(profile: UserProfile | null) {
  if (!profile) {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function buildDefaultProfile(email: string | null): UserProfile {
  const fallbackRole: UserRole = email?.toLowerCase().includes('operator') ? 'operator' : 'user';

  return {
    fullName: email ?? 'Signed-in user',
    phone: '',
    role: fallbackRole,
    company: '',
    city: '',
    designation: fallbackRole === 'operator' ? 'Grid Operations Lead' : 'EV User',
    preferredStation: '',
    otpVerified: false,
    authMethod: 'password',
  };
}

interface AuthContextType {
  token: string | null;
  email: string | null;
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  login: (token: string, email: string, profile?: Partial<UserProfile>) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem('gridsense_demo_token');
    const storedEmail = window.localStorage.getItem('gridsense_demo_email');
    const storedProfile = getStoredProfile();
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setEmail(storedEmail);
      setProfile(storedProfile ?? buildDefaultProfile(storedEmail));
    }

    if (!auth) {
      setIsLoading(false);
      return;
    }

    getRedirectResult(auth).catch(() => {
      // Redirect result is optional; the auth listener below will finalize state.
    });

    // Listen to Firebase auth state — this fires on page load & on sign-in/out
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setFirebaseUser(user);
        setToken(idToken);
        setEmail(user.email);
        setProfile((currentProfile) => {
          const nextProfile = currentProfile ?? storedProfile ?? buildDefaultProfile(user.email);
          persistProfile(nextProfile);
          return nextProfile;
        });
      } else {
        setFirebaseUser(null);
        setToken(null);
        setEmail(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return unsubscribe; // cleanup listener on unmount
  }, []);

  // Kept for backwards-compat with Login.tsx call signature
  const login = (newToken: string, newEmail: string, profileUpdates?: Partial<UserProfile>) => {
    const storedProfile = getStoredProfile();
    const mergedProfile = {
      ...buildDefaultProfile(newEmail),
      ...(profile ?? storedProfile ?? buildDefaultProfile(newEmail)),
      ...profileUpdates,
    } satisfies UserProfile;

    window.localStorage.setItem('gridsense_demo_token', newToken);
    window.localStorage.setItem('gridsense_demo_email', newEmail);
    persistProfile(mergedProfile);
    setToken(newToken);
    setEmail(newEmail);
    setProfile(mergedProfile);
  };

  const updateProfile = (profileUpdates: Partial<UserProfile>) => {
    const storedProfile = getStoredProfile();

    setProfile((currentProfile) => {
      const mergedProfile = {
        ...buildDefaultProfile(email),
        ...(currentProfile ?? storedProfile ?? buildDefaultProfile(email)),
        ...profileUpdates,
      } satisfies UserProfile;

      persistProfile(mergedProfile);
      return mergedProfile;
    });
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setToken(null);
    setEmail(null);
    setFirebaseUser(null);
    setProfile(null);
    window.localStorage.removeItem('gridsense_demo_token');
    window.localStorage.removeItem('gridsense_demo_email');
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ token, email, firebaseUser, profile, login, updateProfile, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ─── Exported Firebase auth helpers (used directly in Login.tsx) ──────────────

export const firebaseRegister = async (email: string, password: string, displayName?: string) => {
  if (!auth) throw new Error('Firebase not configured');
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateFirebaseProfile(credential.user, { displayName });
  }

  return credential;
};

export const firebaseLogin = (email: string, password: string) => {
  if (!auth) throw new Error('Firebase not configured');
  return signInWithEmailAndPassword(auth, email, password);
};

export const firebaseGoogleLogin = () => {
  if (!auth) throw new Error('Firebase not configured');
  return signInWithRedirect(auth, googleProvider);
};

export const firebaseResetPassword = (email: string) => {
  if (!auth) throw new Error('Firebase not configured');
  return sendPasswordResetEmail(auth, email);
};

export const firebaseSendVerificationEmail = (user: FirebaseUser) => {
  if (!auth) throw new Error('Firebase not configured');
  return sendEmailVerification(user);
};
