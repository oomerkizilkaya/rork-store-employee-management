import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User } from '@/types';
import { setSecureItem, getSecureItem, deleteSecureItem, setSecureObject } from '@/utils/secureStorage';
import { trpcClient } from '@/lib/trpc';

const AUTH_TOKEN_KEY = 'mikel_auth_token';
const USER_DATA_KEY = 'mikel_user_data';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
};

function useAuthProvider(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setUserSafe = useCallback((nextUser: User | null) => {
    if (isMountedRef.current) {
      setUser(nextUser);
    }
  }, []);

  const setLoadingSafe = useCallback((nextLoading: boolean) => {
    if (isMountedRef.current) {
      setLoading(nextLoading);
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const token = await getSecureItem(AUTH_TOKEN_KEY);
      if (!token) {
        setLoadingSafe(false);
        return;
      }

      try {
        const userData = await trpcClient.auth.me.query();
        setUserSafe(userData as User);
      } catch (error) {
        await deleteSecureItem(AUTH_TOKEN_KEY);
        await deleteSecureItem(USER_DATA_KEY);
        setUserSafe(null);
      }
    } catch (error) {
      console.error('❌ Kullanıcı yükleme hatası:', error);
    } finally {
      setLoadingSafe(false);
    }
  }, [setLoadingSafe, setUserSafe]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('🚀 Starting login for:', email);
      console.log('🔑 Login credentials:', {
        email: email.trim().toLowerCase(),
        passwordLength: password.trim().length,
      });
      
      console.log('📡 Calling trpcClient.auth.login.mutate...');
      const response = await trpcClient.auth.login.mutate({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      console.log('✅ Login response received:', {
        hasToken: !!response.token,
        hasUser: !!response.user,
        userId: response.user?.id,
        responseType: typeof response,
        responseKeys: Object.keys(response || {}),
        response: JSON.stringify(response).substring(0, 300),
      });
      
      if (!response || !response.token || !response.user) {
        console.error('❌ Invalid response structure:', response);
        throw new Error('Sunucudan geçersiz yanıt alındı');
      }

      await setSecureItem(AUTH_TOKEN_KEY, response.token);
      await setSecureObject(USER_DATA_KEY, response.user);

      setUserSafe(response.user as User);
      console.log('✅ User logged in successfully:', response.user.email);
    } catch (error) {
      console.error('❌ Login hatası:', error);
      
      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        console.error('❌ Error details:', JSON.stringify({
          stack: errorObj.stack,
          message: errorObj.message,
          cause: errorObj.cause,
          code: errorObj.code,
          data: errorObj.data,
        }, null, 2));
      }
      
      throw error;
    }
  }, [setUserSafe]);

  const register = useCallback(async (userData: Omit<User, 'id'> & { password: string }) => {
    try {
      await trpcClient.auth.register.mutate({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        store: userData.store,
        region: userData.region || 'İstanbul',
        position: userData.position,
        startDate: userData.startDate,
        birthDate: userData.birthDate,
      });
    } catch (error) {
      console.error('❌ Kayıt hatası:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      try {
        await trpcClient.auth.logout.mutate();
      } catch (error) {
        console.log('Backend logout error (ignored):', error);
      }

      await deleteSecureItem(AUTH_TOKEN_KEY);
      await deleteSecureItem(USER_DATA_KEY);
      setUserSafe(null);
    } catch (error) {
      console.error('❌ Çıkış hatası:', error);
    }
  }, [setUserSafe]);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      if (!user) {
        return;
      }

      const updatedUser = { ...user, ...userData };
      await setSecureObject(USER_DATA_KEY, updatedUser);
      setUserSafe(updatedUser);
    } catch (error) {
      console.error('❌ Kullanıcı güncelleme hatası:', error);
      throw error;
    }
  }, [user, setUserSafe]);

  return useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  }), [user, loading, login, register, logout, updateUser]);
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthProvider();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
