import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useTheme } from '@providers/ThemeProvider';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { diaryPhotoService } from '@/features/diary/services/DiaryPhotoService';
import { useTranslation } from '@/localization/i18n';

type ImagePickerModule = typeof import('expo-image-picker');

interface DiaryPhotoStripProps {
  readonly photos: DiaryPhoto[];
  readonly onChange?: (photos: DiaryPhoto[]) => void;
  readonly editable?: boolean;
}

export function DiaryPhotoStrip({ photos, onChange, editable = true }: DiaryPhotoStripProps) {
  const theme = useTheme();
  const t = useTranslation();
  const [isPicking, setIsPicking] = useState(false);

  if (!editable && photos.length === 0) return null;

  const loadImagePicker = async (): Promise<ImagePickerModule | null> => {
    try {
      return await import('expo-image-picker');
    } catch {
      Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoNativeModuleMissingMessage'));
      return null;
    }
  };

  const importAssets = async (assets: ImagePickerAsset[]) => {
    setIsPicking(true);
    try {
      const imported = await Promise.all(assets.map((asset) => diaryPhotoService.importAsset(asset)));
      onChange?.([...photos, ...imported]);
    } catch {
      Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage'));
    } finally {
      setIsPicking(false);
    }
  };

  const handleTakePhoto = async () => {
    const ImagePicker = await loadImagePicker();
    if (!ImagePicker) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('entryPhotoPermissionTitle'), t('entryCameraPermissionMessage'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
      exif: false,
    });
    if (!result.canceled) await importAssets(result.assets);
  };

  const handleChoosePhoto = async () => {
    const ImagePicker = await loadImagePicker();
    if (!ImagePicker) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
    if (!permission.granted) {
      Alert.alert(t('entryPhotoPermissionTitle'), t('entryPhotoLibraryPermissionMessage'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
      allowsMultipleSelection: true,
      exif: false,
    });
    if (!result.canceled) await importAssets(result.assets);
  };

  const handleRemove = (photoId: string) => {
    onChange?.(photos.filter((photo) => photo.id !== photoId));
  };

  return (
    <View style={editable ? styles.editorWrap : styles.viewerWrap} accessibilityLabel={t('entryPhotosA11y')}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.row}>
        {editable ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              onPress={handleTakePhoto}
              disabled={isPicking}
              accessibilityRole="button"
              accessibilityLabel={t('entryTakePhotoA11y')}
            >
              <MaterialCommunityIcons name="camera-outline" size={21} color={theme.colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              onPress={handleChoosePhoto}
              disabled={isPicking}
              accessibilityRole="button"
              accessibilityLabel={t('entryChoosePhotoA11y')}
            >
              <MaterialCommunityIcons name="image-outline" size={21} color={theme.colors.tint} />
            </TouchableOpacity>
          </>
        ) : null}
        {photos.map((photo, index) => (
          <View key={photo.id} style={editable ? styles.thumbWrap : styles.viewerThumbWrap}>
            <Image
              source={{ uri: photo.uri }}
              style={editable ? styles.thumb : styles.viewerThumb}
              resizeMode="cover"
              accessibilityRole="image"
              accessibilityLabel={`${t('entryPhotoA11y')} ${index + 1}`}
            />
            {editable ? (
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: theme.colors.background }]}
                onPress={() => handleRemove(photo.id)}
                accessibilityRole="button"
                accessibilityLabel={t('entryRemovePhotoA11y')}
              >
                <MaterialCommunityIcons name="close" size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  editorWrap: {
    marginTop: 4,
    marginBottom: 10,
  },
  viewerWrap: {
    marginBottom: 16,
  },
  row: {
    alignItems: 'center',
    gap: 8,
    paddingRight: 2,
  },
  actionButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumbWrap: {
    width: 58,
    height: 58,
    borderRadius: 8,
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 8,
  },
  viewerThumbWrap: {
    width: 164,
    height: 116,
    borderRadius: 8,
  },
  viewerThumb: {
    width: 164,
    height: 116,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
});
