import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import { useTranslation } from '@/localization/i18n';
import { ImagePreviewModal } from '@/shared/components/ImagePreviewModal';

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
});
