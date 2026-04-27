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
  login: (email: string, password: string) => Promise<{ ok: boolean; role?: string; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY_USER = 'ga_auth_user';
const STORAGE_KEY_TOKEN = 'ga_auth_token'; // Nouveau : pour stocker le JWT de FastAPI

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurer la session depuis le localStorage au rechargement de la page
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(STORAGE_KEY_USER);
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);

      // On vérifie qu'on a bien l'utilisateur ET le token
      if (rawUser && token) {
        const parsed: AuthUser = JSON.parse(rawUser);
        setUser(parsed);
      }
    } catch {
      // Ignorer les erreurs de parsing
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // 1. On appelle l'API Python FastAPI
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      // 2. Si FastAPI renvoie une erreur (mauvais mot de passe, etc.)
      if (!response.ok) {
        return { ok: false, error: data.detail || 'Email ou mot de passe incorrect.' };
      }

      // 3. Astuce : Générer un nom et des initiales factices basés sur l'email 
      // (puisque la base de données ne renvoie que l'email pour le moment)
      const namePart = data.user.email.split('@')[0];
      const generatedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const generatedInitials = generatedName.substring(0, 2).toUpperCase();

      const userData: AuthUser = {
        email: data.user.email,
        role: data.user.role as UserRole,
        name: generatedName,
        initials: generatedInitials,
      };

      // 4. Mettre à jour l'état React
      setUser(userData);

      // 5. Sauvegarder dans le navigateur
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token); // On stocke le jeton de sécurité !

      return { ok: true, role: data.user.role };
    } catch (error) {
      console.error("Erreur de communication avec le backend :", error);
      return { ok: false, error: "Le serveur est injoignable. Vérifiez que l'API est lancée." };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN); // On supprime aussi le token
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