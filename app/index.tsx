
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  if (!loading) {
    if (user) {
      return <Redirect href="/(tabs)/announcements" />;
    } else {
      return <Redirect href="/auth/login" />;
    }
  }

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
