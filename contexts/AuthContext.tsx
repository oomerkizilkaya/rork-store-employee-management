import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
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

export const [AuthProvider, useAuth] = createContextHook((): AuthContextValue => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = await getSecureItem(AUTH_TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const userData = await trpcClient.auth.me.query();
        setUser(userData as User);
      } catch (error) {
        await deleteSecureItem(AUTH_TOKEN_KEY);
        await deleteSecureItem(USER_DATA_KEY);
      }
    } catch (error) {
      console.error('❌ Kullanıcı yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('🚀 Starting login for:', email);
      const response = await trpcClient.auth.login.mutate({
        email: email.trim(),
        password: password.trim(),
      });

      console.log('✅ Login response received');
      await setSecureItem(AUTH_TOKEN_KEY, response.token);
      await setSecureObject(USER_DATA_KEY, response.user);
      
      setUser(response.user as User);
      console.log('✅ User logged in successfully');
    } catch (error) {
      console.error('❌ Login hatası:', error);
      if (error && typeof error === 'object') {
        console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      }
      throw error;
    }
  }, []);

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
      setUser(null);
    } catch (error) {
      console.error('❌ Çıkış hatası:', error);
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      if (!user) return;
      
      const updatedUser = { ...user, ...userData };
      await setSecureObject(USER_DATA_KEY, updatedUser);
      setUser(updatedUser);
    } catch (error) {
      console.error('❌ Kullanıcı güncelleme hatası:', error);
      throw error;
    }
  }, [user]);

  return useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  }), [user, loading, login, register, logout, updateUser]);
});
