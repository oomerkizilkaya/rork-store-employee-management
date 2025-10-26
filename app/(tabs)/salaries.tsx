import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Image, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { DollarSign, Search, User as UserIcon, X, Calculator, Clock, Calendar as CalendarIcon } from 'lucide-react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, OvertimeRequest, DaySchedule, EmployeeShift } from '@/types';
import { getPositionLabel } from '@/utils/positions';

export default function SalariesScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const spinValue = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [salaryData, setSalaryData] = useState({
    salary: '',
    monthlyWorkDays: '26',
    dailyWorkHours: '8',
    overtimeHours: '',
    offDayHours: '',
  });

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  useEffect(() => {
    loadEmployees();
  }, [refreshKey]);

  const loadEmployees = async () => {
    try {
      const allUsersStr = await AsyncStorage.getItem('@mikel_all_users');
      if (!allUsersStr) return;

      const allUsers: User[] = JSON.parse(allUsersStr);
      const activeEmployees = allUsers.filter(u => u.isApproved && !u.isTerminated);
      setEmployees(activeEmployees);
    } catch (error) {
      console.error('Çalışanlar yükleme hatası:', error);
    }
  };

  const calculateOvertimeHours = useCallback(async (employeeId: string): Promise<number> => {
    try {
      const overtimeStr = await AsyncStorage.getItem('@mikel_overtime_requests');
      if (!overtimeStr) {
        console.log('📊 Ekstra mesai verisi bulunamadı');
        return 0;
      }

      const requests: OvertimeRequest[] = JSON.parse(overtimeStr);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      console.log(`📊 Toplam ekstra mesai talebi: ${requests.length}`);
      console.log(`📊 Şu anki ay: ${currentMonth + 1}, Yıl: ${currentYear}`);

      const approvedHours = requests
        .filter(req => {
          const reqDate = new Date(req.date);
          const isMatchingEmployee = req.employeeId === employeeId;
          const isApproved = req.status === 'approved';
          const isCurrentMonth = reqDate.getMonth() === currentMonth;
          const isCurrentYear = reqDate.getFullYear() === currentYear;
          
          console.log(`📊 Talep: ${req.employeeName} - ${req.hours} saat - ${req.status} - ${reqDate.toLocaleDateString('tr-TR')}`);
          console.log(`   Employee match: ${isMatchingEmployee}, Approved: ${isApproved}, Month: ${isCurrentMonth}, Year: ${isCurrentYear}`);
          
          return isMatchingEmployee && isApproved && isCurrentMonth && isCurrentYear;
        })
        .reduce((sum, req) => sum + req.hours, 0);

      console.log(`📊 Toplam onaylı ekstra mesai saati: ${approvedHours}`);
      return approvedHours;
    } catch (error) {
      console.error('Ekstra mesai hesaplama hatası:', error);
      return 0;
    }
  }, []);

  const calculateOffDayHours = useCallback(async (employeeId: string): Promise<number> => {
    try {
      const shiftsStr = await AsyncStorage.getItem('@mikel_shifts');
      if (!shiftsStr) return 0;

      const allShifts: any[] = JSON.parse(shiftsStr);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      let offDayHours = 0;

      for (const shift of allShifts) {
        const weekStart = new Date(shift.weekStart);
        if (weekStart.getMonth() !== currentMonth || weekStart.getFullYear() !== currentYear) {
          continue;
        }

        const employeeShift = shift.employees?.find((emp: EmployeeShift) => emp.employeeId === employeeId);
        if (!employeeShift) continue;

        employeeShift.days?.forEach((day: DaySchedule) => {
          const dayDate = new Date(day.date);
          const dayOfWeek = dayDate.getDay();
          
          if (dayOfWeek === 0 && day.startTime && day.endTime && !day.isLeave) {
            const [startHour, startMin] = day.startTime.split(':').map(Number);
            const [endHour, endMin] = day.endTime.split(':').map(Number);
            const hours = (endHour - startHour) + (endMin - startMin) / 60;
            offDayHours += hours;
          }
        });
      }

      return offDayHours;
    } catch (error) {
      console.error('Off günü hesaplama hatası:', error);
      return 0;
    }
  }, []);

  const calculateSalary = useCallback(async (employee: User) => {
    const salary = employee.salary || 0;
    const monthlyWorkDays = employee.monthlyWorkDays || 26;
    const dailyWorkHours = employee.dailyWorkHours || 8;
    
    const dailyRate = salary / monthlyWorkDays;
    const hourlyRate = dailyRate / dailyWorkHours;
    
    const overtimeHours = employee.overtimeHours || 0;
    const offDayHours = employee.offDayHours || 0;
    
    console.log(`📊 Maaş hesaplama - ${employee.firstName} ${employee.lastName}:`);
    console.log(`  - Ekstra mesai saati: ${overtimeHours}`);
    console.log(`  - Pazar günü saati: ${offDayHours}`);
    
    const overtimeRate = hourlyRate * 1.5;
    const offDayRate = hourlyRate * 2;
    
    const overtimePay = overtimeHours * overtimeRate;
    const offDayPay = offDayHours * offDayRate;
    const totalPay = salary + overtimePay + offDayPay;

    return {
      salary,
      monthlyWorkDays,
      dailyWorkHours,
      overtimeHours,
      offDayHours,
      overtimePay,
      offDayPay,
      totalPay,
      hourlyRate,
      overtimeRate,
      offDayRate,
    };
  }, []);

  const handleSaveSalaryInfo = async () => {
    if (!selectedEmployee) return;

    const salary = parseFloat(salaryData.salary.replace(',', '.'));
    const monthlyWorkDays = parseInt(salaryData.monthlyWorkDays);
    const dailyWorkHours = parseFloat(salaryData.dailyWorkHours.replace(',', '.'));
    const overtimeHours = parseFloat(salaryData.overtimeHours.replace(',', '.')) || 0;
    const offDayHours = parseFloat(salaryData.offDayHours.replace(',', '.')) || 0;

    if (isNaN(salary) || salary <= 0) {
      Alert.alert('Hata', 'Geçerli bir maaş giriniz');
      return;
    }

    if (isNaN(monthlyWorkDays) || monthlyWorkDays <= 0 || monthlyWorkDays > 31) {
      Alert.alert('Hata', 'Geçerli bir çalışma günü sayısı giriniz (1-31 arası)');
      return;
    }

    if (isNaN(dailyWorkHours) || dailyWorkHours <= 0 || dailyWorkHours > 24) {
      Alert.alert('Hata', 'Geçerli bir günlük çalışma saati giriniz (1-24 arası)');
      return;
    }

    if (overtimeHours < 0) {
      Alert.alert('Hata', 'Mesai saati negatif olamaz');
      return;
    }

    if (offDayHours < 0) {
      Alert.alert('Hata', 'Off günü saati negatif olamaz');
      return;
    }

    try {
      const allUsersStr = await AsyncStorage.getItem('@mikel_all_users');
      if (!allUsersStr) return;

      const allUsers: User[] = JSON.parse(allUsersStr);
      const userIndex = allUsers.findIndex(u => u.id === selectedEmployee.id);

      if (userIndex !== -1) {
        allUsers[userIndex].salary = salary;
        allUsers[userIndex].monthlyWorkDays = monthlyWorkDays;
        allUsers[userIndex].dailyWorkHours = dailyWorkHours;
        allUsers[userIndex].overtimeHours = overtimeHours;
        allUsers[userIndex].offDayHours = offDayHours;

        await AsyncStorage.setItem('@mikel_all_users', JSON.stringify(allUsers));
        await loadEmployees();
        setRefreshKey(prev => prev + 1);
        
        Alert.alert('Başarılı', 'Maaş bilgileri kaydedildi');
        setModalVisible(false);
        setSelectedEmployee(null);
        setSalaryData({ salary: '', monthlyWorkDays: '26', dailyWorkHours: '8', overtimeHours: '', offDayHours: '' });
      }
    } catch (error) {
      console.error('Maaş kaydetme hatası:', error);
      Alert.alert('Hata', 'Maaş bilgileri kaydedilemedi');
    }
  };

  const openEditModal = (employee: User) => {
    setSelectedEmployee(employee);
    setSalaryData({
      salary: employee.salary?.toString() || '',
      monthlyWorkDays: employee.monthlyWorkDays?.toString() || '26',
      dailyWorkHours: employee.dailyWorkHours?.toString() || '8',
      overtimeHours: employee.overtimeHours?.toString() || '',
      offDayHours: employee.offDayHours?.toString() || '',
    });
    setModalVisible(true);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.employeeId && emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  if (!user || user.position !== 'insan_kaynaklari') {
    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <View style={[styles.headerBackground, { height: insets.top }]} />
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Maaşlar</Text>
          </View>
        </View>
        
        <View style={styles.noAccessContainer}>
          <DollarSign size={48} color={colors.gray[400]} />
          <Text style={styles.noAccessTitle}>Erişim Yetkiniz Yok</Text>
          <Text style={styles.noAccessText}>Bu sayfaya sadece İnsan Kaynakları erişebilir.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={[styles.headerBackground, { height: insets.top }]} />
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Maaşlar</Text>
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

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>Toplam: {filteredEmployees.length} çalışan</Text>
      </View>

      <Image 
        source={{ uri: IMAGES.backgroundLogo }} 
        style={styles.backgroundLogo}
        resizeMode="contain"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredEmployees.map((employee) => (
          <EmployeeSalaryCard 
            key={`salary-${employee.id}`} 
            employee={employee} 
            onEdit={openEditModal}
            calculateSalary={calculateSalary}
            formatCurrency={formatCurrency}
            refreshTrigger={refreshKey}
          />
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedEmployee(null);
          setSalaryData({ salary: '', monthlyWorkDays: '26', dailyWorkHours: '8', overtimeHours: '', offDayHours: '' });
        }}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={styles.modalOverlay}
            onPress={() => {
              setModalVisible(false);
              setSelectedEmployee(null);
              setSalaryData({ salary: '', monthlyWorkDays: '26', dailyWorkHours: '8', overtimeHours: '', offDayHours: '' });
            }}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollViewContent}
                bounces={false}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Maaş Bilgileri</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setModalVisible(false);
                        setSelectedEmployee(null);
                        setSalaryData({ salary: '', monthlyWorkDays: '26', dailyWorkHours: '8', overtimeHours: '', offDayHours: '' });
                      }}
                    >
                      <X size={24} color={colors.gray[500]} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalDescription}>
                    {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Aylık Maaş (₺)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="17000"
                      value={salaryData.salary}
                      onChangeText={(text) => setSalaryData({ ...salaryData, salary: text })}
                      keyboardType="numeric"
                      placeholderTextColor={colors.gray[400]}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Aylık Çalışma Günü</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="26"
                      value={salaryData.monthlyWorkDays}
                      onChangeText={(text) => setSalaryData({ ...salaryData, monthlyWorkDays: text })}
                      keyboardType="numeric"
                      placeholderTextColor={colors.gray[400]}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Günlük Çalışma Saati</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="8 veya 8,5 veya 8.5"
                      value={salaryData.dailyWorkHours}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9.,]/g, '');
                        setSalaryData({ ...salaryData, dailyWorkHours: cleaned });
                      }}
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.gray[400]}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Bu Ay Mesai Saati (Ekstra Çalışma)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0 veya 9,5 veya 9.5"
                      value={salaryData.overtimeHours}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9.,]/g, '');
                        setSalaryData({ ...salaryData, overtimeHours: cleaned });
                      }}
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.gray[400]}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Bu Ay Off Günü Saati (Pazar Çalışması)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0 veya 8,5 veya 8.5"
                      value={salaryData.offDayHours}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9.,]/g, '');
                        setSalaryData({ ...salaryData, offDayHours: cleaned });
                      }}
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.gray[400]}
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => {
                        setModalVisible(false);
                        setSelectedEmployee(null);
                        setSalaryData({ salary: '', monthlyWorkDays: '26', dailyWorkHours: '8', overtimeHours: '', offDayHours: '' });
                      }}
                    >
                      <Text style={styles.cancelButtonText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={handleSaveSalaryInfo}
                    >
                      <Text style={styles.confirmButtonText}>Kaydet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function EmployeeSalaryCard({ 
  employee, 
  onEdit, 
  calculateSalary,
  formatCurrency,
  refreshTrigger 
}: { 
  employee: User; 
  onEdit: (emp: User) => void;
  calculateSalary: (emp: User) => Promise<any>;
  formatCurrency: (amount: number) => string;
  refreshTrigger: number;
}) {
  const [salaryInfo, setSalaryInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSalaryInfo = async () => {
      console.log(`🔄 Maaş bilgisi yükleniyor - ${employee.firstName} ${employee.lastName}`);
      setLoading(true);
      const info = await calculateSalary(employee);
      console.log(`✅ Maaş bilgisi yüklendi:`, info);
      setSalaryInfo(info);
      setLoading(false);
    };
    loadSalaryInfo();
  }, [calculateSalary, employee, refreshTrigger]);

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const hasSalaryInfo = employee.salary && employee.salary > 0;

  return (
    <View style={styles.card}>
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
          <Text style={styles.infoLabel}>Mağaza:</Text>
          <Text style={styles.infoText}>{employee.store}</Text>
        </View>
      </View>

      {hasSalaryInfo ? (
        <>
          <View style={styles.salarySection}>
            <View style={styles.salaryRow}>
              <View style={styles.salaryItem}>
                <DollarSign size={16} color={colors.primary} />
                <View style={styles.salaryDetails}>
                  <Text style={styles.salaryLabel}>Aylık Maaş</Text>
                  <Text style={styles.salaryValue}>{formatCurrency(salaryInfo.salary)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.salaryRow}>
              <View style={styles.salaryItem}>
                <CalendarIcon size={16} color={colors.gray[600]} />
                <View style={styles.salaryDetails}>
                  <Text style={styles.salaryLabel}>Çalışma Günü</Text>
                  <Text style={styles.salaryValue}>{salaryInfo.monthlyWorkDays} gün</Text>
                </View>
              </View>
              <View style={styles.salaryItem}>
                <Clock size={16} color={colors.gray[600]} />
                <View style={styles.salaryDetails}>
                  <Text style={styles.salaryLabel}>Günlük Saat</Text>
                  <Text style={styles.salaryValue}>{salaryInfo.dailyWorkHours} saat</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.calculationSection}>
              <Text style={styles.calculationTitle}>Bu Ay Hesaplama</Text>
              
              {salaryInfo.overtimeHours > 0 && (
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>
                    Ekstra Mesai ({salaryInfo.overtimeHours.toFixed(1)} saat × {formatCurrency(salaryInfo.overtimeRate)}/saat)
                  </Text>
                  <Text style={[styles.calculationValue, { color: colors.success }]}>
                    +{formatCurrency(salaryInfo.overtimePay)}
                  </Text>
                </View>
              )}

              {salaryInfo.offDayHours > 0 && (
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>
                    Pazar Günü ({salaryInfo.offDayHours.toFixed(1)} saat × {formatCurrency(salaryInfo.offDayRate)}/saat)
                  </Text>
                  <Text style={[styles.calculationValue, { color: colors.success }]}>
                    +{formatCurrency(salaryInfo.offDayPay)}
                  </Text>
                </View>
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Toplam Ödeme</Text>
                <Text style={styles.totalValue}>{formatCurrency(salaryInfo.totalPay)}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => onEdit(employee)}
          >
            <Calculator size={16} color={colors.primary} />
            <Text style={styles.editButtonText}>Düzenle</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => onEdit(employee)}
        >
          <DollarSign size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Maaş Bilgisi Ekle</Text>
        </TouchableOpacity>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pageTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.gray[900],
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
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.gray[600],
  },
  infoText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  salarySection: {
    gap: 12,
    marginBottom: 16,
  },
  salaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  salaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 12,
  },
  salaryDetails: {
    flex: 1,
  },
  salaryLabel: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 4,
  },
  salaryValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 8,
  },
  calculationSection: {
    gap: 8,
  },
  calculationTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.gray[900],
    marginBottom: 8,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  calculationLabel: {
    fontSize: 13,
    color: colors.gray[700],
    flex: 1,
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: colors.primary + '30',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.primary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary + '10',
    paddingVertical: 12,
    borderRadius: 10,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
    fontSize: 16,
    color: colors.gray[700],
    marginBottom: 20,
    fontWeight: '600' as const,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[900],
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    paddingVertical: 20,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noAccessTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.gray[900],
    marginTop: 20,
    marginBottom: 8,
  },
  noAccessText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
});
