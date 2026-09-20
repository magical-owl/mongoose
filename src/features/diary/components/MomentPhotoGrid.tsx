import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { MOMENT_ENTRY_PHOTO_LIMIT } from '@/features/diary/domain/DiaryEntry';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import { Text } from '@/shared/components/Text';
import { useTranslation } from '@/localization/i18n';

interface MomentPhotoGridProps {
  readonly photos: readonly DiaryPhoto[];
  readonly editable?: boolean;
  readonly onAddPhoto?: () => void;
  readonly onRemovePhoto?: (photoId: string) => void;
  readonly compact?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function MomentPhotoGrid({
  photos,
  editable = false,
  onAddPhoto,
  onRemovePhoto,
  compact = false,
  style,
  testID = 'moment-photo-grid',
}: MomentPhotoGridProps): React.JSX.Element | null {
  const theme = useTheme();
  const t = useTranslation();
  const canAddPhoto = editable && photos.length < MOMENT_ENTRY_PHOTO_LIMIT && Boolean(onAddPhoto);
  const photoRows = [];
  for (let index = 0; index < photos.length; index += 2) {
    photoRows.push(photos.slice(index, index + 2));
  }

  if (!editable && photos.length === 0) return null;

  return (
    <View style={[styles.root, compact && styles.rootCompact, style]} testID={testID}>
      {editable ? (
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
            {t('entryMomentPhotosLabel')}
          </Text>
          <Text style={[styles.countText, { color: theme.colors.textTertiary }]}>
            {photos.length}/{MOMENT_ENTRY_PHOTO_LIMIT}
          </Text>
        </View>
      ) : null}
      <View style={[styles.grid, !editable && styles.collageGrid]}>
        {photoRows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.photoRow}>
            {row.map((photo, columnIndex) => {
              const index = rowIndex * 2 + columnIndex;
              const source = getDiaryPhotoImageSource(photo.uri);
              const isFullWidth = row.length === 1;
              return (
                <View
                  key={`${photo.id}-${index}`}
                  style={[
                    styles.photoFrame,
                    compact && styles.photoFrameCompact,
                    isFullWidth && styles.photoFrameFullWidth,
                    !editable && styles.collagePhotoFrame,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  ]}
                  testID={`${testID}-photo-${index}`}
                >
                  {source ? (
                    <Image
                      source={source}
                      style={styles.photo}
                      resizeMode="cover"
                      accessibilityIgnoresInvertColors
                    />
                  ) : null}
                  {editable && onRemovePhoto ? (
                    <Pressable
                      style={[styles.removeButton, { backgroundColor: theme.colors.overlay }]}
                      onPress={() => onRemovePhoto(photo.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t('entryMomentRemovePhotoA11y')}
                      testID={`${testID}-remove-${index}`}
                    >
                      <Ionicons name="close" size={14} color={theme.colors.text} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
        {canAddPhoto ? (
          <Pressable
            style={[
              styles.addFrame,
              compact && styles.photoFrameCompact,
              { borderColor: theme.colors.tint, backgroundColor: theme.colors.card },
            ]}
            onPress={onAddPhoto}
            accessibilityRole="button"
            accessibilityLabel={t('entryMomentAddPhotosA11y')}
            testID={`${testID}-add`}
          >
            <Ionicons name="images-outline" size={22} color={theme.colors.tint} />
            <Text style={[styles.addText, { color: theme.colors.tint }]}>{t('entryMomentAddPhotos')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 10,
    marginBottom: 18,
  },
  rootCompact: {
    marginBottom: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    gap: 8,
  },
  collageGrid: {
    borderRadius: 0,
    gap: 0,
    overflow: 'hidden',
  },
  photoRow: {
    flexDirection: 'row',
    width: '100%',
  },
  photoFrame: {
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  collagePhotoFrame: {
    borderRadius: 0,
  },
  photoFrameCompact: {
    borderRadius: 8,
  },
  photoFrameFullWidth: {
    aspectRatio: 1.35,
  },
  photo: {
    height: '100%',
    width: '100%',
  },
  removeButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 24,
  },
  addFrame: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: 6,
    justifyContent: 'center',
    width: '48.5%',
  },
  addText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
});
