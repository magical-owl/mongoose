import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import type { DiaryPhoto, MomentPhotoLayout } from '@/features/diary/domain/DiaryEntry';
import { DEFAULT_MOMENT_PHOTO_LAYOUT, MOMENT_ENTRY_PHOTO_LIMIT, MOMENT_PHOTO_LAYOUT_OPTIONS } from '@/features/diary/domain/DiaryEntry';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import { Text } from '@/shared/components/Text';
import { useTranslation, type TranslationKey } from '@/localization/i18n';
import { ImagePreviewModal } from '@/shared/components/ImagePreviewModal';

const MOMENT_PHOTO_LAYOUT_LABEL_KEYS: Readonly<Record<MomentPhotoLayout, TranslationKey>> = {
  auto: 'entryMomentLayoutAuto',
  grid: 'entryMomentLayoutGrid',
  feature: 'entryMomentLayoutFeature',
  mosaic: 'entryMomentLayoutMosaic',
  stacked: 'entryMomentLayoutStacked',
  album: 'entryMomentLayoutAlbum',
};

interface MomentPhotoGridProps {
  readonly photos: readonly DiaryPhoto[];
  readonly editable?: boolean;
  readonly layout?: MomentPhotoLayout;
  readonly onChangeLayout?: (layout: MomentPhotoLayout) => void;
  readonly onAddPhoto?: () => void;
  readonly onRemovePhoto?: (photoId: string) => void;
  readonly compact?: boolean;
  readonly previewable?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function MomentPhotoGrid({
  photos,
  editable = false,
  layout = DEFAULT_MOMENT_PHOTO_LAYOUT,
  onChangeLayout,
  onAddPhoto,
  onRemovePhoto,
  compact = false,
  previewable = false,
  style,
  testID = 'moment-photo-grid',
}: MomentPhotoGridProps): React.JSX.Element | null {
  const theme = useTheme();
  const t = useTranslation();
  const [previewPhoto, setPreviewPhoto] = useState<DiaryPhoto | null>(null);
  const [albumWidth, setAlbumWidth] = useState(0);
  const [albumIndex, setAlbumIndex] = useState(0);
  const canAddPhoto = editable && photos.length < MOMENT_ENTRY_PHOTO_LIMIT && Boolean(onAddPhoto);
  const photoRows = getMomentPhotoRows(photos, layout);
  const usesStrictGrid = layout === 'grid';
  const usesAlbum = layout === 'album';
  const previewSource = useMemo(
    () => previewPhoto ? getDiaryPhotoImageSource(previewPhoto.uri) : null,
    [previewPhoto],
  );

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
      {editable && onChangeLayout ? (
        <View style={styles.layoutSelector} testID={`${testID}-layout-selector`}>
          {MOMENT_PHOTO_LAYOUT_OPTIONS.map((option) => {
            const selected = layout === option;
            return (
              <Pressable
                key={option}
                onPress={() => onChangeLayout(option)}
                style={[
                  styles.layoutOption,
                  {
                    backgroundColor: selected ? theme.colors.tint : theme.colors.card,
                    borderColor: selected ? theme.colors.tint : theme.colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`${testID}-layout-${option}`}
              >
                <Text style={[styles.layoutOptionText, { color: selected ? theme.colors.background : theme.colors.text }]}>
                  {t(MOMENT_PHOTO_LAYOUT_LABEL_KEYS[option])}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {usesAlbum ? (
        <View
          style={styles.albumFrame}
          onLayout={(event) => setAlbumWidth(event.nativeEvent.layout.width)}
          testID={`${testID}-album`}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onScroll={(event) => {
              if (albumWidth <= 0) return;
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / albumWidth);
              setAlbumIndex(Math.max(0, Math.min(photos.length - 1, nextIndex)));
            }}
            scrollEventThrottle={16}
            testID={`${testID}-album-scroll`}
          >
            {photos.map((photo, index) => {
              const source = getDiaryPhotoImageSource(photo.uri);
              return (
                <Pressable
                  key={`${photo.id}-${index}`}
                  disabled={!previewable}
                  onPress={previewable ? () => setPreviewPhoto(photo) : undefined}
                  style={[
                    styles.albumPage,
                    { width: albumWidth || undefined, backgroundColor: theme.colors.card },
                  ]}
                  accessibilityRole={previewable ? 'button' : undefined}
                  accessibilityLabel={previewable ? t('reflectionOpenPhotoA11y') : undefined}
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
                  {previewable ? (
                    <View
                      pointerEvents="none"
                      style={[styles.previewIndicator, { backgroundColor: theme.colors.overlay }]}
                      testID={`${testID}-photo-${index}-preview-indicator`}
                    >
                      <Ionicons name="expand-outline" size={14} color={theme.colors.stickerControlText} />
                    </View>
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
                </Pressable>
              );
            })}
          </ScrollView>
          {photos.length > 0 ? (
            <View
              pointerEvents="none"
              style={[styles.albumCountBadge, { backgroundColor: theme.colors.overlay }]}
              testID={`${testID}-album-count`}
            >
              <Text style={[styles.albumCountText, { color: theme.colors.stickerControlText }]}>
                {`${albumIndex + 1}/${photos.length}`}
              </Text>
            </View>
          ) : null}
          {canAddPhoto ? (
            <Pressable
              style={[
                styles.albumAddButton,
                { borderColor: theme.colors.tint, backgroundColor: theme.colors.card },
              ]}
              onPress={onAddPhoto}
              accessibilityRole="button"
              accessibilityLabel={t('entryMomentAddPhotosA11y')}
              testID={`${testID}-add`}
            >
              <Ionicons name="images-outline" size={18} color={theme.colors.tint} />
              <Text style={[styles.addText, { color: theme.colors.tint }]}>{t('entryMomentAddPhotos')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={[styles.grid, !editable && styles.collageGrid]}>
          {photoRows.map((row, rowIndex) => (
            <View
              key={`row-${rowIndex}`}
              style={[styles.photoRow, editable && styles.editablePhotoRow]}
              testID={`${testID}-row-${rowIndex}`}
            >
              {row.map((photo, columnIndex) => {
                const index = rowIndex * 2 + columnIndex;
                const source = getDiaryPhotoImageSource(photo.uri);
                const isFullWidth = row.length === 1 && !usesStrictGrid;
                return (
                  <Pressable
                    key={`${photo.id}-${index}`}
                    disabled={!previewable}
                    onPress={previewable ? () => setPreviewPhoto(photo) : undefined}
                    style={[
                      styles.photoFrame,
                      compact && styles.photoFrameCompact,
                      isFullWidth && styles.photoFrameFullWidth,
                      !editable && styles.collagePhotoFrame,
                      { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                    ]}
                    accessibilityRole={previewable ? 'button' : undefined}
                    accessibilityLabel={previewable ? t('reflectionOpenPhotoA11y') : undefined}
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
                    {previewable ? (
                      <View
                        pointerEvents="none"
                        style={[styles.previewIndicator, { backgroundColor: theme.colors.overlay }]}
                        testID={`${testID}-photo-${index}-preview-indicator`}
                      >
                        <Ionicons name="expand-outline" size={14} color={theme.colors.stickerControlText} />
                      </View>
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
                  </Pressable>
                );
              })}
              {usesStrictGrid && row.length === 1 ? (
                <View
                  style={styles.gridSpacer}
                  testID={`${testID}-spacer-${rowIndex}`}
                />
              ) : null}
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
      )}
      {previewPhoto && previewSource ? (
        <ImagePreviewModal
          visible
          source={previewSource}
          imageWidth={previewPhoto.width}
          imageHeight={previewPhoto.height}
          onDismiss={() => setPreviewPhoto(null)}
          imageAccessibilityLabel={t('reflectionPhotoA11y')}
          viewerAccessibilityLabel={t('reflectionPhotoViewerA11y')}
          closeAccessibilityLabel={t('reflectionClosePhotoA11y')}
          testID={`${testID}-photo-viewer`}
        />
      ) : null}
    </View>
  );
}

function getMomentPhotoRows(
  photos: readonly DiaryPhoto[],
  layout: MomentPhotoLayout,
): DiaryPhoto[][] {
  if (layout === 'stacked') return photos.map((photo) => [photo]);

  if (layout === 'feature' && photos.length > 0) {
    return [photos.slice(0, 1), ...pairRows(photos.slice(1))];
  }

  if (layout === 'mosaic' && photos.length > 2) {
    return [
      photos.slice(0, 2),
      photos.slice(2, 3),
      ...pairRows(photos.slice(3)),
    ];
  }

  return pairRows(photos);
}

function pairRows(photos: readonly DiaryPhoto[]): DiaryPhoto[][] {
  const rows: DiaryPhoto[][] = [];
  for (let index = 0; index < photos.length; index += 2) {
    rows.push(photos.slice(index, index + 2));
  }
  return rows;
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
  layoutSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  layoutOption: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  layoutOptionText: {
    fontSize: 11,
    fontWeight: '800',
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
  editablePhotoRow: {
    gap: 8,
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
  gridSpacer: {
    aspectRatio: 1,
    flex: 1,
  },
  photo: {
    height: '100%',
    width: '100%',
  },
  albumFrame: {
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  albumPage: {
    aspectRatio: 1.2,
    overflow: 'hidden',
    position: 'relative',
  },
  albumAddButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderStyle: 'dashed',
    borderWidth: 1,
    bottom: 10,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
    right: 10,
  },
  albumCountBadge: {
    alignItems: 'center',
    borderRadius: 999,
    bottom: 10,
    justifyContent: 'center',
    left: 10,
    minWidth: 42,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
  },
  albumCountText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
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
