import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import colors from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sayfa Bulunamadı' }} />
      <View style={styles.container}>
        <AlertCircle size={64} color={colors.error} />
        <Text style={styles.title}>Sayfa Bulunamadı</Text>
        <Text style={styles.description}>Aradığınız sayfa mevcut değil.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Ana sayfaya dön</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
    color: colors.gray[900],
  },
  description: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 24,
    textAlign: 'center',
  },
  link: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
});
