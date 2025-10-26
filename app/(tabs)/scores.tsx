import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { Award, Plus, TrendingUp, TrendingDown, X, User as UserIcon, Check } from 'lucide-react-native';
import { ExamType } from '@/types';

export default function ScoresScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<ExamType | 'all'>('all');
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('sicak');
  const [hotScore, setHotScore] = useState('');
  const [coldScore, setColdScore] = useState('');
  const [generalScore, setGeneralScore] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const examTypes = [
    { id: 'all' as const, label: 'Tümü' },
    { id: 'sicak' as ExamType, label: 'Sıcak Sınav' },
    { id: 'soguk' as ExamType, label: 'Soğuk Sınav' },
    { id: 'genel' as ExamType, label: 'Genel Sınav' },
  ];

  const canManage = 
    user?.position === 'egitmen' ||
    user?.position === 'egitim_muduru' ||
    user?.position === 'insan_kaynaklari' ||
    user?.position === 'bolge_muduru';

  const allMockScores = [
    {
      id: '1',
      employeeId: '2',
      employeeName: 'Ayşe Demir',
      examType: 'sicak' as ExamType,
      score: 85,
      maxScore: 100,
      passed: true,
      examDate: '2025-01-15',
    },
    {
      id: '2',
      employeeId: '3',
      employeeName: 'Mehmet Kaya',
      examType: 'soguk' as ExamType,
      score: 75,
      maxScore: 100,
      passed: false,
      examDate: '2025-01-14',
    },
    {
      id: '3',
      employeeId: '4',
      employeeName: 'Zeynep Şahin',
      examType: 'genel' as ExamType,
      score: 92,
      maxScore: 100,
      passed: true,
      examDate: '2025-01-13',
    },
  ];

  const mockScores = canManage 
    ? allMockScores 
    : allMockScores.filter(score => score.employeeId === user?.id);

  const getExamTypeLabel = (type: ExamType) => {
    const labels = {
      sicak: 'Sıcak Sınav',
      soguk: 'Soğuk Sınav',
      genel: 'Genel Sınav',
    };
    return labels[type];
  };

  const canSeeAllEmployees = 
    user?.position === 'egitmen' ||
    user?.position === 'egitim_muduru' ||
    user?.position === 'insan_kaynaklari' ||
    user?.position === 'bolge_muduru';

  const allMockEmployees = [
    { id: '1', name: 'Ahmet Yılmaz', store: 'Kadıköy' },
    { id: '2', name: 'Ayşe Demir', store: 'Üsküdar' },
    { id: '3', name: 'Mehmet Kaya', store: 'Beşiktaş' },
    { id: '4', name: 'Zeynep Şahin', store: 'Kadıköy' },
  ];

  const mockEmployees = canSeeAllEmployees 
    ? allMockEmployees 
    : (user?.position === 'magaza_muduru' || user?.position === 'mudur_yardimcisi' || user?.position === 'supervisor')
      ? allMockEmployees.filter(emp => emp.store === user?.store)
      : [];

  const filteredEmployees = mockEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddScore = () => {
    if (!selectedEmployee) {
      Alert.alert('Hata', 'Lütfen bir çalışan seçin.');
      return;
    }

    if (selectedExamType === 'sicak' && !hotScore) {
      Alert.alert('Hata', 'Lütfen sıcak sınav puanını girin.');
      return;
    }
    if (selectedExamType === 'soguk' && !coldScore) {
      Alert.alert('Hata', 'Lütfen soğuk sınav puanını girin.');
      return;
    }
    if (selectedExamType === 'genel' && !generalScore) {
      Alert.alert('Hata', 'Lütfen genel sınav puanını girin.');
      return;
    }

    Alert.alert('Başarılı', 'Sınav puanı kaydedildi.');
    setShowScoreModal(false);
    setSelectedEmployee('');
    setSelectedExamType('sicak');
    setHotScore('');
    setColdScore('');
    setGeneralScore('');
    setSearchQuery('');
  };

  const handleCloseModal = () => {
    setShowScoreModal(false);
    setSelectedEmployee('');
    setSelectedExamType('sicak');
    setHotScore('');
    setColdScore('');
    setGeneralScore('');
    setSearchQuery('');
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
          <Text style={styles.pageTitle}>Sınav Puanları</Text>
          {canManage && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowScoreModal(true)}
            >
              <Plus size={20} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {examTypes.map((type) => {
          const isSelected = selectedType === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              style={[styles.filterButton, isSelected && styles.filterButtonActive]}
              onPress={() => setSelectedType(type.id)}
            >
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.infoCard}>
        <Award size={20} color={colors.info} />
        <Text style={styles.infoText}>Geçme notu: 80</Text>
      </View>

      <Image 
        source={{ uri: IMAGES.backgroundLogo }} 
        style={styles.backgroundLogo}
        resizeMode="contain"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {mockScores.map((score) => (
          <View key={score.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.employeeName}>{score.employeeName}</Text>
                <Text style={styles.examType}>{getExamTypeLabel(score.examType)}</Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: score.passed ? colors.success + '15' : colors.error + '15' }]}>
                <Text style={[styles.scoreText, { color: score.passed ? colors.success : colors.error }]}>
                  {score.score}/{score.maxScore}
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(score.score / score.maxScore) * 100}%`,
                      backgroundColor: score.passed ? colors.success : colors.error
                    }
                  ]} 
                />
              </View>

              <View style={styles.statusRow}>
                {score.passed ? (
                  <View style={styles.statusBadge}>
                    <TrendingUp size={14} color={colors.success} />
                    <Text style={[styles.statusText, { color: colors.success }]}>Başarılı</Text>
                  </View>
                ) : (
                  <View style={styles.statusBadge}>
                    <TrendingDown size={14} color={colors.error} />
                    <Text style={[styles.statusText, { color: colors.error }]}>Tekrar Gerekli</Text>
                  </View>
                )}
                <Text style={styles.dateText}>
                  {new Date(score.examDate).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showScoreModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCloseModal}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
              <ScrollView 
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sınav Puanı Gir</Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <X size={24} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Sınav Tipi *</Text>
                <View style={styles.examTypeContainer}>
                  <TouchableOpacity
                    style={[styles.examTypeButton, selectedExamType === 'sicak' && styles.examTypeButtonActive]}
                    onPress={() => setSelectedExamType('sicak')}
                  >
                    <Text style={[styles.examTypeText, selectedExamType === 'sicak' && styles.examTypeTextActive]}>
                      Sıcak Sınav
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.examTypeButton, selectedExamType === 'soguk' && styles.examTypeButtonActive]}
                    onPress={() => setSelectedExamType('soguk')}
                  >
                    <Text style={[styles.examTypeText, selectedExamType === 'soguk' && styles.examTypeTextActive]}>
                      Soğuk Sınav
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.examTypeButton, selectedExamType === 'genel' && styles.examTypeButtonActive]}
                    onPress={() => setSelectedExamType('genel')}
                  >
                    <Text style={[styles.examTypeText, selectedExamType === 'genel' && styles.examTypeTextActive]}>
                      Genel Sınav
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Çalışan Seçin *</Text>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Çalışan ara..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
                <ScrollView style={styles.employeeList} nestedScrollEnabled>
                  {filteredEmployees.map((emp) => (
                    <TouchableOpacity
                      key={emp.id}
                      style={[styles.employeeItem, selectedEmployee === emp.id && styles.employeeItemActive]}
                      onPress={() => setSelectedEmployee(emp.id)}
                    >
                      <View style={styles.employeeItemLeft}>
                        <View style={styles.employeeAvatar}>
                          <UserIcon size={20} color={colors.primary} />
                        </View>
                        <View>
                          <Text style={styles.employeeItemName}>{emp.name}</Text>
                          <Text style={styles.employeeItemStore}>{emp.store}</Text>
                        </View>
                      </View>
                      {selectedEmployee === emp.id && (
                        <View style={styles.checkCircle}>
                          <Check size={16} color={colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.modalSection}>
                {selectedExamType === 'sicak' && (
                  <View style={styles.scoreInputContainer}>
                    <Text style={styles.modalLabel}>Sıcak Sınav Puanı * (100 üzerinden)</Text>
                    <TextInput
                      style={styles.scoreInput}
                      placeholder="Puan giriniz"
                      value={hotScore}
                      onChangeText={setHotScore}
                      keyboardType="numeric"
                      placeholderTextColor={colors.gray[400]}
                    />
                  </View>
                )}
                {selectedExamType === 'soguk' && (
                  <View style={styles.scoreInputContainer}>
                    <Text style={styles.modalLabel}>Soğuk Sınav Puanı * (100 üzerinden)</Text>
                    <TextInput
                      style={styles.scoreInput}
                      placeholder="Puan giriniz"
                      value={coldScore}
                      onChangeText={setColdScore}
                      keyboardType="numeric"
                      placeholderTextColor={colors.gray[400]}
                    />
                  </View>
                )}
                {selectedExamType === 'genel' && (
                  <View style={styles.scoreInputContainer}>
                    <Text style={styles.modalLabel}>Genel Sınav Puanı * (100 üzerinden)</Text>
                    <TextInput
                      style={styles.scoreInput}
                      placeholder="Puan giriniz"
                      value={generalScore}
                      onChangeText={setGeneralScore}
                      keyboardType="numeric"
                      placeholderTextColor={colors.gray[400]}
                    />
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleAddScore}>
                  <Text style={styles.submitButtonText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterScroll: {
    maxHeight: 56,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  filterTextActive: {
    color: colors.white,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.info + '15',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.info,
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
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.gray[900],
    marginBottom: 4,
  },
  examType: {
    fontSize: 14,
    color: colors.gray[600],
  },
  scoreBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  cardBody: {
    gap: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dateText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
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
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[900],
    marginBottom: 12,
  },
  examTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  examTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  examTypeButtonActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  examTypeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  examTypeTextActive: {
    color: colors.primary,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  employeeList: {
    maxHeight: 180,
  },
  employeeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  employeeItemActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  employeeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  employeeItemStore: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreInputContainer: {
    marginTop: 0,
  },
  scoreInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
    fontWeight: '600' as const,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray[200],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
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
});
