import { useCallback } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View, type ListRenderItem } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AccentPillButton } from '@shared/components/AccentPillButton';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { Text } from '@shared/components/Text';
import { useTheme } from '@providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import type { JournalColumnCount } from '@/stores/useAppStore';
import { getTranslucentSurfaceColor } from '@/theme/surfaces';

import { getJournalCoverImageSource } from '../domain/JournalBackgrounds';

const JOURNAL_GRID_GAP = 12;
const JOURNAL_COVER_ASPECT_RATIO = 0.96;
const JOURNAL_COVER_WIDE_ASPECT_RATIO = 2.11;

export interface JournalHomeItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly count: number;
  readonly canRename: boolean;
  readonly coverImageUri?: string;
  readonly coverImageWidth?: number;
  readonly coverImageHeight?: number;
}

interface JournalHomeListProps {
  readonly items: readonly JournalHomeItem[];
  readonly totalItemCount: number;
  readonly columnCount: JournalColumnCount;
  readonly cardWidth: number;
  readonly openOptionsId: string | null;
  readonly assigningCoverJournalId: string | null;
  readonly deletingJournalId: string | null;
  readonly contentBottomPadding: number;
  readonly onPressJournal: (journal: JournalHomeItem) => void;
  readonly onToggleOptions: (journalId: string) => void;
  readonly onEditJournal: (journalId: string) => void;
  readonly onDeleteJournal: (journalId: string) => void;
  readonly onSetCover: (journalId: string) => void;
  readonly onRemoveCover: (journalId: string) => void;
  readonly onCreateJournal: () => void;
}

function journalEntryLabelText(count: number, t: ReturnType<typeof useTranslation>): string {
  return count === 1 ? t('journalEntryLabelOne') : t('journalEntryLabelMany');
}

