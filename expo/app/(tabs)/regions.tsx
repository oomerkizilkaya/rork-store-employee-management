import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, FlatList, Image, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Plus, Store, X, ChevronRight, User, Users } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { Region, User as UserType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegionsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const spinValue = useRef(new Animated.Value(0)).current;
  
  const [regions, setRegions] = useState<Region[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [regionName, setRegionName] = useState('');
  const [storeInput, setStoreInput] = useState('');
  const [newStores, setNewStores] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedManager, setSelectedManager] = useState<UserType | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<UserType | null>(null);
  const [showManagerPicker, setShowManagerPicker] = useState(false);
  const [showTrainerPicker, setShowTrainerPicker] = useState(false);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  useEffect(() => {
    loadUsers();
    loadRegions();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const loadRegions = async () => {
    try {
      const regionsStr = await AsyncStorage.getItem('@mikel_regions');
      if (regionsStr) {
        const loadedRegions: Region[] = JSON.parse(regionsStr);
        setRegions(loadedRegions);
      } else {
        const defaultRegions: Region[] = [
          {
            id: '1',
            name: 'İstanbul Anadolu',
            stores: ['Kadıköy', 'Üsküdar', 'Kartal'],
            createdBy: user?.id || '',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'İstanbul Avrupa',
            stores: ['Beyoğlu', 'Şişli', 'Beşiktaş'],
            createdBy: user?.id || '',
            createdAt: new Date().toISOString(),
          },
        ];
        await AsyncStorage.setItem('@mikel_regions', JSON.stringify(defaultRegions));
        setRegions(defaultRegions);
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersStr = await AsyncStorage.getItem('@mikel_all_users');
      if (usersStr) {
        const users: UserType[] = JSON.parse(usersStr);
        setAllUsers(users.filter(u => u.isApproved));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const canManageRegions = user?.position === 'insan_kaynaklari' || 
    user?.position === 'egitim_muduru' || 
    user?.position === 'egitmen' || 
    user?.position === 'bolge_muduru';

  const hasFullAccess = user?.position === 'insan_kaynaklari' || 
    user?.position === 'egitim_muduru' || 
    user?.position === 'egitmen' || 
    user?.position === 'bolge_muduru';

  if (!canManageRegions) {
    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <View style={[styles.headerBackground, { height: insets.top }]} />
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Bölge Yönetimi</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <MapPin size={64} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>Yetki Yok</Text>
          <Text style={styles.emptyText}>Bu sayfaya erişim yetkiniz bulunmuyor</Text>
        </View>
      </View>
    );
  }

  const handleAddStore = () => {
    if (storeInput.trim()) {
      setNewStores([...newStores, storeInput.trim()]);
      setStoreInput('');
    }
  };

  const handleRemoveStore = (index: number) => {
    setNewStores(newStores.filter((_, i) => i !== index));
  };

  const handleCreateRegion = async () => {
    if (!regionName.trim() || newStores.length === 0) {
      Alert.alert('Hata', 'Lütfen bölge adı girin ve en az bir mağaza ekleyin');
      return;
    }

    const newRegion: Region = {
      id: Date.now().toString(),
      name: regionName,
      stores: newStores,
      regionalManager: selectedManager?.id,
      regionalManagerName: selectedManager ? `${selectedManager.firstName} ${selectedManager.lastName}` : undefined,
      trainer: selectedTrainer?.id,
      trainerName: selectedTrainer ? `${selectedTrainer.firstName} ${selectedTrainer.lastName}` : undefined,
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
    };

    const updatedRegions = [...regions, newRegion];
    setRegions(updatedRegions);
    await AsyncStorage.setItem('@mikel_regions', JSON.stringify(updatedRegions));
    setShowModal(false);
    setRegionName('');
    setNewStores([]);
    setSelectedManager(null);
    setSelectedTrainer(null);
  };

  const handleRegionPress = (region: Region) => {
    setSelectedRegion(region);
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
          <Text style={styles.pageTitle}>Bölge Yönetimi</Text>
          {hasFullAccess && (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
              <Plus size={20} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Image 
        source={{ uri: IMAGES.backgroundLogo }} 
        style={styles.backgroundLogo}
        resizeMode="contain"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {regions.map((region) => (
          <TouchableOpacity
            key={region.id}
            style={styles.regionCard}
            onPress={() => handleRegionPress(region)}
          >
            <View style={styles.regionHeader}>
              <View style={styles.regionIcon}>
                <MapPin size={24} color={colors.primary} />
              </View>
              <View style={styles.regionInfo}>
                <Text style={styles.regionName}>{region.name}</Text>
                <View style={styles.storeCount}>
                  <Store size={14} color={colors.gray[600]} />
                  <Text style={styles.storeCountText}>{region.stores.length} Mağaza</Text>
                </View>
              </View>
              <ChevronRight size={24} color={colors.gray[400]} />
            </View>
            <View style={styles.storesContainer}>
              {region.stores.map((store, idx) => (
                <View key={idx} style={styles.storeTag}>
                  <Store size={12} color={colors.primary} />
                  <Text style={styles.storeTagText}>{store}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Bölge Oluştur</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Bölge Adı"
              value={regionName}
              onChangeText={setRegionName}
              placeholderTextColor={colors.gray[400]}
            />

            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowManagerPicker(true)}
            >
              <User size={20} color={colors.primary} />
              <Text style={styles.pickerButtonText}>
                {selectedManager ? `${selectedManager.firstName} ${selectedManager.lastName}` : 'Bölge Müdürü Seç'}
              </Text>
              <ChevronRight size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTrainerPicker(true)}
            >
              <Users size={20} color={colors.primary} />
              <Text style={styles.pickerButtonText}>
                {selectedTrainer ? `${selectedTrainer.firstName} ${selectedTrainer.lastName}` : 'Eğitmen Seç'}
              </Text>
              <ChevronRight size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            <View style={styles.storeInputContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Mağaza Adı"
                value={storeInput}
                onChangeText={setStoreInput}
                placeholderTextColor={colors.gray[400]}
              />
              <TouchableOpacity style={styles.addStoreButton} onPress={handleAddStore}>
                <Plus size={20} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.storesListContainer}>
              {newStores.map((store, idx) => (
                <View key={idx} style={styles.storeItem}>
                  <Store size={16} color={colors.primary} />
                  <Text style={styles.storeItemText}>{store}</Text>
                  <TouchableOpacity onPress={() => handleRemoveStore(idx)}>
                    <X size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleCreateRegion}>
              <Text style={styles.createButtonText}>Bölge Oluştur</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={selectedRegion !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedRegion?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedRegion(null)}>
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {selectedRegion?.regionalManagerName && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Bölge Müdürü</Text>
                <View style={styles.detailItem}>
                  <User size={20} color={colors.primary} />
                  <Text style={styles.detailText}>{selectedRegion.regionalManagerName}</Text>
                </View>
              </View>
            )}

            {selectedRegion?.trainerName && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Eğitmen</Text>
                <View style={styles.detailItem}>
                  <Users size={20} color={colors.primary} />
                  <Text style={styles.detailText}>{selectedRegion.trainerName}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Mağazalar</Text>
              {selectedRegion?.stores.map((store, idx) => (
                <View key={idx} style={styles.detailStore}>
                  <Store size={20} color={colors.primary} />
                  <Text style={styles.detailStoreText}>{store}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.gray[600] }]}
              onPress={() => setSelectedRegion(null)}
            >
              <Text style={styles.createButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showManagerPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bölge Müdürü Seç</Text>
              <TouchableOpacity onPress={() => setShowManagerPicker(false)}>
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allUsers.filter(u => u.position === 'bolge_muduru')}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => {
                    setSelectedManager(item);
                    setShowManagerPicker(false);
                  }}
                >
                  <User size={20} color={colors.primary} />
                  <Text style={styles.userItemText}>
                    {item.firstName} {item.lastName}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Bölge müdürü bulunamadı</Text>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showTrainerPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Eğitmen Seç</Text>
              <TouchableOpacity onPress={() => setShowTrainerPicker(false)}>
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allUsers.filter(u => u.position === 'egitmen')}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => {
                    setSelectedTrainer(item);
                    setShowTrainerPicker(false);
                  }}
                >
                  <Users size={20} color={colors.primary} />
                  <Text style={styles.userItemText}>
                    {item.firstName} {item.lastName}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Eğitmen bulunamadı</Text>
              }
            />
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
    gap: 12,
  },
  pageTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  regionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  regionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  regionName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.gray[900],
    marginBottom: 4,
  },
  storeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storeCountText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  storesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  storeTagText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 12,
  },
  storeInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addStoreButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storesListContainer: {
    gap: 8,
    marginBottom: 20,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  storeItemText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[900],
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.gray[700],
    marginBottom: 12,
  },
  detailStore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    marginBottom: 8,
  },
  detailStoreText: {
    fontSize: 16,
    color: colors.gray[900],
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[700],
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  userItemText: {
    fontSize: 16,
    color: colors.gray[900],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 10,
  },
  detailText: {
    fontSize: 16,
    color: colors.gray[900],
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
});
