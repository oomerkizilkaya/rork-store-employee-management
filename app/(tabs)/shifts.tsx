import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, TextInput, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { Calendar, Plus, ChevronLeft, ChevronRight, User, X, Clock, Check } from 'lucide-react-native';
import { Shift, EmployeeShift, DaySchedule, Region } from '@/types';
import { sendShiftCreatedNotification, sendUntrainedEmployeeNotification } from '@/utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function ShiftsScreen() {
  const { user } = useAuth();

  const today = new Date();
  const [selectedWeek, setSelectedWeek] = useState(getWeekStart(today));
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'store' | 'employees'>('store');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employeeShifts, setEmployeeShifts] = useState<{ [key: string]: DaySchedule[] }>({});

  const stores = ['Kadıköy', 'Üsküdar', 'Kartal', 'Beyoğlu', 'Şişli', 'Beşiktaş'];
  const [selectedStore, setSelectedStore] = useState(user?.store || stores[0]);
  const [modalSelectedStore, setModalSelectedStore] = useState(user?.store || stores[0]);



  const mockShifts: Shift[] = stores.map((storeName, storeIndex) => ({
    id: `store-${storeIndex}`,
    storeId: `store${storeIndex}`,
    storeName,
    weekStart: formatDate(selectedWeek),
    weekEnd: formatDate(addDays(selectedWeek, 6)),
    employees: [
      {
        employeeId: `${storeIndex}-1`,
        employeeName: `Çalışan ${storeIndex * 3 + 1}`,
        position: 'barista',
        days: Array.from({ length: 7 }, (_, i) => ({
          date: formatDate(addDays(selectedWeek, i)),
          startTime: i < 5 ? '09:00' : undefined,
          endTime: i < 5 ? '17:00' : undefined,
          isLeave: i >= 5,
          leaveType: i >= 5 ? ('vacation' as const) : undefined,
        })),
      },
      {
        employeeId: `${storeIndex}-2`,
        employeeName: `Çalışan ${storeIndex * 3 + 2}`,
        position: 'supervisor',
        days: Array.from({ length: 7 }, (_, i) => ({
          date: formatDate(addDays(selectedWeek, i)),
          startTime: '10:00',
          endTime: '18:00',
        })),
      },
      {
        employeeId: `${storeIndex}-3`,
        employeeName: `Çalışan ${storeIndex * 3 + 3}`,
        position: 'servis_personeli',
        days: Array.from({ length: 7 }, (_, i) => ({
          date: formatDate(addDays(selectedWeek, i)),
          startTime: i !== 2 ? '14:00' : undefined,
          endTime: i !== 2 ? '22:00' : undefined,
          isLeave: i === 2,
          leaveType: i === 2 ? ('sick' as const) : undefined,
        })),
      },
    ],
    createdBy: user?.id || '',
    createdAt: new Date().toISOString(),
  }));

  const canManageShifts = user?.position === 'magaza_muduru';

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(selectedWeek, i));

  const handlePreviousWeek = () => {
    setSelectedWeek(addDays(selectedWeek, -7));
  };

  const handleNextWeek = () => {
    setSelectedWeek(addDays(selectedWeek, 7));
  };

  const currentShift = mockShifts.find(
    s => s.storeName === selectedStore
  );

  const allMockEmployees = [
    { id: '1', name: 'Ahmet Yılmaz', position: 'barista', store: 'Kadıköy' },
    { id: '2', name: 'Ayşe Demir', position: 'supervisor', store: 'Kadıköy' },
    { id: '3', name: 'Mehmet Kaya', position: 'servis_personeli', store: 'Kadıköy' },
    { id: '4', name: 'Fatma Çelik', position: 'barista', store: 'Üsküdar' },
    { id: '5', name: 'Ali Öztürk', position: 'servis_personeli', store: 'Üsküdar' },
    { id: '6', name: 'Zeynep Aydın', position: 'barista', store: 'Beşiktaş' },
  ];

  const mockEmployees = user ? [
    ...allMockEmployees.filter(emp => emp.store === modalSelectedStore),
    { 
      id: user.id, 
      name: `${user.firstName} ${user.lastName}`, 
      position: user.position,
      store: user.store 
    }
  ] : allMockEmployees.filter(emp => emp.store === modalSelectedStore);

  const handleOpenModal = () => {
    setShowModal(true);
    setModalStep('store');
    setSelectedEmployees([]);
    setEmployeeShifts({});
    setModalSelectedStore(user?.store || stores[0]);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalStep('store');
    setSelectedEmployees([]);
    setEmployeeShifts({});
  };

  const handleStoreSelected = () => {
    setModalStep('employees');
    const storeEmployees = user ? [
      ...allMockEmployees.filter(emp => emp.store === modalSelectedStore),
      { 
        id: user.id, 
        name: `${user.firstName} ${user.lastName}`, 
        position: user.position,
        store: user.store 
      }
    ] : allMockEmployees.filter(emp => emp.store === modalSelectedStore);
    
    const initialShifts: { [key: string]: DaySchedule[] } = {};
    storeEmployees.forEach(emp => {
      initialShifts[emp.id] = weekDates.map(date => ({
        date: formatDate(date),
        startTime: '',
        endTime: '',
      }));
    });
    setEmployeeShifts(initialShifts);
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const updateEmployeeShift = (employeeId: string, dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setEmployeeShifts(prev => ({
      ...prev,
      [employeeId]: prev[employeeId].map((day, idx) => 
        idx === dayIndex ? { ...day, [field]: value } : day
      )
    }));
  };

  const handleSaveShift = async () => {
    console.log('Saving shift for store:', modalSelectedStore);
    console.log('Selected employees:', selectedEmployees);
    console.log('Employee shifts:', employeeShifts);
    
    try {
      const allUsersStr = await AsyncStorage.getItem('@mikel_all_users');
      if (allUsersStr) {
        const allUsers = JSON.parse(allUsersStr);
        const selectedUserIds = selectedEmployees;
        
        for (const empId of selectedUserIds) {
          const employee = allUsers.find((u: any) => u.id === empId);
          if (employee && !employee.hasTraining) {
            console.log('⚠️ Eğitimsiz personel bulundu:', `${employee.firstName} ${employee.lastName}`);
            await sendUntrainedEmployeeNotification(
              `${employee.firstName} ${employee.lastName}`,
              getPositionLabel(employee.position),
              modalSelectedStore
            );
          }
        }
      }
      
      const regionsStr = await AsyncStorage.getItem('@mikel_regions');
      if (regionsStr) {
        const regions: Region[] = JSON.parse(regionsStr);
        const region = regions.find(r => r.stores.includes(modalSelectedStore));
        
        if (region) {
          if (region.regionalManager) {
            await sendShiftCreatedNotification(
              modalSelectedStore,
              formatDate(weekDates[0]),
              formatDate(weekDates[6]),
              'manager'
            );
          }
          
          if (region.trainer) {
            await sendShiftCreatedNotification(
              modalSelectedStore,
              formatDate(weekDates[0]),
              formatDate(weekDates[6]),
              'trainer'
            );
          }
        }
      }
      
      Alert.alert('Başarılı', 'Vardiya oluşturuldu ve ilgili kişilere bildirim gönderildi');
    } catch (error) {
      console.error('Failed to send notifications:', error);
      Alert.alert('Başarılı', 'Vardiya oluşturuldu');
    }
    
    handleCloseModal();
  };

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: IMAGES.backgroundLogo }} 
        style={styles.backgroundLogo}
        resizeMode="contain"
      />

      {canManageShifts && (
        <View style={styles.createButtonContainer}>
          <TouchableOpacity style={styles.addButton} onPress={handleOpenModal}>
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.topSpacer} />

      <View style={styles.weekNavigator}>
        <TouchableOpacity style={styles.navButton} onPress={handlePreviousWeek}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekText}>
            {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
          </Text>
          <Text style={styles.storeText}>{selectedStore}</Text>
        </View>
        <TouchableOpacity style={styles.navButton} onPress={handleNextWeek}>
          <ChevronRight size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storeFilterContainer}
        style={styles.storeFilterScroll}
      >
        {stores.map((store) => (
          <TouchableOpacity
            key={store}
            style={[
              styles.storeFilterButton,
              selectedStore === store && styles.storeFilterButtonActive,
            ]}
            onPress={() => setSelectedStore(store)}
          >
            <Text
              style={[
                styles.storeFilterText,
                selectedStore === store && styles.storeFilterTextActive,
              ]}
            >
              {store}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!currentShift ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>Henüz vardiya oluşturulmamış</Text>
            <Text style={styles.emptyText}>
              {canManageShifts 
                ? 'Mağazanız için vardiya oluşturun'
                : 'Mağaza müdürünüz vardiya oluşturduğunda burada görünecek'}
            </Text>
          </View>
        ) : (
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              {DAYS.map((day, idx) => (
                <View key={`header-${idx}-${formatDate(weekDates[idx])}`} style={styles.dayHeader}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                  <Text style={styles.dateHeaderText}>{weekDates[idx].getDate()}</Text>
                </View>
              ))}
            </View>

            {currentShift.employees.map((employee) => (
              <View key={`shift-employee-${currentShift.id}-${employee.employeeId}`} style={styles.employeeRow}>
                <View style={styles.employeeInfo}>
                  <View style={styles.employeeAvatar}>
                    <User size={12} color={colors.primary} />
                  </View>
                  <View style={styles.employeeDetails}>
                    <Text style={styles.employeeName}>{employee.employeeName}</Text>
                    <Text style={styles.employeePosition}>
                      {getPositionLabel(employee.position)}
                    </Text>
                  </View>
                </View>

                <View style={styles.daysRow}>
                  {employee.days.map((day, idx) => (
                    <View key={`day-${employee.employeeId}-${idx}-${day.date}`} style={styles.dayCell}>
                      {day.isLeave ? (
                        <View style={[styles.leaveIndicator, getLeaveStyle(day.leaveType)]}>
                          <Text style={styles.leaveText}>
                            {getLeaveLabel(day.leaveType)}
                          </Text>
                        </View>
                      ) : day.startTime && day.endTime ? (
                        <View style={styles.shiftIndicator}>
                          <Text style={styles.shiftTime}>
                            {day.startTime}-{day.endTime}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.emptyCell}>
                          <Text style={styles.emptyCellText}>-</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {modalStep === 'store' ? 'Mağaza Seçin' : 'Çalışanları Seçin ve Saat Girin'}
                </Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <X size={24} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              {modalStep === 'store' ? (
                <>
                  <View style={styles.modalSection}>
                    <ScrollView 
                      style={styles.storeSelectScroll}
                      contentContainerStyle={styles.storeSelectContent}
                    >
                      {stores.map((store) => (
                        <TouchableOpacity
                          key={store}
                          style={[
                            styles.storeSelectButton,
                            modalSelectedStore === store && styles.storeSelectButtonActive,
                          ]}
                          onPress={() => setModalSelectedStore(store)}
                        >
                          <Text
                            style={[
                              styles.storeSelectText,
                              modalSelectedStore === store && styles.storeSelectTextActive,
                            ]}
                          >
                            {store}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleStoreSelected}
                  >
                    <Text style={styles.modalButtonText}>Devam Et</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.weekHeader}>
                    <Text style={styles.weekHeaderText}>
                      {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                    </Text>
                  </View>

                  <ScrollView style={styles.employeeListScroll}>
                    {mockEmployees.map((employee) => (
                      <View key={employee.id} style={styles.employeeCard}>
                        <TouchableOpacity
                          style={styles.employeeSelectRow}
                          onPress={() => toggleEmployeeSelection(employee.id)}
                        >
                          <View style={styles.checkboxContainer}>
                            <View style={[
                              styles.checkbox,
                              selectedEmployees.includes(employee.id) && styles.checkboxActive
                            ]}>
                              {selectedEmployees.includes(employee.id) && (
                                <Check size={16} color={colors.white} />
                              )}
                            </View>
                          </View>
                          <View style={styles.employeeInfoModal}>
                            <Text style={styles.employeeNameModal}>{employee.name}</Text>
                            <Text style={styles.employeePositionModal}>
                              {getPositionLabel(employee.position)}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {selectedEmployees.includes(employee.id) && (
                          <View style={styles.timeInputContainer}>
                            {weekDates.map((date, dayIdx) => (
                              <View key={`time-${employee.id}-${dayIdx}-${formatDate(date)}`} style={styles.dayTimeRow}>
                                <View style={styles.dayLabelContainer}>
                                  <Text style={styles.dayLabel}>{DAYS[dayIdx]}</Text>
                                  <Text style={styles.dateLabel}>{formatDate(date)}</Text>
                                </View>
                                <View style={styles.timeInputs}>
                                  <View style={styles.timeInputWrapper}>
                                    <Clock size={14} color={colors.gray[400]} />
                                    <TextInput
                                      style={styles.timeInput}
                                      placeholder="09:00"
                                      value={employeeShifts[employee.id]?.[dayIdx]?.startTime || ''}
                                      onChangeText={(text) => updateEmployeeShift(employee.id, dayIdx, 'startTime', text)}
                                      keyboardType="numbers-and-punctuation"
                                      maxLength={5}
                                    />
                                  </View>
                                  <Text style={styles.timeSeparator}>-</Text>
                                  <View style={styles.timeInputWrapper}>
                                    <Clock size={14} color={colors.gray[400]} />
                                    <TextInput
                                      style={styles.timeInput}
                                      placeholder="17:00"
                                      value={employeeShifts[employee.id]?.[dayIdx]?.endTime || ''}
                                      onChangeText={(text) => updateEmployeeShift(employee.id, dayIdx, 'endTime', text)}
                                      keyboardType="numbers-and-punctuation"
                                      maxLength={5}
                                    />
                                  </View>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setModalStep('store')}
                    >
                      <Text style={styles.backButtonText}>Geri</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        selectedEmployees.length === 0 && styles.saveButtonDisabled
                      ]}
                      onPress={handleSaveShift}
                      disabled={selectedEmployees.length === 0}
                    >
                      <Text style={styles.saveButtonText}>Kaydet</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
}

function getPositionLabel(position: string): string {
  const labels: { [key: string]: string } = {
    servis_personeli: 'Servis Personeli',
    barista: 'Barista',
    supervisor: 'Supervisor',
    mudur_yardimcisi: 'Müdür Yardımcısı',
    magaza_muduru: 'Mağaza Müdürü',
    bolge_muduru: 'Bölge Müdürü',
    egitmen: 'Eğitmen',
    egitim_muduru: 'Eğitim Müdürü',
    insan_kaynaklari: 'İnsan Kaynakları',
  };
  return labels[position] || position;
}

function getLeaveLabel(leaveType?: 'sick' | 'vacation' | 'personal'): string {
  const labels = {
    sick: 'İzin',
    vacation: 'İzin',
    personal: 'İzin',
  };
  return leaveType ? labels[leaveType] : 'İzin';
}

function getLeaveStyle(leaveType?: 'sick' | 'vacation' | 'personal') {
  return {
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning,
  };
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
  createButtonContainer: {
    position: 'absolute' as const,
    bottom: 100,
    right: 20,
    zIndex: 10,
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
  topSpacer: {
    height: 16,
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  navButton: {
    padding: 8,
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  storeText: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 40,
  },
  calendarContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[100],
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.gray[700],
    marginBottom: 4,
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  employeeRow: {
    marginBottom: 8,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  employeeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeDetails: {
    marginLeft: 8,
  },
  employeeName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  employeePosition: {
    fontSize: 10,
    color: colors.gray[600],
  },
  daysRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dayCell: {
    flex: 1,
    height: 32,
  },
  shiftIndicator: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  shiftTime: {
    fontSize: 7,
    fontWeight: '600' as const,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 9,
  },
  leaveIndicator: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flex: 1,
  },
  leaveText: {
    fontSize: 7,
    fontWeight: '600' as const,
    color: colors.warning,
  },
  emptyCell: {
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyCellText: {
    fontSize: 14,
    color: colors.gray[300],
  },
  storeFilterScroll: {
    flexGrow: 0,
    marginTop: 16,
    marginBottom: 16,
  },
  storeFilterContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  storeFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  storeFilterButtonActive: {
    backgroundColor: colors.primary,
  },
  storeFilterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  storeFilterTextActive: {
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  modalText: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.gray[900],
    marginBottom: 12,
  },
  storeSelectScroll: {
    maxHeight: 150,
  },
  storeSelectContent: {
    gap: 6,
  },
  storeSelectButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  storeSelectButtonActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  storeSelectText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  storeSelectTextActive: {
    color: colors.primary,
  },
  weekHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    marginBottom: 16,
  },
  weekHeaderText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.gray[900],
    textAlign: 'center',
  },
  employeeListScroll: {
    maxHeight: 400,
    marginBottom: 16,
  },
  employeeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 12,
    overflow: 'hidden',
  },
  employeeSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  employeeInfoModal: {
    flex: 1,
  },
  employeeNameModal: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  employeePositionModal: {
    fontSize: 13,
    color: colors.gray[600],
    marginTop: 2,
  },
  timeInputContainer: {
    backgroundColor: colors.gray[50],
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  dayTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayLabelContainer: {
    width: 70,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  dateLabel: {
    fontSize: 11,
    color: colors.gray[600],
    marginTop: 2,
  },
  timeInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  timeInput: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[900],
    padding: 0,
  },
  timeSeparator: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[400],
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.gray[700],
    fontSize: 16,
    fontWeight: '700' as const,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
