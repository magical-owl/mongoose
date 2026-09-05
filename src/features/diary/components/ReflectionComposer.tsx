import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { chooseDiaryPhoto } from '@/features/diary/services/DiaryPhotoPickerService';
import { diaryPhotoService, getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import { useTranslation } from '@/localization/i18n';

interface ReflectionComposerProps {
  readonly onSubmit: (text: string, photo?: DiaryPhoto) => Promise<boolean>;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly inputBoxStyle?: StyleProp<ViewStyle>;
  readonly photoPreviewStyle?: StyleProp<ViewStyle>;
  readonly inputBoxTestID?: string;
  readonly attachButtonTestID?: string;
  readonly submitButtonTestID?: string;
  readonly photoPreviewTestID?: string;
  readonly removePhotoButtonTestID?: string;
  readonly selectedPhotoTestID?: string;
  readonly showKeyboardDismissButton?: boolean;
  readonly submitSurface?: 'solid' | 'subtle';
  readonly minHeight?: number;
  readonly inputHeight?: number;
  readonly backgroundColor?: string;
}

export function ReflectionComposer({
  onSubmit,
  onFocus,
  onBlur,
  inputBoxStyle,
  photoPreviewStyle,
  inputBoxTestID,
  attachButtonTestID,
  submitButtonTestID,
  photoPreviewTestID,
  removePhotoButtonTestID,
  selectedPhotoTestID,
  showKeyboardDismissButton = false,
  submitSurface = 'solid',
  minHeight,
  inputHeight,
  backgroundColor,
}: ReflectionComposerProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<DiaryPhoto | undefined>();
  const [isFocused, setIsFocused] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pendingPhotoRef = useRef<DiaryPhoto | undefined>(undefined);
  const trimmed = text.trim();

  useEffect(() => {
    return () => {
      if (pendingPhotoRef.current) void diaryPhotoService.deletePhoto(pendingPhotoRef.current);
    };
  }, []);

  const replacePendingPhoto = (nextPhoto: DiaryPhoto | undefined) => {
    if (pendingPhotoRef.current && pendingPhotoRef.current.id !== nextPhoto?.id) {
      void diaryPhotoService.deletePhoto(pendingPhotoRef.current);
    }
    pendingPhotoRef.current = nextPhoto;
    setPhoto(nextPhoto);
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
      replacePendingPhoto(await diaryPhotoService.importAsset(asset));
    } catch {
      Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage'));
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    if (!trimmed) return;
    setIsSubmitting(true);
    const submittedPhoto = photo;
    const saved = await onSubmit(trimmed, submittedPhoto);
    setIsSubmitting(false);
    if (!saved) return;
    pendingPhotoRef.current = undefined;
    setText('');
    setPhoto(undefined);
  };

  const isSubmitActive = Boolean(trimmed) && !isSubmitting;
  const resolvedMinHeight = minHeight ?? Math.max(38, theme.fontSizes.sm * 2.7);
  const resolvedInputHeight = inputHeight ?? Math.max(36, theme.fontSizes.sm * 2.5);
  const resolvedBackgroundColor = backgroundColor ?? theme.colors.surface;
  const submitBackgroundColor = submitSurface === 'solid' && isSubmitActive
    ? theme.colors.tint
    : submitSurface === 'subtle' && isSubmitActive
      ? theme.colors.tint + '18'
      : 'transparent';
  const submitIconColor = submitSurface === 'solid' && isSubmitActive
    ? theme.colors.background
    : isSubmitActive
      ? theme.colors.tint
      : theme.colors.textSecondary;

  return (
    <>
      <View
        style={[
          styles.inputBox,
          inputBoxStyle,
          {
            minHeight: resolvedMinHeight,
            borderColor: isFocused ? theme.colors.tint : theme.colors.border,
            backgroundColor: resolvedBackgroundColor,
          },
        ]}
        testID={inputBoxTestID}
      >
        <TouchableOpacity
          onPress={() => { void handleChoosePhoto(); }}
          disabled={isPickingPhoto}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={photo ? t('reflectionChangePhotoA11y') : t('reflectionAddPhotoA11y')}
          testID={attachButtonTestID}
        >
          <MaterialCommunityIcons
            name={photo ? 'image-edit-outline' : 'image-plus'}
            size={18}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('addReflectionPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.input,
            {
              height: resolvedInputHeight,
              color: theme.colors.text,
              fontFamily: theme.fontFamily,
              fontSize: theme.fontSizes.sm,
              lineHeight: theme.fontSizes.sm * 1.35,
            },
          ]}
          returnKeyType="send"
          onSubmitEditing={() => { void handleSubmit(); }}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          accessibilityLabel={t('reflectionTextA11y')}
        />
        {showKeyboardDismissButton && isFocused ? (
          <TouchableOpacity
            onPress={Keyboard.dismiss}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={t('entryDismissKeyboardA11y')}
          >
            <MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          onPress={() => { void handleSubmit(); }}
          disabled={!isSubmitActive}
          style={[styles.iconButton, { backgroundColor: submitBackgroundColor }]}
          accessibilityRole="button"
          accessibilityLabel={t('reflectionSaveA11y')}
          testID={submitButtonTestID}
        >
          <MaterialCommunityIcons name="plus" size={18} color={submitIconColor} />
        </TouchableOpacity>
      </View>
      {photo ? (
        <View
          style={[
            styles.photoPreview,
            photoPreviewStyle,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
          ]}
          testID={photoPreviewTestID}
        >
          <Image
            source={getDiaryPhotoImageSource(photo.uri)}
            style={styles.photoImage}
            resizeMode="cover"
            accessibilityLabel={t('reflectionPhotoA11y')}
            accessibilityIgnoresInvertColors
            testID={selectedPhotoTestID}
          />
          <TouchableOpacity
            onPress={() => replacePendingPhoto(undefined)}
            style={[styles.removePhotoButton, { backgroundColor: theme.colors.overlay }]}
            accessibilityRole="button"
            accessibilityLabel={t('reflectionRemovePhotoA11y')}
            testID={removePhotoButtonTestID}
          >
            <MaterialCommunityIcons name="close" size={16} color={theme.colors.stickerControlText} />
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  inputBox: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 4,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  photoPreview: {
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 112,
  },
  removePhotoButton: {
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
