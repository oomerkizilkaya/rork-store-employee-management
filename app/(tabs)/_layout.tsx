import { Tabs } from 'expo-router';
import { Briefcase, FolderOpen, Users, Award, MapPin, Clock, DollarSign, Coffee, Bell, User } from 'lucide-react-native';
import { View, Image, Text, StyleSheet } from 'react-native';
import colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { IMAGES } from '@/constants/images';

export default function TabLayout() {
  const { user } = useAuth();

  const canViewShifts = user?.position === 'magaza_muduru' || 
    user?.position === 'mudur_yardimcisi' || 
    user?.position === 'supervisor' ||
    user?.position === 'bolge_muduru';

  const canManageScores = user?.position === 'egitmen' || 
    user?.position === 'egitim_muduru';

  const canManageRegions = user?.position === 'insan_kaynaklari' || 
    user?.position === 'egitim_muduru' || 
    user?.position === 'egitmen' || 
    user?.position === 'bolge_muduru';

  const canManageSalaries = user?.position === 'insan_kaynaklari';



  return (
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
          headerTitleAlign: 'center',
          headerLeft: () => (
            <View style={styles.headerLeft}>
              <Image 
                source={{ uri: IMAGES.logo }} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.headerText}>MikelStaff</Text>
            </View>
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray[400],
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.gray[200],
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600' as const,
          },
        }}
      >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Coffee size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Duyurular',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      {canViewShifts && (
        <Tabs.Screen
          name="shifts"
          options={{
            title: 'Vardiya',
            tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Giriş/Çıkış',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="overtime"
        options={{
          title: 'Mesai',
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          title: 'Dosyalar',
          tabBarIcon: ({ color, size }) => <FolderOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: 'Çalışanlar',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      {canManageScores && (
        <Tabs.Screen
          name="scores"
          options={{
            title: 'Sınavlar',
            tabBarIcon: ({ color, size }) => <Award size={size} color={color} />,
          }}
        />
      )}
      {canManageRegions && (
        <Tabs.Screen
          name="regions"
          options={{
            title: 'Bölgeler',
            tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
          }}
        />
      )}
      {canManageSalaries && (
        <Tabs.Screen
          name="salaries"
          options={{
            title: 'Maaş',
            tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
  },
});
