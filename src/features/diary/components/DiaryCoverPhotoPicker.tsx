import { Animated, Image, StyleSheet, TouchableOpacity, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@shared/components/Text';
import { useTheme } from '@providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';

interface DiaryCoverPhotoPickerProps {
  readonly photo?: DiaryPhoto;
  readonly editable?: boolean;
  readonly variant?: 'default' | 'entryHero';
  readonly height?: number;
  readonly onTakePhoto?: () => void;
  readonly onChoosePhoto?: () => void;
  readonly onRemovePhoto?: () => void;
  readonly scrollY?: Animated.Value;
  readonly children?: ReactNode;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly actionAreaTopInset?: number;
}

export function DiaryCoverPhotoPicker({
  photo,
  editable = true,
  variant = 'default',
  height,
  onTakePhoto,
  onChoosePhoto,
  onRemovePhoto,
  scrollY,
  children,
  containerStyle,
  actionAreaTopInset = 0,
}: DiaryCoverPhotoPickerProps) {
  const theme = useTheme();
  const t = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const photoSource = photo ? getDiaryPhotoImageSource(photo.uri) : undefined;
  const isEntryHero = variant === 'entryHero';

  if (!editable && !photo) return null;

  const fullHeight = height ?? Math.min(184, Math.max(120, (windowWidth - theme.spacing.lg * 2) / 1.9));
  const entryHeroActionTop = Math.max(actionAreaTopInset, actionAreaTopInset + (fullHeight - actionAreaTopInset) / 2);
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
        isEntryHero && styles.entryHeroContainer,
        animatedContainerStyle,
        {
          backgroundColor: photo ? theme.colors.surface : theme.colors.inputBackground,
          borderColor: theme.colors.border,
        },
        containerStyle,
      ]}
      accessibilityRole={editable ? undefined : 'image'}
      accessibilityLabel={photo ? t('entryCoverPhotoA11y') : undefined}
    >
      {photo ? (
        <Image
          source={photoSource}
          style={styles.image}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          testID="diary-cover-photo-image"
        />
      ) : (
        <TouchableOpacity
          style={[styles.emptyState, isEntryHero && { backgroundColor: 'transparent' }]}
          onPress={onChoosePhoto ?? onTakePhoto}
          activeOpacity={0.72}
          accessibilityRole={editable ? 'button' : undefined}
          accessibilityLabel={t('entryChoosePhotoA11y')}
          disabled={!editable}
        >
          <View style={[styles.emptyIconHalo, { backgroundColor: theme.colors.background + 'CC', borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="camera-outline" size={24} color={theme.colors.tint} />
          </View>
          <Text
            preset="bodySmall"
            color={isEntryHero ? theme.colors.stickerControlText : 'text'}
            style={[styles.emptyLabel, isEntryHero && styles.entryHeroEmptyLabel]}
          >
            {t('entryCoverPhotoTitle')}
          </Text>
        </TouchableOpacity>
      )}

      {editable && (!isEntryHero || photo) ? (
        <View
          testID={isEntryHero ? 'diary-cover-photo-entry-hero-actions' : undefined}
          style={isEntryHero ? [styles.entryHeroActions, { top: entryHeroActionTop }] : styles.actions}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              isEntryHero && styles.entryHeroActionButton,
              { backgroundColor: theme.colors.background + 'E6' },
            ]}
            onPress={onTakePhoto}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('entryTakePhotoA11y')}
          >
            <MaterialCommunityIcons name="camera-outline" size={19} color={theme.colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isEntryHero && styles.entryHeroActionButton,
              { backgroundColor: theme.colors.background + 'E6' },
            ]}
            onPress={onChoosePhoto}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('entryChoosePhotoA11y')}
          >
            <MaterialCommunityIcons name="image-outline" size={19} color={theme.colors.tint} />
          </TouchableOpacity>
          {photo ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                isEntryHero && styles.entryHeroActionButton,
                { backgroundColor: theme.colors.background + 'E6' },
              ]}
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
  entryHeroContainer: {
    borderRadius: 22,
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
  emptyIconHalo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: {
    fontWeight: '600',
  },
  entryHeroEmptyLabel: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
  },
  actions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryHeroActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transform: [{ translateY: -17 }],
  },
  actionButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  entryHeroActionButton: {
    borderRadius: 17,
  },
});
