'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'member' | 'admin';

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
  initials: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Demo credentials ──────────────────────────────────────────────────────────
const DEMO_ACCOUNTS: Record<string, AuthUser & { password: string }> = {
  'jean.dupont@email.com': {
    email: 'jean.dupont@email.com',
    password: 'adhérent123',
    role: 'member',
    name: 'Jean Dupont',
    initials: 'JD',
  },
  'admin@asso.fr': {
    email: 'admin@asso.fr',
    password: 'admin2026',
    role: 'admin',
    name: 'Admin Système',
    initials: 'AS',
  },
};

const STORAGE_KEY = 'ga_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: AuthUser = JSON.parse(raw);
        setUser(parsed);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const account = DEMO_ACCOUNTS[email.trim().toLowerCase()];
    if (!account || account.password !== password) {
      return { ok: false, error: 'Email ou mot de passe incorrect.' };
    }
    const { password: _p, ...userData } = account;
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
