import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared/components/Text';
import { AccentPillButton } from '@/shared/components/AccentPillButton';
import { IconCircleButton } from '@/shared/components/IconCircleButton';
import { SectionLabel } from '@/shared/components/SectionLabel';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import { chooseDiaryPhoto } from '@/features/diary/services/DiaryPhotoPickerService';
import { diaryPhotoService } from '@/features/diary/services/DiaryPhotoService';
import { BUILTIN_JOURNAL_BACKGROUNDS, getJournalCoverImageSource } from '@/features/journal/domain/JournalBackgrounds';
import type { CreateJournalInput } from '@/features/journal/services/JournalService';

interface JournalCoverDraft {
  readonly coverImageUri: string;
  readonly coverImageWidth?: number;
  readonly coverImageHeight?: number;
}

interface JournalCreateFormProps {
  readonly initialValues?: CreateJournalInput;
  readonly submitLabel: string;
  readonly savingLabel?: string;
  readonly isSaving?: boolean;
  readonly showCancel?: boolean;
  readonly autoFocus?: boolean;
  readonly onCancel?: () => void;
  readonly onSubmit: (input: CreateJournalInput) => void;
}

export function JournalCreateForm({
  initialValues,
  submitLabel,
  savingLabel,
  isSaving = false,
  showCancel = true,
  autoFocus = false,
  onCancel,
  onSubmit,
}: JournalCreateFormProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [cover, setCover] = useState<JournalCoverDraft | null>(
    initialValues?.coverImageUri
      ? {
          coverImageUri: initialValues.coverImageUri,
          coverImageWidth: initialValues.coverImageWidth,
          coverImageHeight: initialValues.coverImageHeight,
        }
      : null,
  );
  const selectedCoverSource = getJournalCoverImageSource(cover?.coverImageUri);

  const chooseGalleryCover = () => {
    void (async () => {
      const result = await chooseDiaryPhoto();
      if (!result.success) {
        if (result.error === 'native-module-missing') {
          Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoNativeModuleMissingMessage'));
        } else {
          Alert.alert(t('entryPhotoPermissionTitle'), t('entryPhotoLibraryPermissionMessage'));
        }
        return;
      }
      const asset = result.assets[0];
      if (!asset) return;
      try {
        const imported = await diaryPhotoService.importAsset(asset);
        setCover({
          coverImageUri: imported.uri,
          coverImageWidth: imported.width,
          coverImageHeight: imported.height,
        });
      } catch {
        Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage'));
      }
    })();
  };

  const submit = () => {
    onSubmit({
      title,
      description,
      coverImageUri: cover?.coverImageUri,
      coverImageWidth: cover?.coverImageWidth,
      coverImageHeight: cover?.coverImageHeight,
    });
  };

  return (
    <View style={styles.root}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t('journalTitlePlaceholder')}
        placeholderTextColor={theme.colors.textSecondary}
        autoFocus={autoFocus}
        style={[styles.titleInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontFamily: theme.fontFamily }]}
        returnKeyType="next"
        accessibilityLabel={t('journalTitlePlaceholder')}
        testID="journal-create-title-input"
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t('journalDescriptionPlaceholder')}
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        maxLength={280}
        style={[styles.descriptionInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontFamily: theme.fontFamily }]}
        accessibilityLabel={t('journalDescriptionLabel')}
        testID="journal-create-description-input"
      />

      <SectionLabel style={styles.coverLabel}>{t('journalCoverLabel')}</SectionLabel>
      <View style={[styles.coverPreviewFrame, { backgroundColor: theme.colors.tint + '18', borderColor: theme.colors.border }]}>
        {selectedCoverSource ? (
          <Image source={selectedCoverSource} style={styles.coverPreviewImage} resizeMode="cover" testID="journal-create-cover-preview" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="book-outline" size={26} color={theme.colors.tint} />
            <Text preset="caption" color="textSecondary" style={styles.coverPlaceholderText}>{t('journalCoverNone')}</Text>
          </View>
        )}
        {cover ? (
          <IconCircleButton
            icon="close"
            size="sm"
            surface="overlay"
            iconSize={17}
            onPress={() => setCover(null)}
            accessibilityLabel={t('journalRemoveCoverA11y')}
            style={styles.removeCoverButton}
            testID="journal-create-remove-cover-button"
          />
        ) : null}
      </View>

      <TouchableOpacity
        onPress={chooseGalleryCover}
        style={[styles.galleryButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel={t('journalSetCoverFromGalleryA11y')}
        testID="journal-create-gallery-button"
      >
        <Ionicons name="image-outline" size={18} color={theme.colors.tint} />
        <Text preset="label" color="text" style={styles.galleryButtonText}>{t('journalSetCoverFromGallery')}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.backgroundStrip}
      >
        {BUILTIN_JOURNAL_BACKGROUNDS.map((background) => {
          const selected = cover?.coverImageUri === background.uri;
          return (
            <TouchableOpacity
              key={background.id}
              onPress={() => setCover({
                coverImageUri: background.uri,
                coverImageWidth: background.width,
                coverImageHeight: background.height,
              })}
              style={[
                styles.backgroundOption,
                {
                  borderColor: selected ? theme.colors.tint : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t('journalSetCoverA11y')} ${background.title}`}
              testID={`journal-create-cover-option-${background.id}`}
            >
              <Image source={background.source} style={styles.backgroundPreview} resizeMode="cover" />
              {selected ? (
                <View style={[styles.selectedBadge, { backgroundColor: theme.colors.tint }]}>
                  <Ionicons name="checkmark" size={13} color={theme.colors.background} />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.actions}>
        {showCancel ? (
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton} disabled={isSaving}>
            <Text preset="label" color="textSecondary">{t('entryCancel')}</Text>
          </TouchableOpacity>
        ) : null}
        <AccentPillButton
          label={isSaving && savingLabel ? savingLabel : submitLabel}
          onPress={submit}
          disabled={isSaving}
          style={styles.submitButton}
          testID="journal-create-submit-button"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  titleInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 16,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  descriptionInput: {
    minHeight: 72,
    maxHeight: 112,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  coverLabel: { marginTop: 2, fontWeight: '800' },
  coverPreviewFrame: {
    height: 116,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPreviewImage: { width: '100%', height: '100%' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 5 },
  coverPlaceholderText: { fontWeight: '700' },
  removeCoverButton: { position: 'absolute', top: 8, right: 8 },
  galleryButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  galleryButtonText: { flex: 1, fontWeight: '700' },
  backgroundStrip: { gap: 8, paddingRight: 2 },
  backgroundOption: {
    width: 112,
    height: 68,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  backgroundPreview: { width: '100%', height: '100%' },
  selectedBadge: { position: 'absolute', top: 5, right: 5, width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelButton: { minHeight: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  submitButton: {},
});
