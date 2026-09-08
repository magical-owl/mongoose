import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '@shared/components/Text';
import { AccentPillButton } from '@shared/components/AccentPillButton';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import type { DiaryPhoto, ManualMood } from '@/features/diary/domain/DiaryEntry';
import { DiaryCoverPhotoPicker } from '@/features/diary/components/DiaryCoverPhotoPicker';
import { DiaryEntryEditorHeader } from '@/features/diary/components/DiaryEntryEditorChrome';
import { EntryViewCountBadge } from '@/features/diary/components/EntryViewCountBadge';
import { EntryMetaRow } from '@/features/diary/components/EntryMetaRow';
import { ENTRY_DETAIL_VIEW_COVER_EXPANDED_HEIGHT } from '@/features/diary/components/EntryDetailLayout';
import { useTranslation } from '@/localization/i18n';
import { useTheme } from '@/providers/ThemeProvider';

interface EntryDetailHeaderCoverProps {
  readonly isEditing: boolean;
  readonly topInset: number;
  readonly entryHorizontalPadding: number;
  readonly hasEditCoverPhoto: boolean;
  readonly hasViewCoverPhoto: boolean;
  readonly editCoverPhoto: DiaryPhoto | undefined;
  readonly viewCoverPhoto: DiaryPhoto | undefined;
  readonly editCoverExpandedHeight: number;
  readonly coverTopOffset: number;
  readonly headerOnlyHeight: number;
  readonly coverScrollY: Animated.Value;
  readonly viewEntryOpacity: Animated.Value;
  readonly viewCoverOverlayOpacity: Animated.AnimatedInterpolation<number>;
  readonly entryTitle: string;
  readonly viewDateTime: string;
  readonly viewCount: number;
  readonly viewMoods?: readonly ManualMood[];
  readonly viewTags?: readonly string[];
  readonly canBringStickersForward: boolean;
  readonly isFavorite: boolean;
  readonly isSaving: boolean;
  readonly onCancelEdit: () => void;
  readonly onBringStickersForward: () => void;
  readonly onToggleFavorite: () => void;
  readonly onSaveEdit: () => void;
  readonly onBack: () => void;
  readonly onStartEdit: () => void;
  readonly onDelete: () => void;
  readonly onTakeCoverPhoto: () => void;
  readonly onChooseCoverPhoto: () => void;
  readonly onRemoveCoverPhoto: () => void;
}

