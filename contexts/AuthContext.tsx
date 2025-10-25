import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@/types';
import { sendRegistrationNotification, sendRegistrationApprovedNotification } from '@/utils/notifications';
import { getPositionLabel } from '@/utils/positions';

const STORAGE_KEY = '@mikel_user';

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
      const allUsersStr = await AsyncStorage.getItem('@mikel_all_users');
      
      if (!allUsersStr) {
        console.log('🌱 İlk kullanım tespit edildi, admin kullanıcısı oluşturuluyor...');
        const testUsers = [
          {
            id: '1',
            employeeId: 'MKL0001',
            firstName: 'Admin',
            lastName: 'Admin',
            email: 'admin@tr.mikelcoffee.com',
            password: '123456',
            phone: '05551234567',
            store: 'Merkez',
            position: 'insan_kaynaklari' as const,
            startDate: '2024-01-01',
            region: 'İstanbul',
            isApproved: true,
            approvedBy: ['system'],
          },
        ];
        await AsyncStorage.setItem('@mikel_all_users', JSON.stringify(testUsers));
        console.log('✅ Admin kullanıcısı oluşturuldu:', JSON.stringify(testUsers[0]));
      } else {
        const allUsers: (User & { password: string })[] = JSON.parse(allUsersStr);
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
          const adminUser = {
            id: '1',
            employeeId: 'MKL0001',
            firstName: 'Admin',
            lastName: 'Admin',
            email: 'admin@tr.mikelcoffee.com',
            password: '123456',
            phone: '05551234567',
            store: 'Merkez',
            position: 'insan_kaynaklari' as const,
            startDate: '2024-01-01',
            region: 'İstanbul',
            isApproved: true,
            approvedBy: ['system'],
          };
          allUsers.unshift(adminUser);
          await AsyncStorage.setItem('@mikel_all_users', JSON.stringify(allUsers));
          console.log('✅ Admin kullanıcısı oluşturuldu');
        } else if (!allUsers[adminIndex].isApproved) {
          console.log('🔧 Admin hesabı onaylanıyor...');
          allUsers[adminIndex].isApproved = true;
          allUsers[adminIndex].approvedBy = ['system'];
          await AsyncStorage.setItem('@mikel_all_users', JSON.stringify(allUsers));
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
      console.log('Loading user from storage...');
      await seedDefaultUsers();
      
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        console.log('User loaded:', userData.email);
        setUser(userData);
      } else {
        console.log('No user in storage');
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, [seedDefaultUsers]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('=== LOGIN BAŞLADI ===');
      console.log('📧 Giriş denemesi - Email:', email);
      console.log('🔑 Şifre uzunluğu:', password.length);
      
      await seedDefaultUsers();
      
      const allUsersStr = await AsyncStorage.getItem('@mikel_all_users');
      
      if (!allUsersStr) {
        console.log('⚠️ HATA: Veritabanında hiç kullanıcı yok!');
        throw new Error('Email veya şifre hatalı');
      }
      
      const allUsers: (User & { password: string })[] = JSON.parse(allUsersStr);
      console.log('📊 Toplam kullanıcı sayısı:', allUsers.length);
      console.log('📋 Kayıtlı kullanıcılar:');
      allUsers.forEach(u => {
        console.log(`  - Email: ${u.email} | Şifre: ${u.password} | Onaylı: ${u.isApproved}`);
      });

      const normalizedEmail = email.toLowerCase().trim();
      const normalizedPassword = password.trim();

      console.log('🔍 Aranıyor:');
      console.log('  Normalized Email:', normalizedEmail);
      console.log('  Normalized Password:', normalizedPassword);

      const foundUser = allUsers.find(u => {
        const userEmail = u.email.toLowerCase().trim();
        const userPassword = u.password.trim();
        
        const emailMatch = userEmail === normalizedEmail;
        const passwordMatch = userPassword === normalizedPassword;
        
        console.log(`\n  🔎 Kontrol:`);
        console.log(`    DB Email: "${userEmail}"`);
        console.log(`    Input Email: "${normalizedEmail}"`);
        console.log(`    Email Match: ${emailMatch}`);
        console.log(`    DB Password: "${userPassword}"`);
        console.log(`    Input Password: "${normalizedPassword}"`);
        console.log(`    Password Match: ${passwordMatch}`);
        console.log(`    Final Result: ${emailMatch && passwordMatch}`);
        
        return emailMatch && passwordMatch;
      });

      if (!foundUser) {
        console.log('\n❌ HATA: Kullanıcı bulunamadı!');
        console.log('Lütfen şu bilgilerle deneyin:');
        console.log('Email: admin@tr.mikelcoffee.com');
        console.log('Şifre: 123456');
        throw new Error('Email veya şifre hatalı');
      }
      
      console.log('\n✅ Kullanıcı bulundu:', foundUser.email);
      console.log('🔐 Onay durumu:', foundUser.isApproved);

      if (!foundUser.isApproved) {
        console.log('⛔ HATA: Hesap onaylı değil!');
        throw new Error('Hesabınız henüz onaylanmadı. Lütfen yöneticinizle iletişime geçin.');
      }

      const { password: _, ...userWithoutPassword } = foundUser;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));
      console.log('💾 Kullanıcı storage\'a kaydedildi');
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
    
    const allUsersStr = await AsyncStorage.getItem('@mikel_all_users');
    const allUsers: (User & { password: string })[] = allUsersStr 
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

    const newUser: User & { password: string } = {
      ...userData,
      id: Date.now().toString(),
      employeeId,
      isApproved: false,
      approvedBy: [],
      region: userData.region || 'İstanbul',
    };

    console.log('✅ Yeni kullanıcı oluşturuldu:', newUser.employeeId, newUser.email);

    allUsers.push(newUser);
    await AsyncStorage.setItem('@mikel_all_users', JSON.stringify(allUsers));
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
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      if (!user) return;
      
      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      
      const allUsersStr = await AsyncStorage.getItem('@mikel_all_users');
      if (allUsersStr) {
        const allUsers: (User & { password: string })[] = JSON.parse(allUsersStr);
        const userIndex = allUsers.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          allUsers[userIndex] = { ...allUsers[userIndex], ...userData };
          await AsyncStorage.setItem('@mikel_all_users', JSON.stringify(allUsers));
        }
      }
      
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
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
