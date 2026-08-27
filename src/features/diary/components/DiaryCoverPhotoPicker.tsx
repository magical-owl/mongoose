import { Animated, Image, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import type { ReactNode } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@shared/components/Text';
import { useTheme } from '@providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { resolveImportedDiaryPhotoUri } from '@/features/diary/services/DiaryPhotoService';

interface DiaryCoverPhotoPickerProps {
  readonly photo?: DiaryPhoto;
  readonly editable?: boolean;
  readonly onTakePhoto?: () => void;
  readonly onChoosePhoto?: () => void;
  readonly onRemovePhoto?: () => void;
  readonly scrollY?: Animated.Value;
  readonly children?: ReactNode;
}

export function DiaryCoverPhotoPicker({
  photo,
  editable = true,
  onTakePhoto,
  onChoosePhoto,
  onRemovePhoto,
  scrollY,
  children,
}: DiaryCoverPhotoPickerProps) {
  const theme = useTheme();
  const t = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const photoUri = photo ? resolveImportedDiaryPhotoUri(photo.uri) : undefined;

  if (!editable && !photo) return null;

  const fullHeight = Math.min(184, Math.max(120, (windowWidth - theme.spacing.lg * 2) / 1.9));
  const collapsedHeight = 0;
  const animatedContainerStyle = scrollY
    ? {
        height: scrollY.interpolate({
          inputRange: [0, 120],
          outputRange: [fullHeight, collapsedHeight],
          extrapolate: 'clamp',
        }),
        marginBottom: scrollY.interpolate({
          inputRange: [0, 120],
          outputRange: [4, 0],
          extrapolate: 'clamp',
        }),
        opacity: scrollY.interpolate({
          inputRange: [0, 78, 120],
          outputRange: [1, 0.35, 0],
          extrapolate: 'clamp',
        }),
      }
    : { height: fullHeight, marginBottom: 4 };

  return (
    <Animated.View
      style={[
        styles.container,
        animatedContainerStyle,
        {
          backgroundColor: photo ? theme.colors.surface : theme.colors.inputBackground,
          borderColor: theme.colors.border,
        },
      ]}
      accessibilityRole={editable ? undefined : 'image'}
      accessibilityLabel={photo ? t('entryCoverPhotoA11y') : undefined}
    >
      {photo ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.image}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="image-plus-outline" size={26} color={theme.colors.textSecondary} />
          <Text preset="caption" color="textSecondary" style={styles.emptyLabel}>
            {t('entryCoverPhotoTitle')}
          </Text>
        </View>
      )}

      {editable ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.background + 'E6' }]}
            onPress={onTakePhoto}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('entryTakePhotoA11y')}
          >
            <MaterialCommunityIcons name="camera-outline" size={19} color={theme.colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.background + 'E6' }]}
            onPress={onChoosePhoto}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('entryChoosePhotoA11y')}
          >
            <MaterialCommunityIcons name="image-outline" size={19} color={theme.colors.tint} />
          </TouchableOpacity>
          {photo ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background + 'E6' }]}
              onPress={onRemovePhoto}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('entryRemovePhotoA11y')}
            >
              <MaterialCommunityIcons name="close" size={19} color={theme.colors.error} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  emptyLabel: {
    fontWeight: '600',
  },
  actions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