export function EntryDetailHeaderCover({
  isEditing,
  topInset,
  entryHorizontalPadding,
  hasEditCoverPhoto,
  hasViewCoverPhoto,
  editCoverPhoto,
  viewCoverPhoto,
  editCoverExpandedHeight,
  coverTopOffset,
  headerOnlyHeight,
  coverScrollY,
  viewEntryOpacity,
  viewCoverOverlayOpacity,
  entryTitle,
  viewDateTime,
  viewCount,
  viewMoods = [],
  viewTags = [],
  canBringStickersForward,
  isFavorite,
  isSaving,
  onCancelEdit,
  onBringStickersForward,
  onToggleFavorite,
  onSaveEdit,
  onBack,
  onStartEdit,
  onDelete,
  onTakeCoverPhoto,
  onChooseCoverPhoto,
  onRemoveCoverPhoto,
}: EntryDetailHeaderCoverProps) {
  const theme = useTheme();
  const t = useTranslation();

  return (
    <>
      {isEditing ? (
        <DiaryEntryEditorHeader
          topInset={topInset}
          horizontalPadding={entryHorizontalPadding}
          title={t('entryEditTitle')}
          onCover
          left={(
            <IconCircleButton
              icon="close-circle-outline"
              onPress={onCancelEdit}
              accessibilityLabel={t('entryCancelEditingA11y')}
              iconSize={25}
              surface="overlay"
            />
          )}
          actions={(
            <>
              {canBringStickersForward && (
                <IconCircleButton
                  icon="layers"
                  onPress={onBringStickersForward}
                  style={styles.headerIcon}
                  accessibilityLabel={t('entryBringStickersForwardA11y')}
                  iconSize={20}
                  size="sm"
                  surface="overlay"
                />
              )}
              <IconCircleButton
                icon={isFavorite ? 'star' : 'star-outline'}
                onPress={onToggleFavorite}
                accessibilityLabel={isFavorite ? t('entryRemoveFavoriteA11y') : t('entryAddFavoriteA11y')}
                active={isFavorite}
                tone="warning"
                iconSize={24}
                surface="overlay"
              />
              <AccentPillButton
                onPress={onSaveEdit}
                disabled={isSaving}
                label={isSaving ? t('entrySaving') : t('entrySave')}
                accessibilityLabel={t('entrySaveChangesA11y')}
              />
            </>
          )}
        />
      ) : (
        <View
          style={[
            styles.header,
            hasViewCoverPhoto && styles.headerOnCover,
            {
              paddingTop: topInset + 4,
              backgroundColor: 'transparent',
              borderBottomColor: 'transparent',
            },
          ]}
        >
          <IconCircleButton icon="chevron-left" onPress={onBack} accessibilityLabel={t('entryBackA11y')} surface="overlay" />
          <View style={styles.headerDateSpacer} />
          <View style={styles.headerActions}>
            <IconCircleButton icon="pencil-outline" onPress={onStartEdit} accessibilityLabel={t('entryEditA11y')} surface="overlay" />
            <IconCircleButton icon="trash-can-outline" onPress={onDelete} accessibilityLabel={t('entryDeleteA11y')} destructive surface="overlay" />
          </View>
        </View>
      )}

      {isEditing || hasViewCoverPhoto ? (
        <View
          style={[
            styles.coverHeader,
            isEditing
              ? hasEditCoverPhoto
                ? styles.coverHeaderFullBleed
                : { top: coverTopOffset, paddingHorizontal: entryHorizontalPadding, backgroundColor: 'transparent' }
              : styles.coverHeaderFullBleed,
          ]}
        >
          <Animated.View style={!isEditing ? { opacity: viewEntryOpacity } : undefined}>
            {isEditing ? (
              <DiaryCoverPhotoPicker
                photo={editCoverPhoto}
                variant="entryHero"
                height={editCoverExpandedHeight}
                onTakePhoto={onTakeCoverPhoto}
                onChoosePhoto={onChooseCoverPhoto}
                onRemovePhoto={onRemoveCoverPhoto}
                scrollY={coverScrollY}
                containerStyle={hasEditCoverPhoto ? styles.viewCoverPicker : undefined}
                actionAreaTopInset={hasEditCoverPhoto ? headerOnlyHeight : 0}
              />
            ) : (
              <DiaryCoverPhotoPicker
                photo={viewCoverPhoto}
                editable={false}
                variant="entryHero"
                height={ENTRY_DETAIL_VIEW_COVER_EXPANDED_HEIGHT}
                scrollY={coverScrollY}
                containerStyle={styles.viewCoverPicker}
                transitionMode="replace"
              >
                <Animated.View style={[styles.coverEntryOverlay, { opacity: viewCoverOverlayOpacity }]}>
                  <Text preset="h2" numberOfLines={2} style={[styles.coverTitle, { color: theme.colors.stickerControlText }]}>
                    {entryTitle}
                  </Text>
                  <Text preset="caption" numberOfLines={1} style={[styles.coverDateTime, { color: theme.colors.stickerControlText }]}>
                    {viewDateTime}
                  </Text>
                </Animated.View>
                <Animated.View style={[styles.coverMetaOverlay, { opacity: viewCoverOverlayOpacity }]}>
                  <EntryMetaRow
                    variant="cover"
                    moods={viewMoods}
                    tags={viewTags}
                    style={styles.coverMetaBadges}
                    testID="entry-view-cover-meta-row"
                    moodTestID="entry-view-cover-mood"
                    tagTestID="entry-view-cover-tags"
                  />
                  <EntryViewCountBadge
                    count={viewCount}
                    accessibilityLabel={t('entryViewCountA11y').replace('{count}', String(viewCount))}
                    height={26}
                    minWidth={44}
                    iconSize={15}
                    style={styles.coverViewCountBadge}
                    testID="entry-view-count"
                  />
                </Animated.View>
              </DiaryCoverPhotoPicker>
            )}
          </Animated.View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerOnCover: {
    borderBottomWidth: 0,
  },
  headerDateSpacer: { flex: 1 },
  headerActions: { minWidth: 98, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  headerIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  coverHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 29,
    elevation: 29,
  },
  coverHeaderFullBleed: {
    top: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  viewCoverPicker: {
    borderWidth: 0,
    borderRadius: 0,
  },
  coverEntryOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  coverDateTime: {
    fontWeight: '700',
    flexShrink: 0,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 8,
  },
  coverViewCountBadge: {
    flexShrink: 0,
  },
  coverMetaOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coverMetaBadges: {
    flex: 1,
    minWidth: 0,
  },
});
