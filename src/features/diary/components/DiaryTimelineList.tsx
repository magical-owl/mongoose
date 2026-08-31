import { Fragment } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { formatDisplayDate } from '@shared/utils/dateFormat';
import type { CalendarDateFormat, EntryHierarchyMode } from '@/stores/useAppStore';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import type { Profile } from '@/features/profile/domain/Profile';
import { DiaryEntryView, type DiaryEntryViewMode } from './DiaryEntryView';

const HIERARCHY_INDENT = { year: 0, month: 12, date: 24 } as const;

interface DiaryTimelineListProps {
  readonly groupedEntries: readonly (readonly [string, readonly DiaryEntry[]])[];
  readonly mode: DiaryEntryViewMode;
  readonly profile?: Pick<Profile, 'displayName' | 'avatarUri'> | null;
  readonly calendarDateFormat: CalendarDateFormat;
  readonly entryHierarchyMode?: EntryHierarchyMode;
  readonly collapsible?: boolean;
  readonly collapsedYears?: ReadonlySet<string>;
  readonly collapsedMonths?: ReadonlySet<string>;
  readonly collapsedDates?: ReadonlySet<string>;
  readonly onToggleYear?: (year: string) => void;
  readonly onToggleMonth?: (month: string) => void;
  readonly onToggleDate?: (date: string) => void;
  readonly onDateGroupLayout?: (date: string, y: number) => void;
  readonly onEntryLayout?: (entryId: string, entryDate: string, y: number) => void;
  readonly onEntryRef?: (entryId: string, node: View | null) => void;
  readonly onEntryPress: (entry: DiaryEntry) => void | Promise<void>;
  readonly onAddReflection?: (entryId: string, text: string) => Promise<boolean>;
  readonly onReflectionInputFocus?: (entryId: string) => void;
  readonly onReflectionSummaryPress?: (entryId: string) => void;
}

function formatTimelineMonth(value: string): string {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(
    new Date(year, month - 1, 1, 12),
  );
}

