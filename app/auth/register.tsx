import { useState, useEffect } from 'react';
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
import { UserPlus } from 'lucide-react-native';
import { UserPosition, Region } from '@/types';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    store: '',
    region: '',
    position: 'servis_personeli' as UserPosition,
    startDate: new Date().toISOString().split('T')[0],
    birthDate: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<string[]>([]);
  const { register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const regionsStr = await AsyncStorage.getItem('@mikel_regions');
      if (regionsStr) {
        const regions: Region[] = JSON.parse(regionsStr);
        const allStores = regions.flatMap(r => r.stores);
        const uniqueStores = Array.from(new Set(allStores)).sort();
        setStores(uniqueStores);
      }
    } catch (error) {
      console.error('Mağazalar yüklenemedi:', error);
    }
  };

  const positions: { label: string; value: UserPosition }[] = [
    { label: 'Servis Personeli', value: 'servis_personeli' },
    { label: 'Barista', value: 'barista' },
    { label: 'Süpervizör', value: 'supervisor' },
    { label: 'Müdür Yardımcısı', value: 'mudur_yardimcisi' },
    { label: 'Mağaza Müdürü', value: 'magaza_muduru' },
    { label: 'Bölge Müdürü', value: 'bolge_muduru' },
    { label: 'Eğitmen', value: 'egitmen' },
    { label: 'Eğitim Müdürü', value: 'egitim_muduru' },
    { label: 'İnsan Kaynakları', value: 'insan_kaynaklari' },
  ];

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, store, position, startDate, birthDate, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !phone || !store || !birthDate || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    const regionsStr = await AsyncStorage.getItem('@mikel_regions');
    let region = 'İstanbul';
    if (regionsStr) {
      const regions: Region[] = JSON.parse(regionsStr);
      const foundRegion = regions.find(r => r.stores.includes(store));
      if (foundRegion) {
        region = foundRegion.name;
      }
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      console.log('🔵 Kayıt fonksiyonu çağrılıyor...');
      await register({
        firstName,
        lastName,
        email,
        phone,
        store,
        region,
        position,
        startDate,
        birthDate,
        password,
      });
      console.log('✅ Kayıt fonksiyonu tamamlandı');
      
      Alert.alert(
        'Kayıt Başarılı! ⏳',
        'Kaydınız alındı. Mağaza yöneticileri ve bölge müdürünüz tarafından onaylandığında sisteme giriş yapabileceksiniz. Onay süreci hakkında bildirim alacaksınız.',
        [
          {
            text: 'Tamam',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (error) {
      const message = (error as Error).message;
      console.error('❌ Kayıt hatası:', error);
      Alert.alert('Kayıt Hatası', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/vlj615hbzdtcmteddz8yd' }}
                style={styles.logo}
                resizeMode="contain"
                onError={(e) => console.log('Logo error:', e.nativeEvent.error)}
              />
            </View>
            <Text style={styles.title}>Kayıt Ol</Text>
            <Text style={styles.subtitle}>Yeni hesap oluşturun</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>İsim *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="İsim"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  editable={!loading}
                />
              </View>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Soyisim *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Soyisim"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-posta *</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@mikel.com"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefon *</Text>
              <TextInput
                style={styles.input}
                placeholder="5XX XXX XX XX"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mağaza *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.store}
                  onValueChange={(value) => setFormData({ ...formData, store: value })}
                  enabled={!loading}
                  style={styles.picker}
                >
                  <Picker.Item label="Mağaza Seçin" value="" />
                  {stores.map((store) => (
                    <Picker.Item key={store} label={store} value={store} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Pozisyon *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                  enabled={!loading}
                  style={styles.picker}
                >
                  {positions.map((pos) => (
                    <Picker.Item key={pos.value} label={pos.label} value={pos.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>İşe Giriş Tarihi *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.startDate}
                onChangeText={(text) => setFormData({ ...formData, startDate: text })}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Doğum Tarihi *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.birthDate}
                onChangeText={(text) => setFormData({ ...formData, birthDate: text })}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Şifre *</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Şifre Tekrar *</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <UserPlus size={20} color={colors.white} />
              <Text style={styles.registerButtonText}>
                {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity disabled={loading}>
                  <Text style={styles.linkText}>Giriş Yap</Text>
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
    padding: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  picker: {
    height: 48,
  },
  registerButton: {
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
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700' as const,
  },
});
