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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { LogIn } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const resetDatabase = async () => {
    Alert.alert(
      'Veritabanını Sıfırla',
      'Tüm verileri silip admin hesabını yeniden oluşturmak istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🧽 Veritabanı temizleniyor...');
              await AsyncStorage.clear();
              console.log('✅ Veritabanı temizlendi');
              
              setEmail('admin@tr.mikelcoffee.com');
              setPassword('123456');
              
              Alert.alert(
                'Başarılı ✅',
                'Veritabanı sıfırlandı. Admin hesabı bilgileri otomatik olarak dolduruldu. "Giriş Yap" butonuna tıklayın.',
                [{ text: 'Tamam' }]
              );
            } catch (error) {
              console.error('❌ Veritabanı sıfırlama hatası:', error);
              Alert.alert('Hata', 'Veritabanı sıfırlanamadı');
            }
          },
        },
      ]
    );
  };

  const handleLogin = async () => {
    try {
      console.log('=== GİRİŞ BUTONU TIKLANDI ===');
      
      if (!email || !password) {
        console.log('⚠️ Boş alan kontrolü başarısız');
        Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
        return;
      }

      setLoading(true);
      console.log('=== GİRİŞ DENENİYOR ===');
      console.log('Girilen Email:', email.trim());
      console.log('Girilen Şifre:', password.trim());
      console.log('Şifre uzunluğu:', password.trim().length);
      
      await login(email.trim(), password.trim());
      console.log('✅ Giriş başarılı! Yönlendiriliyor...');
      
      setLoading(false);
      router.replace('/(tabs)/announcements');
    } catch (error) {
      console.error('❌ Giriş hatası:', error);
      const errorMessage = (error as Error).message || 'Giriş başarısız';
      
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('Email veya şifre hatalı')) {
        userFriendlyMessage = 'Test hesabı:\nEmail: admin@tr.mikelcoffee.com\nŞifre: 123456\n\nLütfen doğru bilgileri girdiğinizden emin olun.';
      }
      
      Alert.alert('Giriş Başarısız', userFriendlyMessage);
      setLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <Image
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/hvg8tvnjdmzx7tn2ps5zy' }}
        style={styles.centerLoginLogo}
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
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.gray[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
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

            <View style={styles.testInfoBox}>
              <Text style={styles.testInfoTitle}>💡 Test Hesabı</Text>
              <Text style={styles.testInfoText}>Email: admin@tr.mikelcoffee.com</Text>
              <Text style={styles.testInfoText}>Şifre: 123456</Text>
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetDatabase}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>🔄 Veritabanını Sıfırla</Text>
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
    backgroundColor: colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 100,
  },
  centerLoginLogo: {
    position: 'absolute',
    width: 200,
    height: 100,
    top: 80,
    alignSelf: 'center',
    zIndex: 10,
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
  testInfoBox: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  testInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 8,
  },
  testInfoText: {
    fontSize: 13,
    color: colors.gray[600],
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  resetButton: {
    height: 44,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  resetButtonText: {
    color: colors.gray[700],
    fontSize: 14,
    fontWeight: '600',
  },
});
