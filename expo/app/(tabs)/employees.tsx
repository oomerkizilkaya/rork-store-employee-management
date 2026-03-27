import { useState, useRef, useMemo, useEffect } from 'react';
import { Animated } from 'react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Pressable, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';

import * as Sharing from 'expo-sharing';
import { Stack } from 'expo-router';

import colors from '@/constants/colors';
import { Search, Download, User as UserIcon, Phone, Mail, MapPin, UserX, X, Loader } from 'lucide-react-native';
import { User, UserPosition } from '@/types';
import { canSeeAllStores, canSeePhoneNumbers, canApproveEmployees } from '@/utils/permissions';

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

export default function EmployeesScreen() {
  const insets = useSafeAreaInsets();
  const spinValue = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [terminationReason, setTerminationReason] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const usersQuery = trpc.users.list.useQuery(undefined, {
    refetchInterval: 5000,
  });
  
  const approveMutation = trpc.users.approve.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
      Alert.alert('Başarılı', 'Kullanıcı onaylandı.');
    },
    onError: (error) => {
      Alert.alert('Hata', error.message || 'Onaylama işlemi başarısız.');
    },
  });

  const rejectMutation = trpc.users.reject.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
      Alert.alert('Başarılı', 'Kullanıcı reddedildi.');
    },
    onError: (error) => {
      Alert.alert('Hata', error.message || 'Reddetme işlemi başarısız.');
    },
  });

  const canSeeAll = user ? canSeeAllStores(user.position) : false;
  const canSeePhone = user ? canSeePhoneNumbers(user.position) : false;
  const canApprove = user ? canApproveEmployees(user.position) : false;

  const allEmployees = useMemo(() => {
    if (!usersQuery.data) return [];
    return usersQuery.data.filter(u => u.isApproved && !u.isTerminated) as User[];
  }, [usersQuery.data]);

  const pendingUsers = useMemo(() => {
    if (!usersQuery.data || !user) return [];
    
    const pending = usersQuery.data.filter(u => !u.isApproved && !u.isTerminated);
    
    return pending.filter(u => {
      if (user.position === 'insan_kaynaklari' || user.position === 'egitim_muduru') {
        return true;
      }
      if (user.position === 'bolge_muduru' || user.position === 'egitmen') {
        return u.region === user.region;
      }
      if (user.position === 'magaza_muduru' || user.position === 'mudur_yardimcisi' || user.position === 'supervisor') {
        return u.store === user.store;
      }
      return false;
    }) as User[];
  }, [usersQuery.data, user]);

  const handleApprove = (userId: string) => {
    approveMutation.mutate({ userId });
  };

  const handleReject = (userId: string) => {
    rejectMutation.mutate({ userId });
  };

  const mockEmployees = canSeeAll 
    ? allEmployees 
    : allEmployees.filter(emp => emp.store === user?.store);

  const filteredEmployees = mockEmployees.filter(emp => 
    emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.employeeId && emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleTerminate = () => {
    if (!terminationReason.trim()) {
      Alert.alert('Hata', 'Lütfen işten çıkarma sebebini giriniz.');
      return;
    }

    Alert.alert('Bilgi', 'İşten çıkarma özelliği yakında eklenecek.');
    setSelectedEmployee(null);
    setTerminationReason('');
  };

  const handleExportToExcel = async () => {
    try {
      const csvContent = [
        ['Sicil No', 'Ad', 'Soyad', 'Email', 'Telefon', 'Mağaza', 'Pozisyon', 'Başlangıç Tarihi', 'Doğum Tarihi', 'İşten Çıkarıldı', 'Çıkarılma Tarihi', 'Sebep'].join(','),
        ...filteredEmployees.map(emp => [
          emp.employeeId || '-',
          emp.firstName,
          emp.lastName,
          emp.email,
          emp.phone,
          emp.store,
          getPositionLabel(emp.position),
          new Date(emp.startDate).toLocaleDateString('tr-TR'),
          emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('tr-TR') : '-',
          emp.isTerminated ? 'Evet' : 'Hayır',
          emp.terminatedDate ? new Date(emp.terminatedDate).toLocaleDateString('tr-TR') : '-',
          emp.terminationReason || '-'
        ].join(','))
      ].join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'çalışanlar.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Başarılı', 'Dosya indirildi.');
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          const uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
          await Sharing.shareAsync(uri, {
            mimeType: 'text/csv',
            dialogTitle: 'Çalışanlar Listesi',
            UTI: 'public.comma-separated-values-text',
          });
        } else {
          Alert.alert('Hata', 'Paylaşım özelliği kullanılamıyor.');
        }
      }
    } catch (error) {
      console.error('Excel export error:', error);
      Alert.alert('Hata', 'Dosya oluşturulurken hata oluştu.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <Image
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/mpnkmxdel413dnct5qtrw' }}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerTitle}>MikelStaff</Text>
            </View>
          ),
          headerTitle: '',
        }}
      />
      <View style={styles.headerWrapper}>
        <View style={[styles.headerBackground, { height: insets.top }]} />
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Çalışanlar</Text>
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={handleExportToExcel}
          >
            <Download size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Çalışan ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {canApprove && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Aktif Çalışanlar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              Bekleyen Onaylar ({pendingUsers.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {activeTab === 'active' 
            ? `Toplam: ${filteredEmployees.length} çalışan`
            : `Onay Bekleyen: ${pendingUsers.length} kullanıcı`
          }
        </Text>
      </View>

      {usersQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <Loader size={40} color={colors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : usersQuery.error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Hata: {usersQuery.error.message}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => usersQuery.refetch()}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'pending' ? (
          pendingUsers.map((employee) => (
            <View key={`pending-${employee.id}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <UserIcon size={24} color={colors.warning} />
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.name}>{employee.firstName} {employee.lastName}</Text>
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionText}>{getPositionLabel(employee.position)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoSection}>
                {employee.employeeId && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Sicil No:</Text>
                    <Text style={styles.infoText}>{employee.employeeId}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Mail size={16} color={colors.gray[500]} />
                  <Text style={styles.infoText}>{employee.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Phone size={16} color={colors.gray[500]} />
                  <Text style={styles.infoText}>{employee.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MapPin size={16} color={colors.gray[500]} />
                  <Text style={styles.infoText}>{employee.store}</Text>
                </View>
              </View>

              <View style={styles.approvalActions}>
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={() => {
                    Alert.alert(
                      'Reddet',
                      `${employee.firstName} ${employee.lastName} kullanıcısını reddetmek istediğinize emin misiniz?`,
                      [
                        { text: 'İptal', style: 'cancel' },
                        { text: 'Reddet', style: 'destructive', onPress: () => handleReject(employee.id) }
                      ]
                    );
                  }}
                >
                  <Text style={styles.rejectButtonText}>Reddet</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.approveButton}
                  onPress={() => handleApprove(employee.id)}
                >
                  <Text style={styles.approveButtonText}>Onayla</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          filteredEmployees.map((employee) => (
          <View key={`active-${employee.id}`} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <UserIcon size={24} color={colors.primary} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.name}>{employee.firstName} {employee.lastName}</Text>
                <View style={styles.positionBadge}>
                  <Text style={styles.positionText}>{getPositionLabel(employee.position)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoSection}>
              {employee.employeeId && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Sicil No:</Text>
                  <Text style={styles.infoText}>{employee.employeeId}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Mail size={16} color={colors.gray[500]} />
                <Text style={styles.infoText}>{employee.email}</Text>
              </View>
              {canSeePhone && (
                <View style={styles.infoRow}>
                  <Phone size={16} color={colors.gray[500]} />
                  <Text style={styles.infoText}>{employee.phone}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <MapPin size={16} color={colors.gray[500]} />
                <Text style={styles.infoText}>{employee.store}</Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                İşe Başlama: {new Date(employee.startDate).toLocaleDateString('tr-TR')}
              </Text>
              {!employee.isTerminated && (
                <TouchableOpacity 
                  style={styles.terminateButton}
                  onPress={() => setSelectedEmployee(employee)}
                >
                  <UserX size={16} color={colors.error} />
                  <Text style={styles.terminateButtonText}>İşten Çıkar</Text>
                </TouchableOpacity>
              )}
              {employee.isTerminated && (
                <View style={styles.terminatedBadge}>
                  <Text style={styles.terminatedText}>İşten Çıkarıldı</Text>
                </View>
              )}
            </View>
          </View>
        ))
        )}
      </ScrollView>
      )}

      <Modal
        visible={selectedEmployee !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSelectedEmployee(null);
          setTerminationReason('');
        }}
      >
        <View style={styles.modalContainer}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => {
              setSelectedEmployee(null);
              setTerminationReason('');
            }} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>İşten Çıkarma</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedEmployee(null);
                  setTerminationReason('');
                }}
              >
                <X size={24} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              {selectedEmployee?.firstName} {selectedEmployee?.lastName} adlı çalışanı işten çıkarmak üzeresiniz.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sebep *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="İşten çıkarma sebebini giriniz..."
                value={terminationReason}
                onChangeText={setTerminationReason}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setSelectedEmployee(null);
                  setTerminationReason('');
                }}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleTerminate}
              >
                <Text style={styles.confirmButtonText}>Onayla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerBackground: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pageTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  downloadButton: {
    backgroundColor: colors.success,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    gap: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[900],
  },
  statsBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.gray[900],
    marginBottom: 6,
  },
  positionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  positionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  infoSection: {
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.gray[600],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  terminateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.error + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  terminateButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.error,
  },
  terminatedBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  terminatedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.gray[600],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  modalDescription: {
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[900],
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.gray[900],
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray[200],
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[600],
  },
  activeTabText: {
    color: colors.primary,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.error + '10',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.error,
  },
  approveButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  headerLogo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
