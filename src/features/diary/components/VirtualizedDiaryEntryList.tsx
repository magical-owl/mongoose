import { forwardRef, useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { formatDisplayDate } from '@shared/utils/dateFormat';
import type { CalendarDateFormat, EntryHierarchyMode, HomeViewMode } from '@/stores/useAppStore';
import type { DiaryEntry, DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';
import type { Profile } from '@/features/profile/domain/Profile';
import type { Journal } from '@/features/journal/domain/Journal';
import { JournalSuggestionsFooter } from '@/features/journal/components/JournalSuggestionsFooter';
import { useTranslation } from '@/localization/i18n';
import { getTranslucentSurfaceColor } from '@/theme/surfaces';

import { DiaryEntryView, type DiaryEntryViewMode } from './DiaryEntryView';

const HIERARCHY_INDENT = { year: 0, month: 12, date: 24 } as const;

export type VirtualizedDiaryEntryListRow =
  | {
      readonly id: string;
      readonly type: 'year';
      readonly yearKey: string;
      readonly isCollapsed: boolean;
    }
  | {
      readonly id: string;
      readonly type: 'month';
      readonly monthKey: string;
      readonly isCollapsed: boolean;
      readonly isFlat: boolean;
    }
  | {
      readonly id: string;
      readonly type: 'date';
      readonly date: string;
      readonly isCollapsed: boolean;
      readonly isYearVisible: boolean;
      readonly entryHierarchyMode: EntryHierarchyMode;
    }
  | {
      readonly id: string;
      readonly type: 'entry';
      readonly entry: DiaryEntry;
      readonly isDateVisible: boolean;
    };

export type VirtualizedDiaryEntryListRef = FlatList<VirtualizedDiaryEntryListRow>;

interface VirtualizedDiaryEntryListProps {
  readonly entries: readonly DiaryEntry[];
  readonly totalEntryCount: number;
  readonly mode: HomeViewMode;
  readonly entryHierarchyMode: EntryHierarchyMode;
  readonly calendarDateFormat: CalendarDateFormat;
  readonly profile?: Pick<Profile, 'displayName' | 'avatarUri'> | null;
  readonly collapsedYears: ReadonlySet<string>;
  readonly collapsedMonths: ReadonlySet<string>;
  readonly collapsedDates: ReadonlySet<string>;
  readonly hasMoreEntries: boolean;
  readonly journals: readonly Journal[];
  readonly currentJournalId: string;
  readonly entryCountsByJournalId: ReadonlyMap<string, number>;
  readonly contentContainerStyle?: StyleProp<ViewStyle>;
  readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  readonly onToggleYear: (year: string) => void;
  readonly onToggleMonth: (month: string) => void;
  readonly onToggleDate: (date: string) => void;
  readonly onEntryPress: (entry: DiaryEntry) => void | Promise<void>;
  readonly onEntryLayout?: (entryId: string, entryDate: string, y: number) => void;
  readonly onDateGroupLayout?: (date: string, y: number) => void;
  readonly onEntryRef?: (entryId: string, node: View | null) => void;
  readonly onAddReflection?: (entryId: string, text: string, photo?: DiaryPhoto) => Promise<boolean>;
  readonly onReflectionInputFocus?: (entryId: string) => void;
  readonly onReflectionSummaryPress?: (entryId: string) => void;
  readonly onToggleMemoryReaction?: (entryId: string, reaction: MemoryReaction) => Promise<boolean>;
  readonly onPressJournalSuggestion: (journal: Journal) => void;
  readonly onPressSuggestionsTitle: () => void;
  readonly searchQuery: string;
  readonly keyboardDismissMode?: 'none' | 'interactive' | 'on-drag';
  readonly keyboardShouldPersistTaps?: boolean | 'always' | 'never' | 'handled';
}

function formatTimelineMonth(value: string): string {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(
    new Date(year, month - 1, 1, 12),
  );
}

function groupEntriesByDate(entries: readonly DiaryEntry[]): readonly (readonly [string, readonly DiaryEntry[]])[] {
  const groups = new Map<string, DiaryEntry[]>();
  entries.forEach((entry) => {
    const group = groups.get(entry.date);
    if (group) group.push(entry);
    else groups.set(entry.date, [entry]);
  });
  return Array.from(groups.entries());
}

function buildRows({
  groupedEntries,
  entryHierarchyMode,
  collapsedYears,
  collapsedMonths,
  collapsedDates,
}: {
  readonly groupedEntries: readonly (readonly [string, readonly DiaryEntry[]])[];
  readonly entryHierarchyMode: EntryHierarchyMode;
  readonly collapsedYears: ReadonlySet<string>;
  readonly collapsedMonths: ReadonlySet<string>;
  readonly collapsedDates: ReadonlySet<string>;
}): VirtualizedDiaryEntryListRow[] {
  const rows: VirtualizedDiaryEntryListRow[] = [];

  groupedEntries.forEach(([date, dateEntries], index) => {
    const previousDate = groupedEntries[index - 1]?.[0];
    const isNewYear = !previousDate || previousDate.slice(0, 4) !== date.slice(0, 4);
    const isNewMonth = isNewYear || previousDate?.slice(0, 7) !== date.slice(0, 7);
    const yearKey = date.slice(0, 4);
    const monthKey = date.slice(0, 7);
    const isYearVisible = entryHierarchyMode === 'year-month-date';
    const isMonthVisible = entryHierarchyMode === 'year-month-date' || entryHierarchyMode === 'month-date';
    const isDateVisible = entryHierarchyMode !== 'none';
    const isYearCollapsed = isYearVisible && collapsedYears.has(yearKey);
    const isMonthCollapsed = isMonthVisible && collapsedMonths.has(monthKey);
    const isDateCollapsed = isDateVisible && collapsedDates.has(date);

    if (isNewYear && isYearVisible) {
      rows.push({ id: `year-${yearKey}`, type: 'year', yearKey, isCollapsed: isYearCollapsed });
    }
    if (isYearCollapsed) return;

    if (isMonthVisible && isNewMonth) {
      rows.push({ id: `month-${monthKey}`, type: 'month', monthKey, isCollapsed: isMonthCollapsed, isFlat: !isYearVisible });
    }
    if (isMonthCollapsed) return;

    if (isDateVisible) {
      rows.push({ id: `date-${date}`, type: 'date', date, isCollapsed: isDateCollapsed, isYearVisible, entryHierarchyMode });
    }

    if (!isDateVisible || !isDateCollapsed) {
      dateEntries.forEach((entry) => {
        rows.push({ id: `entry-${entry.id}`, type: 'entry', entry, isDateVisible });
      });
    }
  });

  return rows;
}

export const VirtualizedDiaryEntryList = forwardRef<VirtualizedDiaryEntryListRef, VirtualizedDiaryEntryListProps>(
  (
    {
      entries,
      totalEntryCount,
      mode,
      entryHierarchyMode,
      calendarDateFormat,
      profile,
      collapsedYears,
      collapsedMonths,
      collapsedDates,
      hasMoreEntries,
      journals,
      currentJournalId,
      entryCountsByJournalId,
      contentContainerStyle,
      onScroll,
      onToggleYear,
      onToggleMonth,
      onToggleDate,
      onEntryPress,
      onEntryLayout,
      onDateGroupLayout,
      onEntryRef,
      onAddReflection,
      onReflectionInputFocus,
      onReflectionSummaryPress,
      onToggleMemoryReaction,
      onPressJournalSuggestion,
      onPressSuggestionsTitle,
      searchQuery,
      keyboardDismissMode,
      keyboardShouldPersistTaps,
    },
    ref,
  ) => {
    const theme = useTheme();
    const t = useTranslation();
    const translucentSurfaceColor = getTranslucentSurfaceColor(theme);
    const effectiveEntryHierarchyMode = mode === 'timeline' ? entryHierarchyMode : 'none';
    const groupedEntries = useMemo(() => groupEntriesByDate(entries), [entries]);
    const rows = useMemo(
      () => buildRows({
        groupedEntries,
        entryHierarchyMode: effectiveEntryHierarchyMode,
        collapsedYears,
        collapsedMonths,
        collapsedDates,
      }),
      [collapsedDates, collapsedMonths, collapsedYears, effectiveEntryHierarchyMode, groupedEntries],
    );

    const renderEmptyEntries = useCallback(() => (
      <View style={[styles.emptyPanel, { backgroundColor: translucentSurfaceColor, borderColor: theme.colors.border }]}>
        <View style={[styles.emptyIconHalo, { backgroundColor: theme.colors.tint + '16' }]}>
          <Ionicons name={searchQuery.trim() ? 'search-outline' : 'pencil-outline'} size={26} color={theme.colors.tint} />
        </View>
        <Text preset="label" color="text" style={styles.emptyPrompt}>
          {searchQuery.trim() ? t('homeNoMatchingEntries') : t('homeEmptyPrompt')}
        </Text>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {searchQuery.trim() ? t('homeSearchPlaceholder') : t('homeNoEntriesYet')}
        </Text>
      </View>
    ), [searchQuery, t, theme.colors.border, theme.colors.textSecondary, theme.colors.tint, translucentSurfaceColor]);

    const renderFooter = useCallback(() => (
      !hasMoreEntries && totalEntryCount > 0 ? (
        <JournalSuggestionsFooter
          journals={journals}
          currentJournalId={currentJournalId}
          entryCountsByJournalId={entryCountsByJournalId}
          onPressJournal={onPressJournalSuggestion}
          onPressTitle={onPressSuggestionsTitle}
        />
      ) : null
    ), [currentJournalId, entryCountsByJournalId, hasMoreEntries, journals, onPressJournalSuggestion, onPressSuggestionsTitle, totalEntryCount]);

    const renderItem = useCallback<ListRenderItem<VirtualizedDiaryEntryListRow>>(({ item }) => {
      if (item.type === 'year') {
        return (
          <TouchableOpacity
            onPress={() => onToggleYear(item.yearKey)}
            style={styles.yearGroupRow}
            accessibilityRole="button"
            accessibilityLabel={`${item.yearKey} year group`}
            accessibilityState={{ expanded: !item.isCollapsed }}
          >
            <Text preset="h2" style={[styles.yearHeading, { color: theme.colors.text }]}>
              {item.yearKey}
            </Text>
            <Ionicons name={item.isCollapsed ? 'chevron-forward' : 'chevron-down'} size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        );
      }

      if (item.type === 'month') {
        const monthLabel = formatTimelineMonth(item.monthKey);
        return (
          <TouchableOpacity
            onPress={() => onToggleMonth(item.monthKey)}
            style={[styles.monthGroupRow, item.isFlat && styles.flatMonthGroupRow]}
            accessibilityRole="button"
            accessibilityLabel={`${monthLabel} month group`}
            accessibilityState={{ expanded: !item.isCollapsed }}
          >
            <Text preset="label" style={[styles.monthHeading, { color: theme.colors.textSecondary }]}>
              {monthLabel}
            </Text>
            <Ionicons name={item.isCollapsed ? 'chevron-forward' : 'chevron-down'} size={15} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        );
      }

      if (item.type === 'date') {
        return (
          <TouchableOpacity
            onPress={() => onToggleDate(item.date)}
            style={[
              styles.dateHeadingRow,
              !item.isYearVisible && (item.entryHierarchyMode === 'month-date' ? styles.monthDateHeadingRow : styles.flatDateHeadingRow),
            ]}
            onLayout={(event) => onDateGroupLayout?.(item.date, event.nativeEvent.layout.y)}
            accessibilityRole="button"
            accessibilityLabel={`${formatDisplayDate(item.date, calendarDateFormat)} date group`}
            accessibilityState={{ expanded: !item.isCollapsed }}
          >
            <Text preset="label" style={[styles.dateHeading, { color: theme.colors.text }]}>
              {formatDisplayDate(item.date, calendarDateFormat)}
            </Text>
            <Ionicons name={item.isCollapsed ? 'chevron-forward' : 'chevron-down'} size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        );
      }

      return (
        <View
          collapsable={false}
          ref={(node) => onEntryRef?.(item.entry.id, node)}
          onLayout={(event) => onEntryLayout?.(item.entry.id, item.entry.date, event.nativeEvent.layout.y)}
          style={[
            styles.entryListRow,
            mode !== 'timeline' && styles.compactEntryListRow,
            mode === 'feed' && styles.feedEntryListRow,
            !item.isDateVisible && styles.flatEntryListRow,
          ]}
        >
          <DiaryEntryView
            entry={item.entry}
            mode={mode as DiaryEntryViewMode}
            profile={profile}
            onPress={() => onEntryPress(item.entry)}
            showDateColumn={!(mode === 'detailed' && item.isDateVisible)}
            onAddReflection={mode === 'timeline' || mode === 'feed' ? onAddReflection : undefined}
            onReflectionInputFocus={mode === 'timeline' || mode === 'feed' ? onReflectionInputFocus : undefined}
            onReflectionSummaryPress={mode === 'timeline' || mode === 'feed' ? undefined : onReflectionSummaryPress}
            onToggleMemoryReaction={onToggleMemoryReaction}
          />
        </View>
      );
    }, [
      calendarDateFormat,
      mode,
      onAddReflection,
      onDateGroupLayout,
      onEntryLayout,
      onEntryPress,
      onEntryRef,
      onReflectionInputFocus,
      onReflectionSummaryPress,
      onToggleMemoryReaction,
      onToggleDate,
      onToggleMonth,
      onToggleYear,
      profile,
      theme.colors.text,
      theme.colors.textSecondary,
    ]);

    return (
      <FlatList
        ref={ref}
        data={totalEntryCount === 0 ? [] : rows}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyEntries}
        ListFooterComponent={renderFooter}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={contentContainerStyle}
        keyboardDismissMode={keyboardDismissMode}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={false}
        initialNumToRender={9}
        maxToRenderPerBatch={9}
        windowSize={7}
        removeClippedSubviews
      />
    );
  },
);

VirtualizedDiaryEntryList.displayName = 'VirtualizedDiaryEntryList';

const styles = StyleSheet.create({
  yearGroupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 10,
    marginLeft: HIERARCHY_INDENT.year,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  yearHeading: {
    fontWeight: '800',
  },
  monthGroupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 8,
    marginLeft: HIERARCHY_INDENT.month,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  flatMonthGroupRow: {
    marginLeft: 0,
  },
  monthHeading: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 6,
    marginLeft: HIERARCHY_INDENT.date,
    paddingHorizontal: 20,
  },
  monthDateHeadingRow: {
    marginLeft: HIERARCHY_INDENT.month,
  },
  flatDateHeadingRow: {
    marginLeft: 0,
  },
  dateHeading: {
    fontWeight: '800',
  },
  entryListRow: {
    marginBottom: 6,
    marginLeft: HIERARCHY_INDENT.year,
  },
  compactEntryListRow: {
    marginBottom: 0,
  },
  feedEntryListRow: {
    marginLeft: 0,
  },
  flatEntryListRow: {
    marginLeft: 0,
  },
  emptyPanel: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 220,
    padding: 24,
  },
  emptyIconHalo: {
    alignItems: 'center',
    borderRadius: 29,
    height: 58,
    justifyContent: 'center',
    marginBottom: 16,
    width: 58,
  },
  emptyPrompt: {
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
