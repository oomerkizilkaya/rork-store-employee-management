
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  LogOut,
  Camera,
  Save
} from 'lucide-react-native';
import { UserPosition } from '@/types';
import { useState, useEffect } from 'react';
import { positionOptions } from '@/utils/positions';

const getPositionLabel = (position: UserPosition): string => {
  const labels: Record<UserPosition, string> = {
    servis_personeli: 'Servis Personeli',
    barista: 'Barista',
    supervisor: 'Süpervizör',
    mudur_yardimcisi: 'Müdür Yardımcısı',
    magaza_muduru: 'Mağaza Müdürü',
    bolge_muduru: 'Bölge Müdürü',
    egitmen: 'Eğitmen',
    egitim_muduru: 'Eğitim Müdürü',
    insan_kaynaklari: 'İnsan Kaynakları',
  };
  return labels[position];
};

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && editedUser) {
      setEditedUser({ ...editedUser, profilePhoto: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    try {
      if (editedUser) {
        await updateUser(editedUser);
        setIsEditing(false);
        Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
      }
    } catch {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: IMAGES.backgroundLogo }} 
        style={styles.backgroundLogo}
        resizeMode="contain"
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {(editedUser?.profilePhoto && editedUser.profilePhoto.trim() !== '') ? (
              <Image source={{ uri: editedUser.profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <UserIcon size={48} color={colors.primary} />
              </View>
            )}
            {isEditing && (
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={handlePickPhoto}
              >
                <Camera size={16} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>{getPositionLabel(user.position)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
            {!isEditing ? (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editText}>Düzenle</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={styles.cancelEditButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelEditText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Save size={16} color={colors.white} />
                  <Text style={styles.saveText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Mail size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>E-posta</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedUser?.email}
                    onChangeText={(text) => editedUser && setEditedUser({ ...editedUser, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={styles.infoValue}>{user.email}</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Phone size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefon</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedUser?.phone}
                    onChangeText={(text) => editedUser && setEditedUser({ ...editedUser, phone: text })}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.infoValue}>{user.phone}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İş Bilgileri</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MapPin size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mağaza</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedUser?.store}
                    onChangeText={(text) => editedUser && setEditedUser({ ...editedUser, store: text })}
                  />
                ) : (
                  <Text style={styles.infoValue}>{user.store}</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Briefcase size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Pozisyon</Text>
                {isEditing ? (
                  <View style={styles.positionPickerContainer}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.positionPicker}
                    >
                      {positionOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.positionOption,
                            editedUser?.position === option.value && styles.positionOptionActive,
                          ]}
                          onPress={() => editedUser && setEditedUser({ ...editedUser, position: option.value })}
                        >
                          <Text
                            style={[
                              styles.positionOptionText,
                              editedUser?.position === option.value && styles.positionOptionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={styles.infoValue}>{getPositionLabel(user.position)}</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <UserIcon size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Sicil No</Text>
                <Text style={styles.infoValue}>{user.employeeId || 'Atanmamış'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>İşe Başlama</Text>
                <Text style={styles.infoValue}>
                  {new Date(user.startDate).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundLogo: {
    position: 'absolute' as const,
    width: 300,
    height: 300,
    alignSelf: 'center',
    top: '40%',
    opacity: 0.08,
    zIndex: 0,
    pointerEvents: 'none' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.gray[900],
    marginBottom: 8,
  },
  positionBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  positionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.gray[900],
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.gray[600],
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.error + '20',
    marginTop: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.error,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.white,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
  },
  cancelEditText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  input: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.gray[900],
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  positionPickerContainer: {
    marginTop: 8,
  },
  positionPicker: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  positionOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  positionOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  positionOptionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  positionOptionTextActive: {
    color: colors.white,
  },
});
