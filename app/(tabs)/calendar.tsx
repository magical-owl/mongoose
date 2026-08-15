import { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useAppStore } from '@/stores/useAppStore';
import { stripHtml } from '@shared/utils/html';
import { getMoodEmoji } from '@/ai/Mood';


export default function CalendarScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, isLoading, refresh } = useDiary();
  const setSelectedCalendarDate = useAppStore((state) => state.setSelectedCalendarDate);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]!;
  });

  useFocusEffect(
    useCallback(() => {
      refresh();
      setSelectedCalendarDate(selectedDateStr);
    }, [refresh, selectedDateStr, setSelectedCalendarDate])
  );

  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setSelectedCalendarDate(dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const entryDateMap = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [entries]);

  const selectedDayEntries = entryDateMap.get(selectedDateStr) || [];

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.colors.background }]}>
      {isLoading ? null : (
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={[styles.heading, { color: theme.colors.text }]}>
            Calendar
          </Text>

          {/* Calendar Card Container */}
          <View
            style={[
              styles.calendarCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            {/* Month Navigation Header */}
            <View style={styles.monthHeaderRow}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.monthNavBtn}
                accessibilityLabel="Previous month"
                accessibilityRole="button"
              >
                <Text style={[styles.monthNavArrow, { color: theme.colors.text }]}>‹</Text>
              </TouchableOpacity>

              <Text style={[styles.monthTitle, { color: theme.colors.text }]}>
                {monthName}
              </Text>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.monthNavBtn}
                accessibilityLabel="Next month"
                accessibilityRole="button"
              >
                <Text style={[styles.monthNavArrow, { color: theme.colors.text }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday Row */}
            <View style={styles.gridRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <Text key={d} style={[styles.gridCellHeader, { color: theme.colors.textSecondary }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Month Days Grid */}
            <View style={styles.gridRow}>
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.gridCell} />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayNumStr = day < 10 ? `0${day}` : `${day}`;
                const monthNumStr = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
                const dateStr = `${year}-${monthNumStr}-${dayNumStr}`;

                const isSelected = dateStr === selectedDateStr;
                const dayEntries = entryDateMap.get(dateStr) || [];
                const hasEntries = dayEntries.length > 0;
                const hasMood = dayEntries.some((e) => !!e.manualMood);

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.gridCell,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.tint
                          : hasEntries
                            ? `${theme.colors.tint}22`
                            : 'transparent',
                        borderColor: isSelected
                          ? theme.colors.tint
                          : hasEntries
                            ? theme.colors.tint
                            : 'transparent',
                        borderWidth: hasEntries || isSelected ? 1 : 0,
                      },
                    ]}
                    onPress={() => handleSelectDate(dateStr)}
                    accessibilityLabel={`${day} ${monthName}${hasEntries ? ', has entries' : ''}`}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          fontWeight: isSelected || hasEntries ? '700' : '400',
                          color: isSelected
                            ? theme.colors.background
                            : hasEntries
                              ? theme.colors.tint
                              : theme.colors.text,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                    {hasEntries && (
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.background
                              : hasMood
                                ? theme.colors.tint
                                : theme.colors.tint,
                          },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Selected Day Entries Header */}
          {/* <Text style={[styles.subHeading, { color: theme.colors.text }]}>
          📝 Entries on {selectedDateStr}
        </Text> */}

          {/* Entries List for Selected Date (Matches original reference layout 1:1) */}
          {selectedDayEntries.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No entries on this date.
            </Text>
          ) : (
            selectedDayEntries.map((item) => {
              const hasMood = !!item.manualMood;
              const moodEmoji = hasMood ? getMoodEmoji(item.manualMood!) : null;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/entry/${item.id}`)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderLeftWidth: hasMood ? 4 : 1,
                      borderLeftColor: hasMood ? theme.colors.tint : theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                      <Text style={[styles.title, { color: theme.colors.text }]}>
                        {item.title.substring(0, 30)}
                        {item.title.length > 30 ? '...' : ''}
                      </Text>
                      {hasMood && (
                        <View style={styles.moodIndicator}>
                          <Text style={styles.moodEmoji}>{moodEmoji}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                      {item.date}
                    </Text>
                  </View>
                  <Text
                    style={[styles.content, { color: theme.colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {stripHtml(item.content)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  subHeading: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 12,
  },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  monthNavArrow: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCellHeader: {
    width: '14.28%',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 13,
  },
  gridCell: {
    width: '14.28%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  moodIndicator: {
    marginLeft: 8,
  },
  moodEmoji: {
    fontSize: 13,
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
  },
});
