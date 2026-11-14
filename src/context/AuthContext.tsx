import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

export interface DbUserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'premium';
  billingCycle: 'monthly' | 'annual';
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled';
  trialEndsAt: string | null;
  lgpdConsent: boolean;
  mfaEnabled: boolean;
}

export interface PlanDefinition {
  id: number;
  slug: 'free' | 'pro' | 'premium';
  name: string;
  audience: string;
  monthlyPriceBrl: number;
  annualPriceBrl: number;
  aiDailyLimit: number;
  watchlistLimit: number;
  portfolioLimit: number;
  features: string[];
  active: boolean;
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  dbUser: DbUserProfile | null;
  currentPlan: PlanDefinition | null;
  loading: boolean;
  authError: string | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUserProfile | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('invest_intel_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('invest_intel_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(url, { ...options, headers });
    },
    []
  );

  const syncProfile = useCallback(async (user: FirebaseUser | null) => {
    if (!user) {
      setDbUser(null);
      setCurrentPlan(null);
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
        setCurrentPlan(data.currentPlan);
        setAuthError(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setAuthError(errData.error || 'Erro ao sincronizar conta.');
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      await syncProfile(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [syncProfile]);

  const loginWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      await syncProfile(result.user);
    } catch (err: any) {
      setAuthError(err?.message || 'Não foi possível concluir o login com Google.');
    }
  }, [syncProfile]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setDbUser(null);
    setCurrentPlan(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await syncProfile(auth.currentUser);
  }, [syncProfile]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbUser,
        currentPlan,
        loading,
        authError,
        theme,
        toggleTheme,
        loginWithGoogle,
        logout,
        refreshProfile,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
