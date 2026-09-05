import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import { useTranslation } from '@/localization/i18n';
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
  const { width, height } = useWindowDimensions();
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const source = useMemo(() => getDiaryPhotoImageSource(photo.uri), [photo.uri]);

  if (!source) return null;

  const aspectRatio = photo.width && photo.height ? photo.height / photo.width : 0.75;
  const viewerWidth = Math.min(width - 48, 560);
  const viewerHeight = Math.min(height * 0.74, viewerWidth * aspectRatio);

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

      <Modal
        transparent
        visible={isViewerVisible}
        animationType="fade"
        onRequestClose={() => setIsViewerVisible(false)}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          onPress={() => setIsViewerVisible(false)}
          accessibilityLabel={t('modalCloseBackdropA11y')}
        >
          <Pressable
            style={[
              styles.viewer,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
            onPress={(event) => event.stopPropagation()}
            accessibilityLabel={t('reflectionPhotoViewerA11y')}
            testID={`${testID}-viewer`}
          >
            <Image
              source={source}
              style={[styles.viewerImage, { width: viewerWidth, height: viewerHeight }]}
              resizeMode="contain"
              accessibilityLabel={t('reflectionPhotoA11y')}
              accessibilityIgnoresInvertColors
              testID={`${testID}-viewer-image`}
            />
            <TouchableOpacity
              onPress={() => setIsViewerVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={t('reflectionClosePhotoA11y')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.closeButton, { backgroundColor: theme.colors.overlay }]}
            >
              <Ionicons name="close" size={20} color={theme.colors.stickerControlText} />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  viewer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: 'hidden',
  },
  viewerImage: {
    maxWidth: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
