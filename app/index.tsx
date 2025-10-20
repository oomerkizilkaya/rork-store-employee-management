import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!loading && !hasNavigated.current) {
      hasNavigated.current = true;
      
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)/announcements');
        } else {
          router.replace('/auth/login');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: colors.primary 
    }}>
      <ActivityIndicator size="large" color={colors.white} />
    </View>
  );
}
