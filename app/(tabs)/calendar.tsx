import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal as NativeModal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useAppStore } from '@/stores/useAppStore';
import { formatDisplayDate } from '@shared/utils/dateFormat';
import { CalendarEntryView } from '@/features/diary/components/CalendarEntryView';
import { appLockService } from '@/services/AppLockService';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import type { ManualMood } from '@/features/diary/domain/DiaryEntry';

export default function CalendarScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, isLoading, refresh } = useDiary();
  const setSelectedCalendarDate = useAppStore((state) => state.setSelectedCalendarDate);
  const calendarDateFormat = useAppStore((state) => state.calendarDateFormat);
  const calendarFirstDay = useAppStore((state) => state.calendarFirstDay);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const touchStartX = useRef<number | null>(null);

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
    setCurrentDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      const key = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
      setSelectedDateStr(key);
      setSelectedCalendarDate(key);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      const key = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
      setSelectedDateStr(key);
      setSelectedCalendarDate(key);
      return next;
    });
  };

  const handleSwipe = (endX: number) => {
    if (touchStartX.current === null) return;
    const distance = endX - touchStartX.current;
    if (Math.abs(distance) > 60) {
      if (distance > 0) handlePrevMonth();
      else handleNextMonth();
    }
    touchStartX.current = null;
  };

  const handleJumpToToday = () => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    handleSelectDate(todayKey);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() - calendarFirstDay + 7) % 7;

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
  const monthEntries = entries.filter((entry) => entry.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}-`));
  const monthWritingDays = new Set(monthEntries.map((entry) => entry.date)).size;
  const monthFavorites = monthEntries.filter((entry) => entry.isFavorite).length;

  const moodColor = (mood: string) => {
    return getManualMoodColor(mood as ManualMood, theme.colors);
  };

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
          <View style={styles.titleRow}>
            <Text style={[styles.heading, { color: theme.colors.text }]}>Calendar</Text>
            <TouchableOpacity onPress={handleJumpToToday} style={[styles.todayButton, { borderColor: theme.colors.border }]} accessibilityRole="button" accessibilityLabel="Jump to today">
              <Text preset="caption" color="tint">Today</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Card Container */}
          <View
            style={[
              styles.calendarCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            onTouchStart={(event) => { touchStartX.current = event.nativeEvent.pageX; }}
            onTouchEnd={(event) => handleSwipe(event.nativeEvent.pageX)}
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

              <TouchableOpacity onPress={() => { setPickerYear(year); setShowMonthPicker(true); }} accessibilityRole="button" accessibilityLabel="Choose month and year">
                <View style={styles.monthTitleButton}>
                  <Text style={[styles.monthTitle, { color: theme.colors.text }]}>{monthName}</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.monthNavBtn}
                accessibilityLabel="Next month"
                accessibilityRole="button"
              >
                <Text style={[styles.monthNavArrow, { color: theme.colors.text }]}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.monthSummary}>
              <Text preset="caption" color="textSecondary">{monthEntries.length} {monthEntries.length === 1 ? 'entry' : 'entries'}</Text>
              <Text preset="caption" color="textSecondary">{monthWritingDays} writing {monthWritingDays === 1 ? 'day' : 'days'}</Text>
              <Text preset="caption" color="textSecondary">{monthFavorites} {monthFavorites === 1 ? 'favorite' : 'favorites'}</Text>
            </View>

            {/* Weekday Row */}
            <View style={styles.gridRow}>
              {(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].slice(calendarFirstDay).concat(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].slice(0, calendarFirstDay))).map((d) => (
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
                const moodKeys = Array.from(new Set(dayEntries.flatMap((entry) => entry.manualMood ? [entry.manualMood] : []))).slice(0, 3);
                const hasFavorite = dayEntries.some((entry) => entry.isFavorite);

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
                      <View style={styles.markerRow}>
                        {moodKeys.length > 0 ? moodKeys.map((mood) => <View key={mood} style={[styles.dot, { backgroundColor: isSelected ? theme.colors.background : moodColor(mood) }]} />) : <View style={[styles.dot, { backgroundColor: isSelected ? theme.colors.background : theme.colors.tint }]} />}
                        {dayEntries.length > 1 && <Text style={[styles.entryCount, { color: isSelected ? theme.colors.background : theme.colors.textSecondary }]}>{dayEntries.length}</Text>}
                        {hasFavorite && <Ionicons name="star" size={8} color={isSelected ? theme.colors.background : theme.colors.warning} />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Entries List for Selected Date (Matches original reference layout 1:1) */}
          {selectedDayEntries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Ionicons name="book-outline" size={28} color={theme.colors.textSecondary} />
              <Text preset="bodySmall" color="textSecondary" style={styles.emptyStateText}>No entries on this date.</Text>
            </View>
          ) : (
            <View style={styles.dateGroup}>
              <Text preset="label" style={[styles.dateHeading, { color: theme.colors.text }]}>
                {formatDisplayDate(selectedDateStr, calendarDateFormat)}
              </Text>
              {selectedDayEntries.map((item, index) => {
              return (
                <CalendarEntryView
                  key={item.id}
                  entry={item}
                  position={index}
                  onPress={async () => {
                    if (item.isLockbox && !(await appLockService.authenticate())) return;
                    router.push(`/entry/${item.id}`);
                  }}
                />
              );
              })}
            </View>
          )}
        </ScrollView>
      )}
      <NativeModal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setShowMonthPicker(false)}>
          <Pressable style={[styles.monthPicker, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <Text preset="h2" color="text">Choose month</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)} accessibilityRole="button" accessibilityLabel="Close month picker">
                <Ionicons name="close" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.yearRow}>
              <TouchableOpacity onPress={() => setPickerYear((value) => value - 1)} accessibilityRole="button" accessibilityLabel="Previous year"><Ionicons name="chevron-back" size={20} color={theme.colors.text} /></TouchableOpacity>
              <Text preset="label" color="text">{pickerYear}</Text>
              <TouchableOpacity onPress={() => setPickerYear((value) => value + 1)} accessibilityRole="button" accessibilityLabel="Next year"><Ionicons name="chevron-forward" size={20} color={theme.colors.text} /></TouchableOpacity>
            </View>
            <View style={styles.monthGrid}>
              {Array.from({ length: 12 }, (_, index) => index).map((monthIndex) => {
                const selected = pickerYear === year && monthIndex === month;
                return <TouchableOpacity key={monthIndex} onPress={() => { const key = `${pickerYear}-${String(monthIndex + 1).padStart(2, '0')}-01`; setCurrentDate(new Date(pickerYear, monthIndex, 1)); setSelectedDateStr(key); setSelectedCalendarDate(key); setShowMonthPicker(false); }} style={[styles.monthChoice, { borderColor: selected ? theme.colors.tint : theme.colors.border, backgroundColor: selected ? theme.colors.tint : 'transparent' }]}><Text preset="caption" style={{ color: selected ? theme.colors.background : theme.colors.text }}>{new Date(2000, monthIndex, 1).toLocaleDateString('en-US', { month: 'short' })}</Text></TouchableOpacity>;
              })}
            </View>
          </Pressable>
        </Pressable>
      </NativeModal>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 16 },
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
  monthTitleButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  monthSummary: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, marginBottom: 14 },
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
  },
  markerRow: { height: 10, flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  entryCount: { fontSize: 8, fontWeight: '700' },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  feedEntry: {
    borderWidth: 0,
    padding: 14,
    marginBottom: 12,
  },
  timelineEntry: {
    borderWidth: 0,
    borderLeftWidth: 2,
    borderRadius: 0,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  timelineContent: {
    flex: 1,
  },
  dateGroup: { marginBottom: 6 },
  dateHeading: { fontSize: 15, fontWeight: '700', marginTop: 4, marginBottom: 10 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyState: { alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 22, marginBottom: 12 },
  emptyStateText: { marginTop: 8 },
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
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'center', padding: 20 },
  monthPicker: { borderWidth: 1, borderRadius: 14, padding: 18 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 8 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthChoice: { width: '30%', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingVertical: 11 },
});
