import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Image } from 'react-native';
import { Clock, Check, X, AlertCircle, Store as StoreIcon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { sendCheckInNotification, sendCheckOutNotification } from '@/utils/notifications';
import { AttendanceRecord } from '@/types';
import { canViewRegionalData, canCreateAttendance } from '@/utils/permissions';

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'checkIn' | 'checkOut'>('checkIn');

  const [reason, setReason] = useState('');

  const canViewRegional = user ? canViewRegionalData(user.position) : false;
  const canCreate = user ? canCreateAttendance(user.position) : true;

  const [records, setRecords] = useState<AttendanceRecord[]>([
    {
      id: '1',
      employeeId: user?.id || '1',
      employeeName: `${user?.firstName} ${user?.lastName}` || 'Test User',
      store: user?.store || 'Merkez',
      region: user?.region || 'İstanbul',
      date: new Date().toISOString().split('T')[0],
      scheduledStart: '09:00',
      scheduledEnd: '17:00',
      checkInStatus: 'pending',
      checkOutStatus: 'pending',
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'Ahmet Yılmaz',
      store: 'Kadıköy',
      region: 'İstanbul',
      date: new Date().toISOString().split('T')[0],
      scheduledStart: '10:00',
      scheduledEnd: '18:00',
      checkIn: '10:05',
      checkOut: '18:00',
      checkInStatus: 'done',
      checkOutStatus: 'done',
    },
  ]);

  const filteredRecords = records.filter(record => {
    if (canViewRegional) {
      return record.region === user?.region;
    }
    return record.employeeId === user?.id;
  });

  const todayRecord = records.find(
    r => r.employeeId === user?.id && r.date === new Date().toISOString().split('T')[0]
  );

  const handleCheckIn = (status: 'done' | 'not_done') => {
    if (!todayRecord) return;

    if (status === 'not_done' && !reason.trim()) {
      Alert.alert('Hata', 'Lütfen bir sebep girin');
      return;
    }

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const updatedRecords = records.map(r =>
      r.id === todayRecord.id
        ? {
            ...r,
            checkIn: status === 'done' ? timeString : undefined,
            checkInStatus: status,
            checkInReason: status === 'not_done' ? reason : undefined,
          }
        : r
    );

    setRecords(updatedRecords);
    sendCheckInNotification(
      `${user?.firstName} ${user?.lastName}`,
      status,
      status === 'not_done' ? reason : undefined
    );

    setShowModal(false);
    setReason('');
    Alert.alert('Başarılı', status === 'done' ? 'Giriş yapıldı' : 'Giriş yapılamadı kaydedildi');
  };

  const handleCheckOut = (status: 'done' | 'not_done') => {
    if (!todayRecord) return;

    if (status === 'not_done' && !reason.trim()) {
      Alert.alert('Hata', 'Lütfen bir sebep girin');
      return;
    }

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const updatedRecords = records.map(r =>
      r.id === todayRecord.id
        ? {
            ...r,
            checkOut: status === 'done' ? timeString : undefined,
            checkOutStatus: status,
            checkOutReason: status === 'not_done' ? reason : undefined,
          }
        : r
    );

    setRecords(updatedRecords);
    sendCheckOutNotification(
      `${user?.firstName} ${user?.lastName}`,
      status,
      status === 'not_done' ? reason : undefined
    );

    setShowModal(false);
    setReason('');
    Alert.alert('Başarılı', status === 'done' ? 'Çıkış yapıldı' : 'Çıkış yapılamadı kaydedildi');
  };

  const openModal = (type: 'checkIn' | 'checkOut') => {
    setModalType(type);
    setShowModal(true);
  };

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: IMAGES.backgroundLogo }} 
        style={styles.backgroundLogo}
        resizeMode="contain"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {todayRecord && canCreate && (
          <View style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <Clock size={24} color={colors.primary} />
              <Text style={styles.todayTitle}>Bugünkü Vardiya</Text>
            </View>

            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Planlanan Saat:</Text>
              <Text style={styles.timeValue}>
                {todayRecord.scheduledStart} - {todayRecord.scheduledEnd}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  todayRecord.checkInStatus !== 'pending' && styles.actionButtonDisabled,
                ]}
                onPress={() => openModal('checkIn')}
                disabled={todayRecord.checkInStatus !== 'pending'}
              >
                <Clock size={20} color={colors.white} />
                <Text style={styles.actionButtonText}>
                  {todayRecord.checkInStatus === 'pending' ? 'Giriş Yap' : 'Giriş Yapıldı'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  (todayRecord.checkOutStatus !== 'pending' || todayRecord.checkInStatus === 'pending') &&
                    styles.actionButtonDisabled,
                ]}
                onPress={() => openModal('checkOut')}
                disabled={
                  todayRecord.checkOutStatus !== 'pending' || todayRecord.checkInStatus === 'pending'
                }
              >
                <Clock size={20} color={colors.white} />
                <Text style={styles.actionButtonText}>
                  {todayRecord.checkOutStatus === 'pending' ? 'Çıkış Yap' : 'Çıkış Yapıldı'}
                </Text>
              </TouchableOpacity>
            </View>

            {todayRecord.checkIn && (
              <View style={styles.statusCard}>
                <Check size={20} color={colors.success} />
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Giriş Saati</Text>
                  <Text style={styles.statusValue}>{todayRecord.checkIn}</Text>
                </View>
              </View>
            )}

            {todayRecord.checkInStatus === 'not_done' && (
              <View style={[styles.statusCard, styles.errorCard]}>
                <AlertCircle size={20} color={colors.error} />
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Giriş Yapılamadı</Text>
                  <Text style={styles.statusValue}>{todayRecord.checkInReason}</Text>
                </View>
              </View>
            )}

            {todayRecord.checkOut && (
              <View style={styles.statusCard}>
                <Check size={20} color={colors.success} />
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Çıkış Saati</Text>
                  <Text style={styles.statusValue}>{todayRecord.checkOut}</Text>
                </View>
              </View>
            )}

            {todayRecord.checkOutStatus === 'not_done' && (
              <View style={[styles.statusCard, styles.errorCard]}>
                <AlertCircle size={20} color={colors.error} />
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Çıkış Yapılamadı</Text>
                  <Text style={styles.statusValue}>{todayRecord.checkOutReason}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>{canViewRegional ? 'Bölge Kayıtları' : 'Geçmiş Kayıtlar'}</Text>
          {filteredRecords.filter(r => !(r.employeeId === user?.id && r.date === new Date().toISOString().split('T')[0])).map(record => (
            <View key={record.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyLeftSection}>
                  <Text style={styles.historyEmployeeName}>{record.employeeName}</Text>
                  <Text style={styles.historyDate}>{new Date(record.date).toLocaleDateString('tr-TR')}</Text>
                  {canViewRegional && (
                    <View style={styles.storeInfo}>
                      <StoreIcon size={12} color={colors.primary} />
                      <Text style={styles.storeText}>{record.store}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.historyTime}>
                  {record.scheduledStart} - {record.scheduledEnd}
                </Text>
              </View>
              <View style={styles.historyDetails}>
                {record.checkIn && (
                  <View style={styles.historyItem}>
                    <Check size={16} color={colors.success} />
                    <Text style={styles.historyLabel}>Giriş: {record.checkIn}</Text>
                  </View>
                )}
                {record.checkOut && (
                  <View style={styles.historyItem}>
                    <Check size={16} color={colors.success} />
                    <Text style={styles.historyLabel}>Çıkış: {record.checkOut}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'checkIn' ? 'Giriş Yap' : 'Çıkış Yap'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              {modalType === 'checkIn' ? 'Vardiyaya giriş yapıyor musunuz?' : 'Vardiyadan çıkış yapıyor musunuz?'}
            </Text>

            <TouchableOpacity
              style={styles.successButton}
              onPress={() => (modalType === 'checkIn' ? handleCheckIn('done') : handleCheckOut('done'))}
            >
              <Check size={20} color={colors.white} />
              <Text style={styles.successButtonText}>Evet, {modalType === 'checkIn' ? 'Giriş' : 'Çıkış'} Yaptım</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.reasonInput}
              placeholder="Sebep girin..."
              value={reason}
              onChangeText={setReason}
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.errorButton}
              onPress={() => (modalType === 'checkIn' ? handleCheckIn('not_done') : handleCheckOut('not_done'))}
            >
              <AlertCircle size={20} color={colors.white} />
              <Text style={styles.errorButtonText}>
                {modalType === 'checkIn' ? 'Giriş' : 'Çıkış'} Yapamadım
              </Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  todayCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  timeLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.success + '10',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorCard: {
    backgroundColor: colors.error + '10',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  historySection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.gray[900],
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  historyTime: {
    fontSize: 14,
    color: colors.gray[600],
  },
  historyDetails: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyLabel: {
    fontSize: 14,
    color: colors.gray[700],
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  modalDescription: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 20,
    textAlign: 'center',
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
  },
  successButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[300],
  },
  dividerText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  reasonInput: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
  },
  errorButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  historyLeftSection: {
    flex: 1,
    gap: 4,
  },
  historyEmployeeName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500' as const,
  },
});
