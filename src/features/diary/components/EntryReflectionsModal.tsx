import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import type { Profile } from '@/features/profile/domain/Profile';
import type { DiaryEntry, DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { chooseDiaryPhoto } from '@/features/diary/services/DiaryPhotoPickerService';
import { diaryPhotoService, getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import { type TimeFormat } from '@/stores/useAppStore';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import { formatFriendlyTimestamp } from '@/shared/utils/timeFormat';

interface EntryReflectionsModalProps {
  readonly visible: boolean;
  readonly entry: DiaryEntry | null;
  readonly profile?: Pick<Profile, 'displayName' | 'avatarUri'> | null;
  readonly timeFormat: TimeFormat;
  readonly onDismiss: () => void;
  readonly onAddReflection: (entryId: string, text: string, photo?: DiaryPhoto) => Promise<boolean>;
  readonly onDeleteReflection: (entryId: string, reflectionId: string) => void;
}

export function EntryReflectionsModal({
  visible,
  entry,
  profile,
  timeFormat,
  onDismiss,
  onAddReflection,
  onDeleteReflection,
}: EntryReflectionsModalProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionPhoto, setReflectionPhoto] = useState<DiaryPhoto | undefined>();
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const friendlyTimestampLabels = useMemo(
    () => ({
      today: t('timeToday'),
      yesterday: t('timeYesterday'),
      todayAt: t('timeTodayAt'),
      yesterdayAt: t('timeYesterdayAt'),
      justNow: t('timeJustNow'),
      minutesAgo: t('timeMinutesAgoShort'),
      hoursAgo: t('timeHoursAgoShort'),
    }),
    [t],
  );
  const trimmedReflection = reflectionText.trim();

  const deletePendingPhoto = (photo: DiaryPhoto | undefined) => {
    if (!photo) return;
    void diaryPhotoService.deletePhoto(photo);
  };

  const handleDismiss = () => {
    deletePendingPhoto(reflectionPhoto);
    setReflectionPhoto(undefined);
    onDismiss();
  };

  const handleChoosePhoto = async () => {
    setIsPickingPhoto(true);
    const result = await chooseDiaryPhoto();
    if (!result.success) {
      setIsPickingPhoto(false);
      if (result.error === 'native-module-missing') {
        Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoNativeModuleMissingMessage'));
        return;
      }
      Alert.alert(t('entryPhotoPermissionTitle'), t('entryPhotoLibraryPermissionMessage'));
      return;
    }

    const asset = result.assets[0];
    if (!asset) {
      setIsPickingPhoto(false);
      return;
    }

    try {
      const importedPhoto = await diaryPhotoService.importAsset(asset);
      deletePendingPhoto(reflectionPhoto);
      setReflectionPhoto(importedPhoto);
    } catch {
      Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage'));
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleAddReflection = async () => {
    if (!entry || !trimmedReflection) return;
    setIsSavingReflection(true);
    const saved = await onAddReflection(entry.id, trimmedReflection, reflectionPhoto);
    setIsSavingReflection(false);
    if (saved) {
      setReflectionText('');
      setReflectionPhoto(undefined);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={handleDismiss}
      title={t('reflections')}
      accessibilityLabel={t('entryReflectionsA11y')}
      scrollable={false}
    >
      <View style={styles.modalBody}>
        <ScrollView
          style={styles.reflectionsScroll}
          contentContainerStyle={styles.reflectionsScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!entry || entry.reflections.length === 0 ? (
            <Text preset="bodySmall" color="textSecondary" style={styles.reflectionsEmpty}>
              {t('noReflections')}
            </Text>
          ) : (
            <View style={styles.reflectionsList}>
              {entry.reflections.map((reflection) => (
                <View key={reflection.id} style={styles.reflectionRow}>
                  <ProfileAvatar profile={profile} size={24} accessibilityLabel={t('profileAvatarA11y')} />
                  <View style={[styles.reflectionItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                    <View style={styles.reflectionHeader}>
                      <Text preset="caption" color="textTertiary">
                        {formatFriendlyTimestamp(reflection.createdAt, timeFormat, friendlyTimestampLabels)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => onDeleteReflection(entry.id, reflection.id)}
                        accessibilityRole="button"
                        accessibilityLabel={t('reflectionDeleteA11y')}
                      >
                        <Text preset="caption" color="textSecondary">{t('entryDelete')}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text preset="bodySmall" color="text" style={styles.reflectionText}>{reflection.text}</Text>
                    {reflection.photo ? (
                      <Image
                        source={getDiaryPhotoImageSource(reflection.photo.uri)}
                        style={styles.reflectionPhoto}
                        resizeMode="cover"
                        accessibilityLabel={t('reflectionPhotoA11y')}
                        accessibilityIgnoresInvertColors
                        testID="entry-reflection-photo"
                      />
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        <View
          style={[
            styles.reflectionInputBox,
            {
              minHeight: Math.max(38, theme.fontSizes.sm * 2.7),
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => { void handleChoosePhoto(); }}
            disabled={isPickingPhoto}
            style={styles.reflectionPhotoButton}
            accessibilityRole="button"
            accessibilityLabel={reflectionPhoto ? t('reflectionChangePhotoA11y') : t('reflectionAddPhotoA11y')}
          >
            <MaterialCommunityIcons
              name={reflectionPhoto ? 'image-edit-outline' : 'image-plus'}
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <TextInput
            value={reflectionText}
            onChangeText={setReflectionText}
            placeholder={t('addReflectionPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.reflectionInput,
              {
                height: Math.max(36, theme.fontSizes.sm * 2.5),
                color: theme.colors.text,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSizes.sm,
                lineHeight: theme.fontSizes.sm * 1.35,
              },
            ]}
            returnKeyType="send"
            onSubmitEditing={() => { void handleAddReflection(); }}
            accessibilityLabel={t('reflectionTextA11y')}
          />
          <TouchableOpacity
            onPress={() => { void handleAddReflection(); }}
            disabled={isSavingReflection || !trimmedReflection}
            style={[
              styles.reflectionButton,
              { backgroundColor: trimmedReflection && !isSavingReflection ? theme.colors.tint : 'transparent' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('reflectionAddA11y')}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={trimmedReflection && !isSavingReflection ? theme.colors.background : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {reflectionPhoto ? (
          <View style={[styles.selectedPhotoPreview, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Image
              source={getDiaryPhotoImageSource(reflectionPhoto.uri)}
              style={styles.selectedPhotoImage}
              resizeMode="cover"
              accessibilityLabel={t('reflectionPhotoA11y')}
              accessibilityIgnoresInvertColors
              testID="entry-reflection-selected-photo"
            />
            <TouchableOpacity
              onPress={() => {
                deletePendingPhoto(reflectionPhoto);
                setReflectionPhoto(undefined);
              }}
              style={[styles.selectedPhotoRemoveButton, { backgroundColor: theme.colors.overlay }]}
              accessibilityRole="button"
              accessibilityLabel={t('reflectionRemovePhotoA11y')}
            >
              <MaterialCommunityIcons name="close" size={16} color={theme.colors.stickerControlText} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBody: { maxHeight: 520 },
  reflectionsScroll: { maxHeight: 440 },
  reflectionsScrollContent: { paddingBottom: 12 },
  reflectionsEmpty: { marginBottom: 12 },
  reflectionsList: { gap: 8, marginTop: 4, marginBottom: 12 },
  reflectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  reflectionItem: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  reflectionText: { lineHeight: 20, marginTop: 2 },
  reflectionPhoto: {
    width: '100%',
    height: 128,
    borderRadius: 8,
    marginTop: 8,
  },
  reflectionInputBox: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 4,
  },
  reflectionPhotoButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  reflectionInput: {
    flex: 1,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  reflectionButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPhotoPreview: {
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedPhotoImage: {
    width: '100%',
    height: 112,
  },
  selectedPhotoRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
