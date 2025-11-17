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
import { useAuth } from '../../contexts/AuthContext';
import colors from '../../constants/colors';
import { LogIn, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const testBackend = async () => {
    try {
      console.log('🧪 Testing backend connection...');
      const response = await fetch('https://8081-iu0sg9hfqct46kqzl4bda-6532622b.e2b.app/api/health');
      const data = await response.json();
      console.log('✅ Backend health check:', data);
      Alert.alert('Backend Test', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      Alert.alert('Backend Test Failed', String(error));
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (loading) {
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 Login button pressed, attempting login...');
      
      await login(email.trim(), password.trim());
      
      console.log('✅ Login successful, redirecting...');
      router.replace('/(tabs)/announcements');
    } catch (error: unknown) {
      console.error('❌ Login error in screen:', error);
      
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
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/1isknxxt1pihz4deto1x6' }}
              style={styles.logo}
              resizeMode="contain"
              testID="login-logo"
            />
            <Text style={styles.title}>Hoş Geldiniz</Text>
            <Text style={styles.subtitle}>Devam etmek için giriş yapın</Text>
            <View style={styles.testCredentials}>
              <Text style={styles.testTitle}>Test Hesapları:</Text>
              <Text style={styles.testText}>Admin: admin@tr.mikelcoffee.com / Admin123</Text>
              <Text style={styles.testText}>Test: test@tr.mikelcoffee.com / Test123</Text>
            </View>
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

            <TouchableOpacity
              style={[styles.testButton]}
              onPress={testBackend}
            >
              <Text style={styles.testButtonText}>Test Backend</Text>
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
    gap: 16,
  },

  logo: {
    width: 120,
    height: 120,
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
  testButton: {
    height: 48,
    backgroundColor: colors.gray[600],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  testButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  testCredentials: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  testTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  testText: {
    fontSize: 11,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
});