export function JournalHomeList({
  items,
  totalItemCount,
  columnCount,
  cardWidth,
  openOptionsId,
  assigningCoverJournalId,
  deletingJournalId,
  contentBottomPadding,
  onPressJournal,
  onToggleOptions,
  onEditJournal,
  onDeleteJournal,
  onSetCover,
  onRemoveCover,
  onCreateJournal,
}: JournalHomeListProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const wideCover = columnCount === 1;
  const compactCover = columnCount >= 3;
  const denseCover = columnCount >= 4;
  const translucentSurfaceColor = getTranslucentSurfaceColor(theme);

  const renderJournalOptions = useCallback((journal: JournalHomeItem) => {
    const isOpen = openOptionsId === journal.id;

    return (
      <View style={styles.optionsWrap}>
        <IconCircleButton
          icon="dots-horizontal"
          onPress={(event) => {
            event.stopPropagation();
            onToggleOptions(journal.id);
          }}
          accessibilityLabel={t('journalOptionsA11y')}
          accessibilityState={{ expanded: isOpen }}
          active={isOpen}
          size="sm"
          surface="overlay"
          iconSize={19}
        />
        {isOpen ? (
          <View style={[styles.optionsMenu, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            {journal.canRename ? (
              <>
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    onEditJournal(journal.id);
                  }}
                  style={styles.optionsItem}
                  accessibilityRole="button"
                  accessibilityLabel={t('journalRenameA11y')}
                >
                  <Ionicons name="pencil-outline" size={17} color={theme.colors.textSecondary} />
                  <Text preset="caption" color="text" style={styles.optionsText}>{t('journalEdit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    onDeleteJournal(journal.id);
                  }}
                  style={styles.optionsItem}
                  accessibilityRole="button"
                  accessibilityLabel={t('journalDeleteA11y')}
                  disabled={deletingJournalId === journal.id}
                >
                  <Ionicons name="trash-outline" size={17} color={theme.colors.error} />
                  <Text preset="caption" style={[styles.optionsText, { color: theme.colors.error }]}>{t('entryDelete')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    onSetCover(journal.id);
                  }}
                  style={styles.optionsItem}
                  accessibilityRole="button"
                  accessibilityLabel={t('journalSetCoverA11y')}
                  disabled={assigningCoverJournalId === journal.id}
                >
                  <Ionicons name="image-outline" size={17} color={theme.colors.textSecondary} />
                  <Text preset="caption" color="text" style={styles.optionsText}>{t('journalSetCover')}</Text>
                </TouchableOpacity>
                {journal.coverImageUri ? (
                  <TouchableOpacity
                    onPress={(event) => {
                      event.stopPropagation();
                      onRemoveCover(journal.id);
                    }}
                    style={styles.optionsItem}
                    accessibilityRole="button"
                    accessibilityLabel={t('journalRemoveCoverA11y')}
                    disabled={assigningCoverJournalId === journal.id}
                  >
                    <Ionicons name="close-circle-outline" size={17} color={theme.colors.textSecondary} />
                    <Text preset="caption" color="text" style={styles.optionsText}>{t('journalRemoveCover')}</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        ) : null}
      </View>
    );
  }, [
    assigningCoverJournalId,
    deletingJournalId,
    onDeleteJournal,
    onEditJournal,
    onRemoveCover,
    onSetCover,
    onToggleOptions,
    openOptionsId,
    t,
    theme.colors.background,
    theme.colors.border,
    theme.colors.error,
    theme.colors.textSecondary,
  ]);

  const renderEmptyList = useCallback(() => (
    totalItemCount === 0 ? (
      <View style={[styles.emptyState, { borderColor: theme.colors.border, backgroundColor: translucentSurfaceColor }]}>
        <Ionicons name="journal-outline" size={34} color={theme.colors.tint} />
        <Text preset="label" color="text" style={styles.emptyTitle}>{t('journalsEmptyTitle')}</Text>
        <Text preset="bodySmall" color="textSecondary" style={styles.emptyBody}>{t('journalsEmptyMessage')}</Text>
        <AccentPillButton label={t('journalCreate')} onPress={onCreateJournal} style={styles.emptyButton} />
      </View>
    ) : (
      <View style={[styles.emptyState, { borderColor: theme.colors.border, backgroundColor: translucentSurfaceColor }]}>
        <Ionicons name="search-outline" size={34} color={theme.colors.tint} />
        <Text preset="label" color="text" style={styles.emptyTitle}>{t('journalNoMatchingJournals')}</Text>
      </View>
    )
  ), [onCreateJournal, t, theme.colors.border, theme.colors.tint, totalItemCount, translucentSurfaceColor]);

  const renderItem = useCallback<ListRenderItem<JournalHomeItem>>(({ item: journal }) => {
    const journalCoverSource = getJournalCoverImageSource(journal.coverImageUri);

    return (
      <TouchableOpacity
        onPress={() => onPressJournal(journal)}
        style={[
          styles.card,
          openOptionsId === journal.id && styles.cardRaised,
          { width: cardWidth },
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
        accessibilityRole="button"
      >
        {renderJournalOptions(journal)}
        <View style={[
          styles.imageFrame,
          wideCover && styles.imageFrameWide,
          { backgroundColor: theme.colors.tint + '18' },
        ]}>
          {journalCoverSource ? (
            <Image source={journalCoverSource} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="book-outline" size={34} color={theme.colors.tint} />
            </View>
          )}
          <View style={[
            styles.countMeta,
            compactCover && styles.countMetaCompact,
            denseCover && styles.countMetaDense,
          ]}>
            <Text
              preset="caption"
              dynamicType={false}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              numberOfLines={1}
              style={[
                styles.countLabel,
                compactCover && styles.countLabelCompact,
                denseCover && styles.countLabelDense,
                { color: theme.colors.stickerControlText },
              ]}
            >
              {denseCover ? journal.count : `${journal.count} ${journalEntryLabelText(journal.count, t)}`}
            </Text>
          </View>
        </View>
        <View style={[
          styles.footer,
          wideCover && styles.footerWide,
          compactCover && styles.footerCompact,
        ]}>
          <View style={styles.copy}>
            <Text
              preset="h3"
              color="text"
              numberOfLines={denseCover ? 1 : 2}
              style={[
                styles.title,
                wideCover && styles.titleWide,
                compactCover && styles.titleCompact,
                denseCover && styles.titleDense,
              ]}
            >
              {journal.title}
            </Text>
            {journal.description && !denseCover ? (
              <Text
                preset="caption"
                color="textSecondary"
                numberOfLines={wideCover ? 1 : 2}
                style={[
                  styles.description,
                  compactCover && styles.descriptionCompact,
                ]}
              >
                {journal.description}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [
    cardWidth,
    compactCover,
    denseCover,
    onPressJournal,
    openOptionsId,
    renderJournalOptions,
    t,
    theme.colors.border,
    theme.colors.stickerControlText,
    theme.colors.surface,
    theme.colors.tint,
    wideCover,
  ]);

  return (
    <FlatList
      key={columnCount}
      data={items}
      keyExtractor={(journal) => journal.id}
      renderItem={renderItem}
      numColumns={columnCount}
      columnWrapperStyle={columnCount > 1 ? styles.gridRow : undefined}
      contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmptyList}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  gridRow: {
    gap: JOURNAL_GRID_GAP,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: JOURNAL_GRID_GAP,
    position: 'relative',
  },
  cardRaised: {
    elevation: 20,
    zIndex: 20,
  },
  imageFrame: {
    alignItems: 'center',
    aspectRatio: JOURNAL_COVER_ASPECT_RATIO,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  imageFrameWide: {
    aspectRatio: JOURNAL_COVER_WIDE_ASPECT_RATIO,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  countMeta: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
    borderRadius: 6,
    bottom: 10,
    flexDirection: 'row',
    gap: 4,
    left: 10,
    maxWidth: '82%',
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: 'absolute',
  },
  countMetaCompact: {
    bottom: 8,
    gap: 3,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  countMetaDense: {
    bottom: 6,
    left: 6,
  },
  countLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  countLabelCompact: {
    fontSize: 11,
    lineHeight: 13,
  },
  countLabelDense: {
    fontSize: 10,
    lineHeight: 12,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 76,
    padding: 10,
  },
  footerWide: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  footerCompact: {
    minHeight: 48,
    padding: 7,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: '800',
    lineHeight: 22,
  },
  titleWide: {
    fontSize: 18,
    lineHeight: 23,
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  titleDense: {
    fontSize: 12,
    lineHeight: 15,
  },
  description: {
    lineHeight: 16,
    marginTop: 3,
  },
  descriptionCompact: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  optionsWrap: {
    alignItems: 'flex-end',
    elevation: 30,
    position: 'absolute',
    right: 6,
    top: 6,
    zIndex: 30,
  },
  optionsMenu: {
    borderRadius: 8,
    borderWidth: 1,
    elevation: 24,
    minWidth: 154,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  optionsItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 36,
    paddingHorizontal: 10,
  },
  optionsText: {
    flex: 1,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 22,
  },
  emptyTitle: {
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 12,
  },
  emptyBody: {
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 18,
  },
});