export function DiaryTimelineList({
  groupedEntries,
  mode,
  profile,
  calendarDateFormat,
  entryHierarchyMode = 'date',
  collapsible = true,
  collapsedYears,
  collapsedMonths,
  collapsedDates,
  onToggleYear,
  onToggleMonth,
  onToggleDate,
  onDateGroupLayout,
  onEntryLayout,
  onEntryRef,
  onEntryPress,
  onAddReflection,
  onReflectionInputFocus,
  onReflectionSummaryPress,
}: DiaryTimelineListProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <>
      {groupedEntries.map(([date, dateEntries], index) => {
        const previousDate = groupedEntries[index - 1]?.[0];
        const isNewYear = !previousDate || previousDate.slice(0, 4) !== date.slice(0, 4);
        const isNewMonth = isNewYear || previousDate?.slice(0, 7) !== date.slice(0, 7);
        const yearKey = date.slice(0, 4);
        const monthKey = date.slice(0, 7);
        const isYearVisible = entryHierarchyMode === 'year-month-date';
        const isMonthVisible = entryHierarchyMode === 'year-month-date' || entryHierarchyMode === 'month-date';
        const isDateVisible = entryHierarchyMode !== 'none';
        const isYearCollapsed = collapsible && isYearVisible && Boolean(collapsedYears?.has(yearKey));
        const isMonthCollapsed = collapsible && isMonthVisible && Boolean(collapsedMonths?.has(monthKey));
        const isDateCollapsed = collapsible && isDateVisible && Boolean(collapsedDates?.has(date));

        return (
          <Fragment key={date}>
            {isNewYear && isYearVisible && (
              <TouchableOpacity
                onPress={() => onToggleYear?.(yearKey)}
                disabled={!collapsible || !onToggleYear}
                style={styles.yearGroupRow}
                accessibilityRole="button"
                accessibilityLabel={`${yearKey} year group`}
                accessibilityState={{ expanded: !isYearCollapsed, disabled: !collapsible || !onToggleYear }}
              >
                <Text preset="h2" style={[styles.yearHeading, { color: theme.colors.text }]}>
                  {yearKey}
                </Text>
                {collapsible ? <Ionicons name={isYearCollapsed ? 'chevron-forward' : 'chevron-down'} size={16} color={theme.colors.textSecondary} /> : null}
              </TouchableOpacity>
            )}
            {!isYearCollapsed && isMonthVisible && isNewMonth && (
              <TouchableOpacity
                onPress={() => onToggleMonth?.(monthKey)}
                disabled={!collapsible || !onToggleMonth}
                style={[styles.monthGroupRow, !isYearVisible && styles.flatMonthGroupRow]}
                accessibilityRole="button"
                accessibilityLabel={`${formatTimelineMonth(monthKey)} month group`}
                accessibilityState={{ expanded: !isMonthCollapsed, disabled: !collapsible || !onToggleMonth }}
              >
                <Text preset="label" style={[styles.monthHeading, { color: theme.colors.textSecondary }]}>
                  {formatTimelineMonth(monthKey)}
                </Text>
                {collapsible ? <Ionicons name={isMonthCollapsed ? 'chevron-forward' : 'chevron-down'} size={15} color={theme.colors.textSecondary} /> : null}
              </TouchableOpacity>
            )}
            {!isYearCollapsed && !isMonthCollapsed ? (
              <View
                style={[
                  styles.dateGroup,
                  mode !== 'timeline' && styles.compactDateGroup,
                  mode === 'feed' && styles.feedDateGroup,
                  !isDateVisible && styles.flatDateGroup,
                ]}
                onLayout={(event) => onDateGroupLayout?.(date, event.nativeEvent.layout.y)}
                testID={mode === 'feed' ? 'entry-feed-date-group' : undefined}
              >
                {isDateVisible ? (
                  <TouchableOpacity
                    onPress={() => onToggleDate?.(date)}
                    disabled={!collapsible || !onToggleDate}
                    style={[styles.dateHeadingRow, !isYearVisible && (entryHierarchyMode === 'month-date' ? styles.monthDateHeadingRow : styles.flatDateHeadingRow)]}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDisplayDate(date, calendarDateFormat)} date group`}
                    accessibilityState={{ expanded: !isDateCollapsed, disabled: !collapsible || !onToggleDate }}
                  >
                    <Text
                      preset="label"
                      style={[styles.dateHeading, { color: theme.colors.text }]}
                    >
                      {formatDisplayDate(date, calendarDateFormat)}
                    </Text>
                    {collapsible ? (
                      <Ionicons
                        name={isDateCollapsed ? 'chevron-forward' : 'chevron-down'}
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                    ) : null}
                  </TouchableOpacity>
                ) : null}
                {(!isDateVisible || !isDateCollapsed) && dateEntries.map((entry) => (
                  <View
                    key={entry.id}
                    collapsable={false}
                    ref={(node) => onEntryRef?.(entry.id, node)}
                    onLayout={(event) => onEntryLayout?.(entry.id, entry.date, event.nativeEvent.layout.y)}
                  >
                    <DiaryEntryView
                      entry={entry}
                      mode={mode}
                      profile={profile}
                      onPress={() => onEntryPress(entry)}
                      showDateColumn={!(mode === 'detailed' && isDateVisible)}
                      onAddReflection={onAddReflection}
                      onReflectionInputFocus={onReflectionInputFocus}
                      onReflectionSummaryPress={onReflectionSummaryPress}
                    />
                  </View>
                ))}
              </View>
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  dateGroup: {
    marginBottom: 6,
    marginLeft: HIERARCHY_INDENT.year,
  },
  compactDateGroup: {
    marginBottom: 0,
  },
  feedDateGroup: {
    marginLeft: 0,
  },
  flatDateGroup: {
    marginLeft: HIERARCHY_INDENT.year,
  },
  yearGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 0,
    paddingHorizontal: 0,
    paddingVertical: 6,
  },
  yearHeading: {
    margin: 0,
    fontWeight: '700',
  },
  monthGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: 3,
    marginLeft: 0,
    paddingLeft: HIERARCHY_INDENT.month,
    paddingVertical: 7,
  },
  flatMonthGroupRow: {
    paddingLeft: HIERARCHY_INDENT.year,
  },
  monthHeading: {
    margin: 0,
    fontSize: 14,
    fontWeight: '700',
  },
  dateHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingLeft: HIERARCHY_INDENT.date,
  },
  monthDateHeadingRow: {
    paddingLeft: HIERARCHY_INDENT.month,
  },
  flatDateHeadingRow: {
    paddingLeft: HIERARCHY_INDENT.year,
  },
  dateHeading: {
    margin: 0,
    fontSize: 15,
    fontWeight: '700',
  },
});
