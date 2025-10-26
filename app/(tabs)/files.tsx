import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions, Image, Pressable, Alert, Keyboard, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '@/constants/colors';
import { Video, Image as ImageIcon, FileText, ChefHat, Download, X, Play, Plus } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

type Category = 'videos' | 'photos' | 'documents' | 'recipes';

const { width, height } = Dimensions.get('window');

function VideoPlayerComponent({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, player => {
    player.play();
  });

  return (
    <VideoView
      style={styles.videoPlayer}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

export default function FilesScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<Category>('videos');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const canShare = user?.position === 'egitmen' || user?.position === 'egitim_muduru';
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadNote, setUploadNote] = useState('');

  const [uploadedFiles, setUploadedFiles] = useState<{
    videos: { id: string; name: string; size: string; url: string; thumbnail: string; uploadedBy?: string; uploadDate?: string; title?: string; note?: string }[];
    photos: { id: string; name: string; size: string; url: string; uploadedBy?: string; uploadDate?: string; title?: string; note?: string }[];
    documents: { id: string; name: string; size: string; uploadedBy?: string; uploadDate?: string; title?: string; note?: string }[];
    recipes: { id: string; name: string; size: string; url: string; thumbnail: string; uploadedBy?: string; uploadDate?: string; title?: string; note?: string }[];
  }>({
    videos: [],
    photos: [],
    documents: [],
    recipes: [],
  });

  useEffect(() => {
    loadUploadedFiles();
  }, []);

  const loadUploadedFiles = async () => {
    try {
      const stored = await AsyncStorage.getItem('@mikel_uploaded_files');
      if (stored) {
        const parsedFiles = JSON.parse(stored);
        console.log('✅ Dosyalar yüklendi');
        setUploadedFiles(parsedFiles);
      } else {
        console.log('📄 Henüz yüklenmiş dosya yok');
      }
    } catch (error) {
      console.log('❌ Dosyalar yüklenirken hata:', error);
    }
  };

  const saveUploadedFiles = async (files: typeof uploadedFiles) => {
    try {
      await AsyncStorage.setItem('@mikel_uploaded_files', JSON.stringify(files));
      console.log('💾 Dosyalar kaydedildi');
      setUploadedFiles(files);
    } catch (error) {
      console.log('❌ Dosyalar kaydedilirken hata:', error);
    }
  };

  const categories = [
    { id: 'videos' as Category, label: 'Videolar', icon: Video },
    { id: 'photos' as Category, label: 'Fotoğraflar', icon: ImageIcon },
    { id: 'documents' as Category, label: 'Belgeler', icon: FileText },
    { id: 'recipes' as Category, label: 'Reçeteler', icon: ChefHat },
  ];

  const handleUpload = async () => {
    Keyboard.dismiss();
    
    Alert.alert(
      'Dosya Yükle',
      'Ne tür dosya yüklemek istersiniz?',
      [
        {
          text: 'Video',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: false,
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setIsUploading(true);
                const asset = result.assets[0];
                const newFile = {
                  id: Date.now().toString(),
                  name: uploadTitle || asset.fileName || 'Video',
                  size: asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'N/A',
                  url: asset.uri,
                  thumbnail: asset.uri,
                  uploadedBy: `${user?.firstName} ${user?.lastName}` || 'Bilinmeyen',
                  uploadDate: new Date().toISOString(),
                  title: uploadTitle,
                  note: uploadNote,
                };
                const updated = {
                  ...uploadedFiles,
                  videos: [newFile, ...uploadedFiles.videos],
                };
                await saveUploadedFiles(updated);
                setTimeout(() => {
                  setIsUploading(false);
                  Alert.alert('Başarılı', 'Video yüklendi!');
                  setShowUploadModal(false);
                  setUploadTitle('');
                  setUploadNote('');
                }, 1500);
              }
            } catch (error) {
              console.log('Video upload error:', error);
              Alert.alert('Hata', 'Video yüklenirken bir hata oluştu.');
              setIsUploading(false);
            }
          },
        },
        {
          text: 'Fotoğraf',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setIsUploading(true);
                const asset = result.assets[0];
                const newFile = {
                  id: Date.now().toString(),
                  name: uploadTitle || asset.fileName || 'Fotoğraf.jpg',
                  size: asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'N/A',
                  url: asset.uri,
                  uploadedBy: `${user?.firstName} ${user?.lastName}` || 'Bilinmeyen',
                  uploadDate: new Date().toISOString(),
                  title: uploadTitle,
                  note: uploadNote,
                };
                const updated = {
                  ...uploadedFiles,
                  photos: [newFile, ...uploadedFiles.photos],
                };
                await saveUploadedFiles(updated);
                setTimeout(() => {
                  setIsUploading(false);
                  Alert.alert('Başarılı', 'Fotoğraf yüklendi!');
                  setShowUploadModal(false);
                  setUploadTitle('');
                  setUploadNote('');
                }, 1500);
              }
            } catch (error) {
              console.log('Photo upload error:', error);
              Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu.');
              setIsUploading(false);
            }
          },
        },
        {
          text: 'Belge',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
              });
              if (result.assets && result.assets.length > 0) {
                setIsUploading(true);
                const asset = result.assets[0];
                const newFile = {
                  id: Date.now().toString(),
                  name: uploadTitle || asset.name,
                  size: asset.size ? `${(asset.size / 1024).toFixed(0)} KB` : 'N/A',
                  uploadedBy: `${user?.firstName} ${user?.lastName}` || 'Bilinmeyen',
                  uploadDate: new Date().toISOString(),
                  title: uploadTitle,
                  note: uploadNote,
                };
                const updated = {
                  ...uploadedFiles,
                  documents: [newFile, ...uploadedFiles.documents],
                };
                await saveUploadedFiles(updated);
                setTimeout(() => {
                  setIsUploading(false);
                  Alert.alert('Başarılı', 'Belge yüklendi!');
                  setShowUploadModal(false);
                  setUploadTitle('');
                  setUploadNote('');
                }, 1500);
              }
            } catch (error) {
              console.log('Document upload error:', error);
              Alert.alert('Hata', 'Belge yüklenirken bir hata oluştu.');
              setIsUploading(false);
            }
          },
        },
        {
          text: 'Reçete',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: false,
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setIsUploading(true);
                const asset = result.assets[0];
                const newFile = {
                  id: Date.now().toString(),
                  name: uploadTitle || asset.fileName || 'Reçete',
                  size: asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'N/A',
                  url: asset.uri,
                  thumbnail: asset.uri,
                  uploadedBy: `${user?.firstName} ${user?.lastName}` || 'Bilinmeyen',
                  uploadDate: new Date().toISOString(),
                  title: uploadTitle,
                  note: uploadNote,
                };
                const updated = {
                  ...uploadedFiles,
                  recipes: [newFile, ...uploadedFiles.recipes],
                };
                await saveUploadedFiles(updated);
                setTimeout(() => {
                  setIsUploading(false);
                  Alert.alert('Başarılı', 'Reçete yüklendi!');
                  setShowUploadModal(false);
                  setUploadTitle('');
                  setUploadNote('');
                }, 1500);
              }
            } catch (error) {
              console.log('Recipe upload error:', error);
              Alert.alert('Hata', 'Reçete yüklenirken bir hata oluştu.');
              setIsUploading(false);
            }
          },
        },
        { text: 'İptal', style: 'cancel' },
      ]
    );
  };

  const mockFiles = {
    videos: [
      { id: '1', name: 'Kahve Hazırlama Teknikleri.mp4', size: '24 MB', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnail: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400' },
      { id: '2', name: 'Müşteri İlişkileri.mp4', size: '18 MB', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', thumbnail: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400' },
      { id: '3', name: 'Latte Art Teknikleri.mp4', size: '32 MB', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400' },
    ],
    photos: [
      { id: '1', name: 'Yeni Menü Fotoğrafları.jpg', size: '2.4 MB', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800' },
      { id: '2', name: 'Mağaza Görselleri.jpg', size: '3.1 MB', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800' },
      { id: '3', name: 'Kahve Sunumları.jpg', size: '1.8 MB', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800' },
      { id: '4', name: 'Takım Fotoğrafları.jpg', size: '2.9 MB', url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800' },
    ],
    documents: [
      { id: '1', name: 'Çalışan El Kitabı.pdf', size: '1.2 MB' },
      { id: '2', name: 'Hijyen Kuralları.pdf', size: '850 KB' },
    ],
    recipes: [
      { id: '1', name: 'Latte Reçetesi.mp4', size: '12 MB', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400' },
      { id: '2', name: 'Cappuccino Reçetesi.mp4', size: '15 MB', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' },
      { id: '3', name: 'Espresso Teknikleri.mp4', size: '18 MB', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnail: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400' },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={[styles.headerBackground, { height: insets.top }]} />
        <View style={styles.header}>
        <Text style={styles.pageTitle}>Dosyalar</Text>
        {canShare && (
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={() => setShowUploadModal(true)}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        )}
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryButton, isSelected && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Icon size={20} color={isSelected ? colors.white : colors.primary} />
              <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {selectedCategory === 'videos' && (
          <View style={styles.gridContainer}>
            {[...uploadedFiles.videos, ...mockFiles.videos].map((file) => (
              <TouchableOpacity
                key={file.id}
                style={styles.videoCard}
                onPress={() => setSelectedVideo(file.url)}
              >
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: file.thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.playOverlay}>
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.gradientOverlay}
                    />
                    <View style={styles.playButton}>
                      <Play size={28} color={colors.white} fill={colors.white} />
                    </View>
                  </View>
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{file.name}</Text>
                  <Text style={styles.videoSize}>{file.size}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedCategory === 'photos' && (
          <View style={styles.gridContainer}>
            {[...uploadedFiles.photos, ...mockFiles.photos].map((file) => (
              <TouchableOpacity
                key={file.id}
                style={styles.photoCard}
                onPress={() => setSelectedImage(file.url)}
              >
                <Image
                  source={{ uri: file.url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.photoGradient}
                >
                  <Text style={styles.photoName} numberOfLines={1}>{file.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedCategory === 'documents' && (
          <View>
            {[...uploadedFiles.documents, ...mockFiles.documents].map((file) => (
              <View key={file.id} style={styles.fileCard}>
                <View style={styles.fileInfo}>
                  <LinearGradient
                    colors={colors.gradient.blue as any}
                    style={styles.fileIconContainer}
                  >
                    <FileText size={24} color={colors.white} />
                  </LinearGradient>
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{file.name}</Text>
                    <Text style={styles.fileSize}>{file.size}</Text>
                  </View>
                </View>
                {canShare && (
                  <TouchableOpacity style={styles.downloadButton}>
                    <Download size={20} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {selectedCategory === 'recipes' && (
          <View style={styles.gridContainer}>
            {[...uploadedFiles.recipes, ...mockFiles.recipes].map((file) => (
              <TouchableOpacity
                key={file.id}
                style={styles.videoCard}
                onPress={() => setSelectedVideo(file.url)}
              >
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: file.thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.playOverlay}>
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.gradientOverlay}
                    />
                    <View style={styles.playButton}>
                      <Play size={28} color={colors.white} fill={colors.white} />
                    </View>
                  </View>
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{file.name}</Text>
                  <Text style={styles.videoSize}>{file.size}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={selectedVideo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedVideo(null)} />
          <View style={styles.videoModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedVideo(null)}
            >
              <X size={24} color={colors.white} />
            </TouchableOpacity>
            {selectedVideo && (
              <VideoPlayerComponent uri={selectedVideo} />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedImage(null)} />
          <View style={styles.imageModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <X size={24} color={colors.white} />
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showUploadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => {
            Keyboard.dismiss();
            setShowUploadModal(false);
          }} />
          <View style={styles.uploadModalContent}>
            <View style={styles.uploadModalHeader}>
              <Text style={styles.uploadModalTitle}>Dosya Yükle</Text>
              <TouchableOpacity onPress={() => {
                setShowUploadModal(false);
                setUploadTitle('');
                setUploadNote('');
              }}>
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            {!isUploading && (
              <>
                <Text style={styles.inputLabel}>Başlık</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Dosya başlığı..."
                  placeholderTextColor={colors.gray[400]}
                  value={uploadTitle}
                  onChangeText={setUploadTitle}
                />
                <Text style={styles.inputLabel}>Not</Text>
                <TextInput
                  style={[styles.textInput, styles.textInputMultiline]}
                  placeholder="Açıklama veya notlar..."
                  placeholderTextColor={colors.gray[400]}
                  value={uploadNote}
                  onChangeText={setUploadNote}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.uploadModalButton}
                  onPress={handleUpload}
                >
                  <Text style={styles.uploadModalButtonText}>Dosya Seç</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.uploadModalButton, styles.uploadModalButtonSecondary]}
                  onPress={() => {
                    setShowUploadModal(false);
                    setUploadTitle('');
                    setUploadNote('');
                  }}
                >
                  <Text style={[styles.uploadModalButtonText, styles.uploadModalButtonTextSecondary]}>İptal</Text>
                </TouchableOpacity>
              </>
            )}
            {isUploading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.uploadModalText}>Yükleniyor...</Text>
                <Text style={styles.loadingText}>📤</Text>
              </View>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  uploadButton: {
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
  pageTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.gray[900],
    flex: 1,
  },
  categoriesScroll: {
    maxHeight: 56,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  categoryTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  fileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.gray[900],
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 13,
    color: colors.gray[500],
  },
  downloadButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  videoCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  thumbnailContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,107,157,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.gray[900],
    marginBottom: 4,
    lineHeight: 18,
  },
  videoSize: {
    fontSize: 11,
    color: colors.gray[500],
    fontWeight: '500' as const,
  },
  photoCard: {
    width: (width - 52) / 2,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 24,
  },
  photoName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.white,
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
  videoModalContent: {
    width: width - 40,
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  imageModalContent: {
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
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  uploadModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  uploadModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.gray[900],
  },
  uploadModalText: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 12,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.gray[700],
    marginBottom: 8,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.gray[900],
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 8,
  },
  textInputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  uploadModalButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  uploadModalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
  uploadModalButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[300],
    marginTop: 8,
  },
  uploadModalButtonTextSecondary: {
    color: colors.gray[700],
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 48,
  },
});
