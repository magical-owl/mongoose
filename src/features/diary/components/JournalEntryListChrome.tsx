import {
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { useTheme } from '@providers/ThemeProvider';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { Text } from '@shared/components/Text';
import type { EntryHierarchyMode, HomeViewMode } from '@/stores/useAppStore';
import { homeViewModeLabel, useTranslation } from '@/localization/i18n';

import {
  JournalEntryListDrawer,
  type JournalEntryDrawerPanel,
  type JournalEntryFilterOptions,
} from './JournalEntryListDrawer';

export const JOURNAL_COVER_EXPANDED_HEIGHT = 254;
export const JOURNAL_COVER_COLLAPSED_EXTRA_HEIGHT = 12;
export const JOURNAL_HEADER_TOP_PADDING = 16;
export const JOURNAL_HEADER_ROW_HEIGHT = 44;
export const JOURNAL_HEADER_BOTTOM_GAP = 14;

const JOURNAL_VIEW_PILL_HEIGHT = JOURNAL_HEADER_ROW_HEIGHT;

interface DrawerProfile {
  readonly displayName: string;
  readonly avatarUri?: string;
}

interface JournalEntryListChromeProps {
  readonly isDrawerOpen: boolean;
  readonly drawerProfile: DrawerProfile;
  readonly topInset: number;
  readonly bottomInset: number;
  readonly hasJournalCover: boolean;
  readonly journalCoverImageSource: ImageSourcePropType | null;
  readonly journalCoverHeight: Animated.AnimatedInterpolation<number> | number;
  readonly journalCoverOverlayOpacity: Animated.AnimatedInterpolation<number> | number;
  readonly journalTitle: string;
  readonly entryCount: number;
  readonly selectableViewModes: readonly HomeViewMode[];
  readonly selectedViewModeIndex: number;
  readonly entryHierarchyMode: EntryHierarchyMode;
  readonly expandedFilter: JournalEntryDrawerPanel;
  readonly filterOptions: JournalEntryFilterOptions;
  readonly search: string;
  readonly filterDate: string;
  readonly filterTag: string;
  readonly filterMood: string;
  readonly favoritesOnly: boolean;
  readonly moodColor: (mood: string) => string;
  readonly onCloseDrawer: () => void;
  readonly onOpenDrawer: () => void;
  readonly onProfilePress: () => void;
  readonly onNavigateBack: () => void;
  readonly onCreateEntry: () => void;
  readonly onNavigateSettings: () => void;
  readonly onSelectViewMode: (index: number, mode: HomeViewMode) => void;
  readonly onChangeExpandedFilter: (filter: JournalEntryDrawerPanel) => void;
  readonly onChangeSearch: (search: string) => void;
  readonly onChangeEntryHierarchyMode: (mode: EntryHierarchyMode) => void;
  readonly onChangeFilterDate: (date: string) => void;
  readonly onChangeFilterTag: (tag: string) => void;
  readonly onChangeFilterMood: (mood: string) => void;
  readonly onToggleFavoritesOnly: () => void;
  readonly onClearFilters: () => void;
}

export function JournalEntryListChrome({
  isDrawerOpen,
  drawerProfile,
  topInset,
  bottomInset,
  hasJournalCover,
  journalCoverImageSource,
  journalCoverHeight,
  journalCoverOverlayOpacity,
  journalTitle,
  entryCount,
  selectableViewModes,
  selectedViewModeIndex,
  entryHierarchyMode,
  expandedFilter,
  filterOptions,
  search,
  filterDate,
  filterTag,
  filterMood,
  favoritesOnly,
  moodColor,
  onCloseDrawer,
  onOpenDrawer,
  onProfilePress,
  onNavigateBack,
  onCreateEntry,
  onNavigateSettings,
  onSelectViewMode,
  onChangeExpandedFilter,
  onChangeSearch,
  onChangeEntryHierarchyMode,
  onChangeFilterDate,
  onChangeFilterTag,
  onChangeFilterMood,
  onToggleFavoritesOnly,
  onClearFilters,
}: JournalEntryListChromeProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();

  return (
    <>
      <JournalEntryListDrawer
        visible={isDrawerOpen}
        profile={drawerProfile}
        topInset={topInset}
        bottomInset={bottomInset}
        entryHierarchyMode={entryHierarchyMode}
        expandedPanel={expandedFilter}
        filterOptions={filterOptions}
        search={search}
        filterDate={filterDate}
        filterTag={filterTag}
        filterMood={filterMood}
        favoritesOnly={favoritesOnly}
        moodColor={moodColor}
        onClose={onCloseDrawer}
        onProfilePress={onProfilePress}
        onNavigateSettings={onNavigateSettings}
        onChangeExpandedPanel={onChangeExpandedFilter}
        onChangeSearch={onChangeSearch}
        onChangeEntryHierarchyMode={onChangeEntryHierarchyMode}
        onChangeFilterDate={onChangeFilterDate}
        onChangeFilterTag={onChangeFilterTag}
        onChangeFilterMood={onChangeFilterMood}
        onToggleFavoritesOnly={onToggleFavoritesOnly}
        onClearFilters={onClearFilters}
      />

      <View
        style={[
          styles.fixedHeader,
          hasJournalCover ? styles.fixedHeaderWithCover : { paddingTop: topInset + JOURNAL_HEADER_TOP_PADDING },
        ]}
      >
        {journalCoverImageSource ? (
          <Animated.View
            style={[
              styles.journalCoverContext,
              {
                height: journalCoverHeight,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Image
              source={journalCoverImageSource}
              style={styles.journalCoverImage}
              resizeMode="cover"
              accessibilityRole="image"
              accessibilityLabel={journalTitle}
            />
            <Animated.View style={[styles.journalCoverContextOverlay, { opacity: journalCoverOverlayOpacity }]}>
              <View pointerEvents="none" style={styles.journalCoverContextShade} />
              <View style={styles.journalCoverContextTitleBlock}>
                <Text preset="label" numberOfLines={1} style={[styles.journalCoverContextTitle, { color: theme.colors.stickerControlText }]}>
                  {journalTitle}
                </Text>
              </View>
              <View style={styles.journalCoverContextMetaBlock}>
                <Text preset="caption" numberOfLines={1} style={[styles.journalCoverContextMeta, { color: theme.colors.stickerControlText }]}>
                  {entryCount === 1 ? t('journalEntryCountOne') : t('journalEntryCountMany').replace('{count}', String(entryCount))}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>
        ) : null}

        <View
          style={[
            styles.headerRow,
            hasJournalCover && styles.headerRowOnCover,
            hasJournalCover && { paddingTop: topInset + JOURNAL_HEADER_TOP_PADDING },
          ]}
        >
          <View style={[styles.headerSide, styles.headerSideLeft]}>
            <IconCircleButton icon="chevron-left" onPress={onNavigateBack} accessibilityLabel={t('entryBackA11y')} surface={hasJournalCover ? 'overlay' : 'surface'} />
          </View>
          <View
            style={[
              styles.viewModePill,
              {
                backgroundColor: hasJournalCover ? 'rgba(0, 0, 0, 0.56)' : theme.colors.surface,
                borderColor: hasJournalCover ? theme.colors.stickerControlText + '40' : theme.colors.border,
              },
            ]}
          >
            {selectableViewModes.map((mode, index) => {
              const selected = selectedViewModeIndex === index;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => onSelectViewMode(index, mode)}
                  style={[styles.viewModeButton, selected && { backgroundColor: theme.colors.tint }]}
                  accessibilityRole="tab"
                  accessibilityLabel={homeViewModeLabel(mode, t)}
                  accessibilityState={{ selected }}
                >
                  <Text
                    preset="caption"
                    style={[
                      styles.viewModeButtonText,
                      { color: selected || hasJournalCover ? theme.colors.stickerControlText : theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {homeViewModeLabel(mode, t)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.headerSide, styles.headerSideRight]}>
            <IconCircleButton
              icon="plus"
              onPress={onCreateEntry}
              accessibilityLabel={t('entryCreateTitle')}
              surface={hasJournalCover ? 'overlay' : 'surface'}
            />
            <IconCircleButton icon="menu" onPress={onOpenDrawer} accessibilityLabel={t('homeDrawerOpenA11y')} surface={hasJournalCover ? 'overlay' : 'surface'} />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    elevation: 30,
    left: 0,
    paddingHorizontal: 20,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 30,
  },
  fixedHeaderWithCover: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  journalCoverContext: {
    borderBottomWidth: 1,
    borderRadius: 0,
    overflow: 'hidden',
  },
  journalCoverImage: {
    bottom: 0,
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
  },
  journalCoverContextOverlay: {
    alignItems: 'center',
    bottom: 18,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    left: 20,
    position: 'absolute',
    right: 20,
  },
  journalCoverContextShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
    bottom: -18,
    left: -20,
    position: 'absolute',
    right: -20,
    top: -20,
  },
  journalCoverContextTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  journalCoverContextMetaBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '38%',
  },
  journalCoverContextTitle: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 23,
    textShadowColor: 'rgba(0, 0, 0, 0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  journalCoverContextMeta: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    height: JOURNAL_HEADER_ROW_HEIGHT,
    justifyContent: 'space-between',
    marginBottom: JOURNAL_HEADER_BOTTOM_GAP,
  },
  headerRowOnCover: {
    height: undefined,
    left: 20,
    marginBottom: 0,
    minHeight: JOURNAL_HEADER_ROW_HEIGHT,
    position: 'absolute',
    right: 20,
    top: 0,
    zIndex: 3,
  },
  headerSide: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  headerSideLeft: {
    width: 44,
  },
  headerSideRight: {
    justifyContent: 'flex-end',
    width: 94,
  },
  viewModePill: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: JOURNAL_VIEW_PILL_HEIGHT,
    maxWidth: 260,
    minWidth: 0,
    padding: 4,
  },
  viewModeButton: {
    alignItems: 'center',
    borderRadius: 17,
    flex: 1,
    height: 34,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 8,
  },
  viewModeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
});
