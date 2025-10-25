import { Tabs } from 'expo-router';
import { Briefcase, FolderOpen, Users, Award, MapPin, Clock, DollarSign, Coffee } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { View, Image, StyleSheet } from 'react-native';

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
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/srluf8nz363sf7yd45vw3' }}
                style={styles.cupLogo}
                resizeMode="contain"
              />
            </View>
          ),
          headerTitle: () => (
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/hvg8tvnjdmzx7tn2ps5zy' }}
              style={styles.mikelLogo}
              resizeMode="contain"
            />
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
          tabBarIcon: ({ color, size }) => <Coffee size={size} color={color} />,
        }}
      />
      {canViewShifts && (
        <Tabs.Screen
          name="shifts"
          options={{
            title: 'Vardiya',
            tabBarIcon: ({ color, size }) => <Coffee size={size} color={color} />,
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
          tabBarIcon: ({ color, size }) => <Coffee size={size} color={color} />,
        }}
      />
      </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    marginLeft: 16,
  },
  cupLogo: {
    width: 40,
    height: 40,
  },
  mikelLogo: {
    width: 120,
    height: 40,
  },
});
