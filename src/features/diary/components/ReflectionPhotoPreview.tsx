import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import { useTranslation } from '@/localization/i18n';
import { ImagePreviewModal } from '@/shared/components/ImagePreviewModal';
import { useTheme } from '@/providers/ThemeProvider';

interface ReflectionPhotoPreviewProps {
  readonly photo: DiaryPhoto;
  readonly style: StyleProp<ViewStyle>;
  readonly testID: string;
}

export function ReflectionPhotoPreview({
  photo,
  style,
  testID,
}: ReflectionPhotoPreviewProps): React.JSX.Element | null {
  const theme = useTheme();
  const t = useTranslation();
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const source = useMemo(() => getDiaryPhotoImageSource(photo.uri), [photo.uri]);

  if (!source) return null;

  return (
    <>
      <Pressable
        onPress={() => setIsViewerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t('reflectionOpenPhotoA11y')}
        style={[styles.thumbnailButton, style]}
      >
        <Image
          source={source}
          style={styles.thumbnailImage}
          resizeMode="cover"
          accessibilityLabel={t('reflectionPhotoA11y')}
          accessibilityIgnoresInvertColors
          testID={testID}
        />
        <View
          pointerEvents="none"
          style={[styles.previewIndicator, { backgroundColor: theme.colors.overlay }]}
          testID={`${testID}-preview-indicator`}
        >
          <Ionicons name="expand-outline" size={14} color={theme.colors.stickerControlText} />
        </View>
      </Pressable>

      <ImagePreviewModal
        visible={isViewerVisible}
        source={source}
        imageWidth={photo.width}
        imageHeight={photo.height}
        onDismiss={() => setIsViewerVisible(false)}
        imageAccessibilityLabel={t('reflectionPhotoA11y')}
        viewerAccessibilityLabel={t('reflectionPhotoViewerA11y')}
        closeAccessibilityLabel={t('reflectionClosePhotoA11y')}
        testID={`${testID}-viewer`}
      />
    </>
  );
}

const styles = StyleSheet.create({
  thumbnailButton: {
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  previewIndicator: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 24,
  },
});
