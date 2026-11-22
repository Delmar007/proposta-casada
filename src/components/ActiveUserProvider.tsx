'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { NegotiationNotification } from '@/lib/domain/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export type SocialAuthProvider = 'google' | 'facebook';

export interface DemoUserOption {
  id: string;
  label: string;
  roleLabel: string;
  isAdmin: boolean;
}

export const DEMO_USERS: DemoUserOption[] = [
  { id: 'buyer-1', label: 'Comprador A (João)', roleLabel: 'Comprador', isAdmin: false },
  { id: 'buyer-2', label: 'Comprador B (Mariana)', roleLabel: 'Comprador', isAdmin: false },
  { id: 'seller-1', label: 'Vendedor (Carlos)', roleLabel: 'Proprietário', isAdmin: false },
  { id: 'admin-1', label: 'Ana Paula (Moderadora)', roleLabel: 'Moderação', isAdmin: true },
  { id: 'admin-2', label: 'Roberto (Supervisor)', roleLabel: 'Análise Superior', isAdmin: true },
];

interface ActiveUserContextValue {
  userId: string;
  setUserId: (id: string) => void;
  currentUser: DemoUserOption;
  notifications: NegotiationNotification[];
  refreshNotifications: () => Promise<void>;
  isAuthenticated: boolean;
  authProvider: SocialAuthProvider | null;
  showAuthModal: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (userId?: string) => void;
  loginWithProvider: (provider: SocialAuthProvider) => Promise<void>;
  logout: () => void;
  favorites: string[];
  toggleFavorite: (vehicleId: string) => void;
  isFavorite: (vehicleId: string) => boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const ActiveUserContext = createContext<ActiveUserContextValue | null>(null);

export function ActiveUserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<string>('buyer-1');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authProvider, setAuthProvider] = useState<SocialAuthProvider | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>(['veh-1']);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notifications, setNotifications] = useState<NegotiationNotification[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem('mp_active_user_id');
    if (saved && DEMO_USERS.some((u) => u.id === saved)) {
      setUserIdState(saved);
    }
    const savedAuth = window.localStorage.getItem('mp_is_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    const savedProvider = window.localStorage.getItem('mp_auth_provider');
    if (savedProvider === 'google' || savedProvider === 'facebook') {
      setAuthProvider(savedProvider);
    }
    const savedFavs = window.localStorage.getItem('mp_favorites');
    if (savedFavs) {
      try {
        const parsed = JSON.parse(savedFavs);
        if (Array.isArray(parsed)) setFavorites(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  const setUserId = (id: string) => {
    setUserIdState(id);
    window.localStorage.setItem('mp_active_user_id', id);
  };

  const openAuthModal = () => setShowAuthModal(true);
  const closeAuthModal = () => setShowAuthModal(false);

  const login = (targetUserId?: string) => {
    if (targetUserId) {
      setUserId(targetUserId);
    }
    setIsAuthenticated(true);
    window.localStorage.setItem('mp_is_authenticated', 'true');
  };

  const loginWithProvider = async (provider: SocialAuthProvider) => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin,
          },
        });
        return;
      }
    }
    setAuthProvider(provider);
    window.localStorage.setItem('mp_auth_provider', provider);
    login(userId);
    setShowAuthModal(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuthProvider(null);
    window.localStorage.setItem('mp_is_authenticated', 'false');
    window.localStorage.removeItem('mp_auth_provider');
  };

  const toggleFavorite = (vehicleId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId];
      window.localStorage.setItem('mp_favorites', JSON.stringify(next));
      return next;
    });
  };

  const isFavorite = (vehicleId: string) => favorites.includes(vehicleId);

  const refreshNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshNotifications();
    const timer = setInterval(refreshNotifications, 5000);
    return () => clearInterval(timer);
  }, [userId]);

  const currentUser = DEMO_USERS.find((u) => u.id === userId) ?? DEMO_USERS[0];

  return (
    <ActiveUserContext.Provider
      value={{
        userId,
        setUserId,
        currentUser,
        notifications,
        refreshNotifications,
        isAuthenticated,
        authProvider,
        showAuthModal,
        openAuthModal,
        closeAuthModal,
        login,
        loginWithProvider,
        logout,
        favorites,
        toggleFavorite,
        isFavorite,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </ActiveUserContext.Provider>
  );
}

export function useActiveUser() {
  const ctx = useContext(ActiveUserContext);
  if (!ctx) {
    throw new Error('useActiveUser must be used within ActiveUserProvider');
  }
  return ctx;
}
