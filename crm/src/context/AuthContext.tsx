import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  permissions?: Record<string, string>;
  is_protected_owner?: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isOwner: boolean;
  login: (password: string, email?: string) => Promise<void>;
  setSessionUser: (token: string, user: User) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string, requiredScope?: 'all' | 'assigned' | 'own') => boolean;
  can: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('crm_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setTokenState] = useState<string | null>(() => {
    return api.getToken() || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Hydrate user & permissions on mount or when token is present
  const refreshUser = useCallback(async () => {
    if (!api.getToken()) return;
    try {
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
        localStorage.setItem('crm_user', JSON.stringify(res.user));
      }
    } catch {
      // Ignore background hydration failures (e.g. offline)
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token, refreshUser]);

  const setSessionUser = (newToken: string, newUser: User) => {
    setTokenState(newToken);
    api.setToken(newToken);
    setUser(newUser);
    localStorage.setItem('crm_user', JSON.stringify(newUser));
  };

  const login = async (password: string, email?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(password, email);
      if (!res.token) throw new Error('No token received');
      setTokenState(res.token);
      api.setToken(res.token);

      const activeUser: User = res.user || {
        id: 1,
        email: email || 'owner@riseuproofing.com',
        name: 'Sam Martinez',
        role: 'owner',
        is_protected_owner: true,
        permissions: { '*': 'all' },
      };
      setUser(activeUser);
      localStorage.setItem('crm_user', JSON.stringify(activeUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // offline
    } finally {
      setUser(null);
      setTokenState(null);
      localStorage.removeItem('crm_user');
      api.setToken(null);
    }
  };

  const isOwner = Boolean(
    user?.role === 'owner' ||
    user?.is_protected_owner ||
    user?.permissions?.['*'] === 'all'
  );

  const hasPermission = useCallback(
    (permission: string, requiredScope?: 'all' | 'assigned' | 'own'): boolean => {
      if (!user) return false;
      if (isOwner) return true;

      const perms = user.permissions || {};
      if (perms['*'] === 'all') return true;

      // Normalization check (e.g. leads:view vs leads.view)
      const normKey = permission.replace(/:/g, '.');
      const userScope = perms[normKey] || perms[permission];

      if (!userScope) return false;
      if (!requiredScope) return true;

      if (requiredScope === 'all') {
        return userScope === 'all';
      }
      if (requiredScope === 'assigned') {
        return userScope === 'all' || userScope === 'assigned';
      }
      if (requiredScope === 'own') {
        return userScope === 'all' || userScope === 'assigned' || userScope === 'own';
      }

      return true;
    },
    [user, isOwner]
  );

  const can = useCallback(
    (permission: string): boolean => {
      return hasPermission(permission);
    },
    [hasPermission]
  );

  const hasRole = useCallback(
    (roleName: string): boolean => {
      if (!user) return false;
      const cleanUserRole = user.role.toLowerCase().replace(/ /g, '_');
      const cleanTargetRole = roleName.toLowerCase().replace(/ /g, '_');
      return cleanUserRole === cleanTargetRole;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isOwner,
        login,
        setSessionUser,
        refreshUser,
        logout,
        hasPermission,
        can,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
