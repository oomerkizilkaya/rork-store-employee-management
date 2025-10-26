import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { LogIn, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    
    try {
      await login(email.trim(), password.trim());
      router.replace('/(tabs)/announcements');
    } catch (error: unknown) {
      let errorMessage = 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String((error as { message: string }).message);
        
        if (message.includes('Email veya şifre hatalı') || message.includes('UNAUTHORIZED')) {
          errorMessage = 'Email veya şifre hatalı.';
        } else if (message.includes('onaylanmadı') || message.includes('FORBIDDEN')) {
          errorMessage = 'Hesabınız henüz onaylanmamış.';
        } else if (message) {
          errorMessage = message;
        }
      }
      
      Alert.alert('Giriş Başarısız', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <Image
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/p3xx7q0899ab7jo65ozfv' }}
          style={styles.backgroundLogo}
          resizeMode="contain"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Hoş Geldiniz</Text>
              <Text style={styles.subtitle}>Devam etmek için giriş yapın</Text>
            </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@mikel.com"
                placeholderTextColor={colors.gray[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Şifre</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray[400]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.gray[500]} />
                  ) : (
                    <Eye size={20} color={colors.gray[500]} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LogIn size={20} color={colors.white} />
              <Text style={styles.loginButtonText}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Hesabınız yok mu? </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity disabled={loading}>
                  <Text style={styles.linkText}>Kayıt Ol</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B4423',
  },
  backgroundLogo: {
    position: 'absolute',
    width: 250,
    height: 250,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -125 }, { translateY: -125 }],
    opacity: 0.15,
    zIndex: 0,
  },
  keyboardView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  loginButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  passwordInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.gray[900],
  },
  eyeButton: {
    padding: 12,
  },
});
