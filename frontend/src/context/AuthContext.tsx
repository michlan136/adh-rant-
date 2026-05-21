'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'member' | 'admin';

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  adherent_id?: number;
  reference?: string;
  statut?: string;
  photo_url?: string;
  type_adherent?: string;
  telephone?: string; // 👈 Ajouté pour la page Carte
  adresse?: string;
  date_adhesion?: string;
  numero_patente?: string; // 👈 L'erreur actuelle
  rc?: string;             // 👈 L'erreur qu'on évite (Registre de Commerce)
  ice?: string;// 👈 Ajouté pour la page Carte
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
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
      // 1. On appelle l'API via le proxy Next.js (évite les erreurs CORS)
      const response = await fetch('/api/login', {
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

      // 3.5 Correction : Si le backend renvoie 'adherent', on le mappe sur 'member' pour le frontend
      let finalRole = data.user.role;
      if (finalRole === 'adherent') {
        finalRole = 'member';
      }

      // Fetch real adherent data from backend using the secure /api/adherents/me endpoint
      let adherentData = null;
      try {
        const meRes = await fetch('/api/adherents/me', {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        if (meRes.ok) {
          adherentData = await meRes.json();
        }
      } catch (e) {
        console.warn("Could not fetch adherent data", e);
      }

      const userData: AuthUser = {
        email: data.user.email,
        role: finalRole as UserRole,
        name: adherentData?.nom || generatedName,
        initials: generatedInitials,
        adherent_id: adherentData?.id,
        reference: adherentData?.reference,
        statut: adherentData?.statut,
        photo_url: adherentData?.photo_url,
        type_adherent: adherentData?.type_adherent,
        telephone: adherentData?.telephone, // Optionnel: pour le récupérer du backend s'il existe
        adresse: adherentData?.adresse,     // Optionnel: pour le récupérer du backend s'il existe
      };

      // 4. Mettre à jour l'état React
      setUser(userData);

      // 5. Sauvegarder dans le navigateur
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token); // On stocke le jeton de sécurité !

      // AJOUT : Sauvegarder dans les cookies pour le Middleware (Redirection instantanée)
      document.cookie = `ga_auth_token=${data.token}; path=/; max-age=7200; SameSite=Lax`;
      document.cookie = `ga_auth_role=${finalRole}; path=/; max-age=7200; SameSite=Lax`;

      return { ok: true };

    } catch (error) {
      console.error("Erreur de communication avec le backend :", error);
      return { ok: false, error: "Le serveur est injoignable. Vérifiez que l'API est lancée." };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN); // On supprime aussi le token
    
    // Suppression des cookies pour le Middleware
    document.cookie = 'ga_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'ga_auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return null;
      const newUser = { ...prev, ...data };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
