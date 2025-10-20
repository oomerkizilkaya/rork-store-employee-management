import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { Plus, Clock, CheckCircle, XCircle, X, Calendar as CalendarIcon, Store as StoreIcon, User as UserIcon } from 'lucide-react-native';
import { useState } from 'react';
import { sendOvertimeSubmittedNotification, sendOvertimeStatusNotification } from '@/utils/notifications';
import { OvertimeRequest } from '@/types';
import { canApproveOvertime, canCreateOvertime, canViewRegionalData } from '@/utils/permissions';

export default function OvertimeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [newRequestDate, setNewRequestDate] = useState('');
  const [newRequestHours, setNewRequestHours] = useState('');
  const [newRequestReason, setNewRequestReason] = useState('');

  const canApprove = user ? canApproveOvertime(user.position) : false;
  const canCreate = user ? canCreateOvertime(user.position) : true;
  const canViewRegional = user ? canViewRegionalData(user.position) : false;

  const [requests, setRequests] = useState<OvertimeRequest[]>([
    {
      id: '1',
      employeeId: '2',
      employeeName: 'Mehmet Yılmaz',
      storeId: '1',
      storeName: 'Kadıköy',
      region: 'İstanbul',
      date: '2025-01-20',
      hours: 4,
      reason: 'Envanter çalışması',
      status: 'pending' as const,
      requestedAt: new Date().toISOString(),
    },
    {
      id: '2',
      employeeId: '3',
      employeeName: 'Ayşe Kaya',
      storeId: '2',
      storeName: 'Beşiktaş',
      region: 'İstanbul',
      date: '2025-01-22',
      hours: 3,
      reason: 'Özel etkinlik',
      status: 'approved' as const,
      requestedAt: new Date().toISOString(),
      reviewedBy: user?.id,
      reviewedByName: user ? `${user.firstName} ${user.lastName}` : undefined,
      reviewedAt: new Date().toISOString(),
    },
  ]);

  const filteredRequests = requests.filter(req => {
    if (canViewRegional) {
      return req.region === user?.region;
    }
    if (canApprove) {
      return req.storeName === user?.store;
    }
    return req.employeeId === user?.id;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      default: return colors.warning;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      default: return 'Beklemede';
    }
  };

  const handleCreateRequest = async () => {
    Keyboard.dismiss();
    
    if (!newRequestDate || !newRequestHours || !newRequestReason) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    const hours = parseFloat(newRequestHours);
    if (isNaN(hours) || hours <= 0 || hours > 12) {
      Alert.alert('Hata', 'Lütfen geçerli bir saat değeri girin (1-12 arası)');
      return;
    }

    const newRequest: OvertimeRequest = {
      id: Date.now().toString(),
      employeeId: user?.id || '',
      employeeName: user ? `${user.firstName} ${user.lastName}` : 'Bilinmeyen',
      storeId: user?.store || '',
      storeName: user?.store || 'Bilinmeyen',
      region: user?.region,
      date: newRequestDate,
      hours: hours,
      reason: newRequestReason,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    setRequests([newRequest, ...requests]);
    setModalVisible(false);
    setNewRequestDate('');
    setNewRequestHours('');
    setNewRequestReason('');
    
    await sendOvertimeSubmittedNotification(
      newRequest.employeeName,
      newRequest.hours,
      new Date(newRequest.date).toLocaleDateString('tr-TR'),
      user?.store || 'Bilinmeyen Mağaza'
    );
    
    Alert.alert('Başarılı', 'Extra mesai talebiniz oluşturuldu ve müdürünüze bildirim gönderildi');
  };

  const handleApprove = async (id: string) => {
    const request = requests.find(req => req.id === id);
    if (!request) return;
    
    setRequests(requests.map(req => 
      req.id === id ? { 
        ...req, 
        status: 'approved' as const,
        reviewedBy: user?.id,
        reviewedByName: user ? `${user.firstName} ${user.lastName}` : undefined,
        reviewedAt: new Date().toISOString(),
      } : req
    ));
    
    await sendOvertimeStatusNotification(
      'approved',
      request.hours,
      new Date(request.date).toLocaleDateString('tr-TR')
    );
    
    Alert.alert('Başarılı', 'Talep onaylandı ve çalışana bildirim gönderildi');
  };

  const handleReject = async (id: string) => {
    const request = requests.find(req => req.id === id);
    if (!request) return;
    
    setRequests(requests.map(req => 
      req.id === id ? { 
        ...req, 
        status: 'rejected' as const,
        reviewedBy: user?.id,
        reviewedByName: user ? `${user.firstName} ${user.lastName}` : undefined,
        reviewedAt: new Date().toISOString(),
      } : req
    ));
    
    await sendOvertimeStatusNotification(
      'rejected',
      request.hours,
      new Date(request.date).toLocaleDateString('tr-TR')
    );
    
    Alert.alert('Başarılı', 'Talep reddedildi ve çalışana bildirim gönderildi');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={[styles.headerBackground, { height: insets.top }]} />
        <View style={styles.header}>
        <Image 
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/yk40w2bqfr6oa4yc8w2q3' }} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Extra Mesai</Text>
        {canCreate && (
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        )}
        </View>
      </View>

      <Image 
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/52mk5c717uw2fbnlwljam' }} 
        style={styles.backgroundLogo}
        resizeMode="contain"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredRequests.length === 0 && (
          <View style={styles.emptyState}>
            <Clock size={64} color={colors.gray[300]} />
            <Text style={styles.emptyText}>Extra mesai talebi bulunamadı</Text>
          </View>
        )}
        {filteredRequests.map((request) => (
          <View key={request.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.employeeName}>{request.employeeName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '15' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                  {getStatusText(request.status)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Clock size={16} color={colors.gray[500]} />
              <Text style={styles.infoText}>{request.hours} saat</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.dateText}>{new Date(request.date).toLocaleDateString('tr-TR')}</Text>
            </View>

            {canViewRegional && (
              <View style={styles.storeInfo}>
                <StoreIcon size={14} color={colors.primary} />
                <Text style={styles.storeText}>{request.storeName}</Text>
              </View>
            )}

            {request.reviewedByName && (
              <View style={styles.reviewInfo}>
                <UserIcon size={14} color={colors.gray[600]} />
                <Text style={styles.reviewText}>Onaylayan: {request.reviewedByName}</Text>
              </View>
            )}

            <Text style={styles.reason}>{request.reason}</Text>

            {canApprove && request.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(request.id)}
                >
                  <CheckCircle size={18} color={colors.white} />
                  <Text style={styles.actionButtonText}>Onayla</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(request.id)}
                >
                  <XCircle size={18} color={colors.white} />
                  <Text style={styles.actionButtonText}>Reddet</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Keyboard.dismiss();
          setModalVisible(false);
          setNewRequestDate('');
          setNewRequestHours('');
          setNewRequestReason('');
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setModalVisible(false);
            setNewRequestDate('');
            setNewRequestHours('');
            setNewRequestReason('');
          }}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <TouchableOpacity 
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Extra Mesai Talebi</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tarih (YYYY-MM-DD)</Text>
                <View style={styles.inputContainer}>
                  <CalendarIcon size={20} color={colors.gray[400]} />
                  <TextInput
                    style={styles.input}
                    value={newRequestDate}
                    onChangeText={setNewRequestDate}
                    placeholder="2025-01-20"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Saat Sayısı</Text>
                <View style={styles.inputContainer}>
                  <Clock size={20} color={colors.gray[400]} />
                  <TextInput
                    style={styles.input}
                    value={newRequestHours}
                    onChangeText={setNewRequestHours}
                    placeholder="4"
                    keyboardType="numeric"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Açıklama</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newRequestReason}
                  onChangeText={setNewRequestReason}
                  placeholder="Neden extra mesai yapıyorsunuz?"
                  placeholderTextColor={colors.gray[400]}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleCreateRequest}
              >
                <Text style={styles.submitButtonText}>Oluştur</Text>
              </TouchableOpacity>
            </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  headerLogo: {
    width: 36,
    height: 36,
  },
  title: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  createButton: {
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
    paddingHorizontal: 20,
    paddingBottom: 100,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  dateText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '500' as const,
  },
  reason: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 4,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  modalBody: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[900],
    paddingVertical: 14,
  },
  textArea: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray[100],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.gray[700],
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[600],
    marginTop: 16,
    textAlign: 'center',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  storeText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  reviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 12,
    color: colors.gray[600],
  },
});
