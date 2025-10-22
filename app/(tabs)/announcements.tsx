import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal, Pressable, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';

import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { Plus, Search, Edit, Trash2, Send, X, Play } from 'lucide-react-native';
import { Announcement } from '@/types';
import { sendAnnouncementNotification } from '@/utils/notifications';

const { width, height } = Dimensions.get('window');

function VideoPlayerComponent({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, player => {
    player.play();
  });

  return (
    <VideoView
      style={styles.fullMediaVideo}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

export default function AnnouncementsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMediaFiles, setNewMediaFiles] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const canManage = user?.position === 'egitmen' || 
    user?.position === 'egitim_muduru' || 
    user?.position === 'insan_kaynaklari';

  const mockAnnouncements: Announcement[] = [
    {
      id: '1',
      title: 'Haftalık Toplantı',
      content: 'Bu hafta Cuma günü saat 15:00\'de tüm personel toplantısı yapılacaktır. Lütfen katılımınızı sağlayın.',
      createdBy: '1',
      createdByName: 'Ahmet Yılmaz',
      createdAt: new Date().toISOString(),
      media: [
        { id: '1', uri: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800', type: 'image' },
      ],
    },
    {
      id: '2',
      title: 'Yeni Menü Güncellemesi',
      content: 'Mevsimlik içecek menümüz güncellendi. Lütfen yeni tarifleri ve fiyatlandırmaları inceleyin.',
      createdBy: '2',
      createdByName: 'Ayşe Demir',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      media: [
        { id: '2', uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', type: 'video', thumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400' },
      ],
    },
    {
      id: '3',
      title: 'Hijyen Eğitimi',
      content: 'Gelecek hafta Pazartesi günü hijyen ve gıda güvenliği eğitimi yapılacaktır.',
      createdBy: '1',
      createdByName: 'Ahmet Yılmaz',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  useEffect(() => {
    loadAnnouncements();
  }, [mockAnnouncements]);

  const loadAnnouncements = async () => {
    try {
      const stored = await AsyncStorage.getItem('@mikel_announcements');
      if (stored) {
        const parsedAnnouncements = JSON.parse(stored);
        console.log('✅ Duyurular yüklendi:', parsedAnnouncements.length);
        setAnnouncements(parsedAnnouncements);
      } else {
        console.log('📄 Henüz duyuru yok, mock veriler gösteriliyor');
        setAnnouncements(mockAnnouncements);
      }
    } catch (error) {
      console.log('❌ Duyurular yüklenirken hata:', error);
      setAnnouncements(mockAnnouncements);
    }
  };

  const saveAnnouncements = async (newAnnouncements: Announcement[]) => {
    try {
      await AsyncStorage.setItem('@mikel_announcements', JSON.stringify(newAnnouncements));
      console.log('💾 Duyurular kaydedildi:', newAnnouncements.length);
      setAnnouncements(newAnnouncements);
    } catch (error) {
      console.log('❌ Duyurular kaydedilirken hata:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Az önce';
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const handlePickMedia = async () => {
    Alert.alert(
      'Medya Ekle',
      'Ne eklemek istersiniz?',
      [
        {
          text: 'Fotoğraf',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled) {
              setNewMediaFiles([...newMediaFiles, { uri: result.assets[0].uri, type: 'image' }]);
            }
          },
        },
        {
          text: 'Video',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Videos,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled) {
              setNewMediaFiles([...newMediaFiles, { uri: result.assets[0].uri, type: 'video' }]);
            }
          },
        },
        { text: 'İptal', style: 'cancel' },
      ]
    );
  };

  const handleCreateAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Hata', 'Lütfen başlık ve içerik girin');
      return;
    }

    const createdByName = `${user?.firstName} ${user?.lastName}`;
    
    if (editingAnnouncement) {
      const updatedAnnouncement: Announcement = {
        ...editingAnnouncement,
        title: newTitle,
        content: newContent,
        media: newMediaFiles.map((file, idx) => ({
          id: `${Date.now()}-${idx}`,
          uri: file.uri,
          type: file.type,
        })),
      };
      
      const updated = announcements.map(a => 
        a.id === editingAnnouncement.id ? updatedAnnouncement : a
      );
      await saveAnnouncements(updated);
      Alert.alert('Başarılı', 'Duyuru güncellendi');
    } else {
      const newAnnouncement: Announcement = {
        id: Date.now().toString(),
        title: newTitle,
        content: newContent,
        createdBy: user?.id || '',
        createdByName,
        createdAt: new Date().toISOString(),
        media: newMediaFiles.map((file, idx) => ({
          id: `${Date.now()}-${idx}`,
          uri: file.uri,
          type: file.type,
        })),
      };

      await saveAnnouncements([newAnnouncement, ...announcements]);
      await sendAnnouncementNotification(newTitle, createdByName);
      Alert.alert('Başarılı', 'Duyuru paylaşıldı ve bildirim gönderildi');
    }
    
    setShowCreateModal(false);
    setNewTitle('');
    setNewContent('');
    setNewMediaFiles([]);
    setEditingAnnouncement(null);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setNewTitle(announcement.title);
    setNewContent(announcement.content);
    setNewMediaFiles(announcement.media?.map(m => ({ uri: m.uri, type: m.type })) || []);
    setShowCreateModal(true);
  };

  const handleDeleteAnnouncement = (id: string) => {
    Alert.alert(
      'Duyuruyu Sil',
      'Bu duyuruyu silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const updated = announcements.filter(a => a.id !== id);
            await saveAnnouncements(updated);
            Alert.alert('Başarılı', 'Duyuru silindi');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: IMAGES.backgroundLogo }} 
        style={styles.backgroundLogo}
        resizeMode="contain"
      />
      <View style={styles.headerWrapper}>
        <View style={[styles.headerBackground, { height: insets.top }]} />
        <View style={styles.header}>
        <Image 
          source={{ uri: IMAGES.logo }} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Duyurular</Text>
        {canManage && (
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color={colors.white} />
            <Text style={styles.createButtonText}>Yeni</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Duyuru ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {announcements.map((announcement) => (
          <View key={announcement.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {announcement.createdByName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{announcement.createdByName}</Text>
                  <Text style={styles.dateText}>{formatDate(announcement.createdAt)}</Text>
                </View>
              </View>
              {canManage && (
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditAnnouncement(announcement)}
                  >
                    <Edit size={18} color={colors.info} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteAnnouncement(announcement.id)}
                  >
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.announcementTitle}>{announcement.title}</Text>
            <Text style={styles.announcementContent}>{announcement.content}</Text>

            {announcement.media && announcement.media.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.mediaScroll}
                contentContainerStyle={styles.mediaScrollContent}
              >
                {announcement.media.map((media) => (
                  <TouchableOpacity
                    key={media.id}
                    style={styles.mediaThumbnail}
                    onPress={() => setSelectedMedia({ uri: media.uri, type: media.type })}
                  >
                    {media.type === 'image' ? (
                      <Image source={{ uri: media.uri }} style={styles.mediaImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.videoThumbnailContainer}>
                        <Image source={{ uri: media.thumbnail || media.uri }} style={styles.mediaImage} resizeMode="cover" />
                        <View style={styles.playIconOverlay}>
                          <Play size={32} color={colors.white} fill={colors.white} />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.cardFooter}>
              <View style={styles.badge}>
                <Send size={12} color={colors.primary} />
                <Text style={styles.badgeText}>Tüm Personele Gönderildi</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={selectedMedia !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMedia(null)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedMedia(null)} />
          <View style={styles.mediaModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedMedia(null)}
            >
              <X size={24} color={colors.white} />
            </TouchableOpacity>
            {selectedMedia?.type === 'image' ? (
              <Image
                source={{ uri: selectedMedia.uri }}
                style={styles.fullMediaImage}
                resizeMode="contain"
              />
            ) : selectedMedia?.type === 'video' ? (
              <VideoPlayerComponent uri={selectedMedia.uri} />
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAnnouncement ? 'Duyuruyu Düzenle' : 'Yeni Duyuru'}</Text>
              <TouchableOpacity onPress={() => {
                setShowCreateModal(false);
                setEditingAnnouncement(null);
                setNewTitle('');
                setNewContent('');
                setNewMediaFiles([]);
              }}>
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Başlık"
                value={newTitle}
                onChangeText={setNewTitle}
                placeholderTextColor={colors.gray[400]}
              />

              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                placeholder="İçerik"
                value={newContent}
                onChangeText={setNewContent}
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={5}
              />

              <TouchableOpacity
                style={styles.mediaButton}
                onPress={handlePickMedia}
              >
                <Plus size={20} color={colors.primary} />
                <Text style={styles.mediaButtonText}>Fotoğraf/Video Ekle</Text>
              </TouchableOpacity>

              {newMediaFiles.length > 0 && (
                <View style={styles.previewContainer}>
                  {newMediaFiles.map((file, idx) => (
                    <View key={idx} style={styles.previewItem}>
                      <Image source={{ uri: file.uri }} style={styles.previewImage} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={() => setNewMediaFiles(newMediaFiles.filter((_, i) => i !== idx))}
                      >
                        <X size={16} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitButton, (!newTitle.trim() || !newContent.trim()) && styles.submitButtonDisabled]}
              onPress={handleCreateAnnouncement}
              disabled={!newTitle.trim() || !newContent.trim()}
            >
              <Text style={styles.submitButtonText}>{editingAnnouncement ? 'Güncelle' : 'Paylaş'}</Text>
            </TouchableOpacity>
          </View>
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
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[900],
  },
  dateText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.gray[900],
    marginBottom: 8,
  },
  announcementContent: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '500' as const,
  },
  mediaScroll: {
    marginTop: 12,
    marginBottom: 8,
  },
  mediaScrollContent: {
    gap: 12,
  },
  mediaThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray[200],
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnailContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  mediaModalContent: {
    width: width - 40,
    height: height - 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullMediaImage: {
    width: '100%',
    height: '100%',
  },
  fullMediaVideo: {
    width: '100%',
    height: '100%',
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 12,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  mediaButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  previewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  previewItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
});
