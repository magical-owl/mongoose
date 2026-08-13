import { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { ScreenContainer } from '@shared/components/ScreenContainer';
import { Text } from '@shared/components/Text';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { stripHtml } from '@shared/utils/html';

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', sad: '😢', excited: '🤩', anxious: '😰',
  calm: '😌', angry: '😠', neutral: '😐', tired: '😴',
  confused: '😕', grateful: '🙏',
};

export default function CalendarScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { entries, isLoading, refresh } = useDiary();

  const [currentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]!;
  });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

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
    <ScreenContainer loading={isLoading} loadingMessage="Loading calendar..." safeArea scrollable={false}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: theme.spacing.massive + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[styles.heading, { color: theme.colors.text }]}>
          📅 Calendar
        </Text>

        {/* Calendar Card Container */}
        <View
          style={[
            styles.calendarCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.monthTitle, { color: theme.colors.text }]}>
            {monthName}
          </Text>

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
              const hasSentiment = dayEntries.some((e) => !!e.sentiment?.mood);

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
                  onPress={() => setSelectedDateStr(dateStr)}
                  accessibilityLabel={`${day} ${monthName}${hasEntries ? ', has entries' : ''}`}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        fontWeight: isSelected || hasEntries ? '700' : '400',
                        color: isSelected
                          ? '#fff'
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
                            ? '#fff'
                            : hasSentiment
                            ? '#ff6b6b'
                            : '#1E90FF',
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
        <Text style={[styles.subHeading, { color: theme.colors.text }]}>
          📝 Entries on {selectedDateStr}
        </Text>

        {/* Entries List for Selected Date (Matches original reference layout 1:1) */}
        {selectedDayEntries.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No entries on this date.
          </Text>
        ) : (
          selectedDayEntries.map((item) => {
            const hasSentiment = !!item.sentiment?.mood;
            const moodEmoji = hasSentiment ? MOOD_EMOJI[item.sentiment!.mood] ?? '💭' : null;

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
                    borderLeftWidth: hasSentiment ? 4 : 1,
                    borderLeftColor: hasSentiment ? '#ff6b6b' : theme.colors.border,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                      {item.title.substring(0, 30)}
                      {item.title.length > 30 ? '...' : ''}
                    </Text>
                    {hasSentiment && (
                      <View style={styles.sentimentIndicator}>
                        <Text style={styles.sentimentEmoji}>{moodEmoji}</Text>
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 15,
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
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
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
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
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
  sentimentIndicator: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#ff6b6b',
  },
  sentimentEmoji: {
    fontSize: 13,
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
  },
});
