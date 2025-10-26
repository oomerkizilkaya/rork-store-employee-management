import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@/types';
import { sendRegistrationNotification, sendRegistrationApprovedNotification } from '@/utils/notifications';
import { getPositionLabel } from '@/utils/positions';
import { hashPassword, verifyPassword, generateToken } from '@/utils/crypto';
import { setSecureItem, getSecureItem, deleteSecureItem, setSecureObject, getSecureObject } from '@/utils/secureStorage';

const AUTH_TOKEN_KEY = '@mikel_auth_token';
const USER_DATA_KEY = '@mikel_user_data';
const ALL_USERS_KEY = '@mikel_all_users';

type StoredUser = User & { passwordHash: string };

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

  const seedDefaultUsers = useCallback(async () => {
    try {
      const allUsersStr = await AsyncStorage.getItem(ALL_USERS_KEY);
      
      if (!allUsersStr) {
        console.log('🌱 İlk kullanım tespit edildi, admin kullanıcısı oluşturuluyor...');
        
        const defaultPassword = 'Admin123';
        const passwordHash = await hashPassword(defaultPassword);
        
        const adminUser: StoredUser = {
          id: '1',
          employeeId: 'MKL0001',
          firstName: 'Admin',
          lastName: 'Admin',
          email: 'admin@tr.mikelcoffee.com',
          passwordHash,
          phone: '05551234567',
          store: 'Merkez',
          position: 'insan_kaynaklari' as const,
          startDate: '2024-01-01',
          region: 'İstanbul',
          isApproved: true,
          approvedBy: ['system'],
        };
        
        await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify([adminUser]));
        console.log('✅ Admin kullanıcısı oluşturuldu');
        console.log('📧 Email: admin@tr.mikelcoffee.com');
        console.log('🔑 Şifre: Admin123');
      } else {
        const allUsers: StoredUser[] = JSON.parse(allUsersStr);
        console.log('📊 Mevcut kullanıcılar:', allUsers.map(u => ({ email: u.email, isApproved: u.isApproved })));
        
        let adminExists = false;
        let adminIndex = -1;
        
        for (let i = 0; i < allUsers.length; i++) {
          if (allUsers[i].email.toLowerCase().trim() === 'admin@tr.mikelcoffee.com') {
            adminExists = true;
            adminIndex = i;
            break;
          }
        }
        
        if (!adminExists) {
          console.log('🔧 Admin kullanıcısı bulunamadı, oluşturuluyor...');
          const defaultPassword = 'Admin123';
          const passwordHash = await hashPassword(defaultPassword);
          
          const adminUser: StoredUser = {
            id: '1',
            employeeId: 'MKL0001',
            firstName: 'Admin',
            lastName: 'Admin',
            email: 'admin@tr.mikelcoffee.com',
            passwordHash,
            phone: '05551234567',
            store: 'Merkez',
            position: 'insan_kaynaklari' as const,
            startDate: '2024-01-01',
            region: 'İstanbul',
            isApproved: true,
            approvedBy: ['system'],
          };
          allUsers.unshift(adminUser);
          await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers));
          console.log('✅ Admin kullanıcısı oluşturuldu');
        } else if (!allUsers[adminIndex].isApproved) {
          console.log('🔧 Admin hesabı onaylanıyor...');
          allUsers[adminIndex].isApproved = true;
          allUsers[adminIndex].approvedBy = ['system'];
          await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers));
          console.log('✅ Admin hesabı onaylandı');
        } else {
          console.log('✅ Admin hesabı zaten mevcut ve onaylı');
        }
      }
    } catch (error) {
      console.error('❌ Kullanıcı oluşturma hatası:', error);
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      console.log('🔄 Kullanıcı yükleniyor...');
      await seedDefaultUsers();
      
      const token = await getSecureItem(AUTH_TOKEN_KEY);
      if (!token) {
        console.log('❌ Token bulunamadı');
        setLoading(false);
        return;
      }
      
      const userData = await getSecureObject<User>(USER_DATA_KEY);
      if (userData) {
        console.log('✅ Kullanıcı yüklendi:', userData.email);
        setUser(userData);
      } else {
        console.log('❌ Kullanıcı verisi bulunamadı');
        await deleteSecureItem(AUTH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('❌ Kullanıcı yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  }, [seedDefaultUsers]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('=== GİRİŞ BAŞLADI ===');
      console.log('📧 Email:', email);
      
      await seedDefaultUsers();
      
      const allUsersStr = await AsyncStorage.getItem(ALL_USERS_KEY);
      
      if (!allUsersStr) {
        console.log('⚠️ HATA: Veritabanında hiç kullanıcı yok!');
        throw new Error('Email veya şifre hatalı');
      }
      
      const allUsers: StoredUser[] = JSON.parse(allUsersStr);
      console.log('📊 Toplam kullanıcı sayısı:', allUsers.length);

      const normalizedEmail = email.toLowerCase().trim();

      const foundUser = allUsers.find(u => {
        const userEmail = u.email.toLowerCase().trim();
        return userEmail === normalizedEmail;
      });

      if (!foundUser) {
        console.log('❌ HATA: Kullanıcı bulunamadı!');
        throw new Error('Email veya şifre hatalı');
      }
      
      console.log('✅ Kullanıcı bulundu:', foundUser.email);
      console.log('🔐 Şifre doğrulanıyor...');
      
      const passwordValid = await verifyPassword(password, foundUser.passwordHash);
      
      if (!passwordValid) {
        console.log('❌ HATA: Şifre yanlış!');
        throw new Error('Email veya şifre hatalı');
      }
      
      console.log('✅ Şifre doğrulandı');
      console.log('🔐 Onay durumu:', foundUser.isApproved);

      if (!foundUser.isApproved) {
        console.log('⛔ HATA: Hesap onaylı değil!');
        throw new Error('Hesabınız henüz onaylanmadı. Lütfen yöneticinizle iletişime geçin.');
      }

      const { passwordHash: _, ...userWithoutPassword } = foundUser;
      
      const token = generateToken();
      await setSecureItem(AUTH_TOKEN_KEY, token);
      await setSecureObject(USER_DATA_KEY, userWithoutPassword);
      
      console.log('💾 Token ve kullanıcı secure storage\'a kaydedildi');
      setUser(userWithoutPassword);
      console.log('✅ GİRİŞ TAMAMLANDI!');
      console.log('=== LOGIN BİTTİ ===\n');
    } catch (error) {
      console.error('❌ Login hatası:', error);
      throw error;
    }
  }, [seedDefaultUsers]);

  const register = useCallback(async (userData: Omit<User, 'id'> & { password: string }) => {
    console.log('🔵 Kayıt işlemi başladı:', userData.email);
    
    const allUsersStr = await AsyncStorage.getItem(ALL_USERS_KEY);
    const allUsers: StoredUser[] = allUsersStr 
      ? JSON.parse(allUsersStr) 
      : [];

    console.log('📊 Toplam kullanıcı sayısı:', allUsers.length);

    const emailExists = allUsers.some(
      u => u.email.toLowerCase() === userData.email.toLowerCase()
    );

    if (emailExists) {
      console.log('❌ Email zaten kayıtlı:', userData.email);
      throw new Error('Bu email adresi zaten kayıtlı');
    }

    const nextEmployeeNumber = allUsers.length + 1;
    const employeeId = `MKL${nextEmployeeNumber.toString().padStart(4, '0')}`;
    
    console.log('🔐 Şifre hash\'leniyor...');
    const passwordHash = await hashPassword(userData.password);

    const newUser: StoredUser = {
      id: Date.now().toString(),
      employeeId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      store: userData.store,
      position: userData.position,
      startDate: userData.startDate,
      birthDate: userData.birthDate,
      region: userData.region || 'İstanbul',
      passwordHash,
      isApproved: false,
      approvedBy: [],
    };

    console.log('✅ Yeni kullanıcı oluşturuldu:', newUser.employeeId, newUser.email);

    allUsers.push(newUser);
    await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers));
    console.log('💾 Kullanıcı veritabanına kaydedildi');

    const pendingApprovalsStr = await AsyncStorage.getItem('@mikel_pending_approvals');
    const pendingApprovals: string[] = pendingApprovalsStr ? JSON.parse(pendingApprovalsStr) : [];
    pendingApprovals.push(newUser.id);
    await AsyncStorage.setItem('@mikel_pending_approvals', JSON.stringify(pendingApprovals));
    console.log('⏳ Pending approvals listesine eklendi');

    console.log('📧 Onay bildirimleri gönderiliyor...');
    await sendRegistrationNotification(
      `${userData.firstName} ${userData.lastName}`,
      getPositionLabel(userData.position),
      userData.store,
      userData.region || 'İstanbul'
    );

    console.log('✅ Kayıt işlemi başarıyla tamamlandı!');
    await sendRegistrationApprovedNotification(
      `${userData.firstName} ${userData.lastName}`,
      'pending'
    );
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Çıkış yapılıyor...');
      await deleteSecureItem(AUTH_TOKEN_KEY);
      await deleteSecureItem(USER_DATA_KEY);
      setUser(null);
      console.log('✅ Çıkış başarılı');
    } catch (error) {
      console.error('❌ Çıkış hatası:', error);
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      if (!user) return;
      
      const updatedUser = { ...user, ...userData };
      await setSecureObject(USER_DATA_KEY, updatedUser);
      
      const allUsersStr = await AsyncStorage.getItem(ALL_USERS_KEY);
      if (allUsersStr) {
        const allUsers: StoredUser[] = JSON.parse(allUsersStr);
        const userIndex = allUsers.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          allUsers[userIndex] = { ...allUsers[userIndex], ...userData };
          await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers));
        }
      }
      
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
