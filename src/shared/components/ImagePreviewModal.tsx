import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';

interface ImagePreviewModalProps {
  readonly visible: boolean;
  readonly source: ImageSourcePropType;
  readonly imageWidth?: number;
  readonly imageHeight?: number;
  readonly onDismiss: () => void;
  readonly imageAccessibilityLabel: string;
  readonly viewerAccessibilityLabel: string;
  readonly closeAccessibilityLabel: string;
  readonly testID: string;
}

export function ImagePreviewModal({
  visible,
  source,
  imageWidth,
  imageHeight,
  onDismiss,
  imageAccessibilityLabel,
  viewerAccessibilityLabel,
  closeAccessibilityLabel,
  testID,
}: ImagePreviewModalProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const { width, height } = useWindowDimensions();
  const aspectRatio = imageWidth && imageHeight ? imageHeight / imageWidth : 0.75;
  const viewerWidth = Math.min(width - 48, 560);
  const viewerHeight = Math.min(height * 0.74, viewerWidth * aspectRatio);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        onPress={onDismiss}
        accessibilityLabel={t('modalCloseBackdropA11y')}
      >
        <Pressable
          style={[
            styles.viewer,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
          onPress={(event) => event.stopPropagation()}
          accessibilityLabel={viewerAccessibilityLabel}
          testID={testID}
        >
          <Image
            source={source}
            style={[styles.viewerImage, { width: viewerWidth, height: viewerHeight }]}
            resizeMode="contain"
            accessibilityLabel={imageAccessibilityLabel}
            accessibilityIgnoresInvertColors
            testID={`${testID}-image`}
          />
          <TouchableOpacity
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={closeAccessibilityLabel}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.closeButton, { backgroundColor: theme.colors.overlay }]}
          >
            <Ionicons name="close" size={20} color={theme.colors.stickerControlText} />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  viewer: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  viewerImage: {
    maxWidth: '100%',
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    width: 36,
  },
});
