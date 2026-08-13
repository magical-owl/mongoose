import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { COMPANION_OPTIONS } from '@/features/diary/domain/Companion';

export default function TimelineScreen() {
  const router = useRouter();
  const { entries, isLoading, streakStats, selectedCompanion } = useDiary();
  const [viewMode, setViewMode] = useState<'feed' | 'calendar'>('feed');

  const activeCompanion = COMPANION_OPTIONS.find((c) => c.id === selectedCompanion) || COMPANION_OPTIONS[0]!;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>Mongoose</Text>
          <Text style={styles.subtitle}>AI Diary Companion</Text>
        </View>

        {/* View Switcher: Feed | Calendar */}
        <View style={styles.viewSwitcher}>
          <TouchableOpacity
            style={[styles.switchBtn, viewMode === 'feed' && styles.switchBtnActive]}
            onPress={() => setViewMode('feed')}
          >
            <Text style={[styles.switchText, viewMode === 'feed' && styles.switchTextActive]}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchBtn, viewMode === 'calendar' && styles.switchBtnActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Text style={[styles.switchText, viewMode === 'calendar' && styles.switchTextActive]}>Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Streak & Companion Banner */}
      <View style={styles.streakBanner}>
        <Text style={styles.companionAvatar}>{activeCompanion.avatar}</Text>
        <View style={styles.streakInfo}>
          <Text style={styles.streakTitle}>{activeCompanion.name}</Text>
          <Text style={styles.streakSubtitle}>🔥 {streakStats.currentStreak} Day Writing Streak</Text>
        </View>
      </View>

      {/* Content Feed / Calendar */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : viewMode === 'feed' ? (
        <ScrollView contentContainerStyle={styles.feedContent}>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyDesc}>Tap "+" below to write your first entry with {activeCompanion.name}!</Text>
            </View>
          ) : (
            entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => router.push(`/entry/${entry.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>{entry.date}</Text>
                  {entry.sentiment && <Text style={styles.cardMood}>{entry.sentiment.mood}</Text>}
                </View>
                <Text style={styles.cardTitle}>{entry.title}</Text>
                <Text style={styles.cardSnippet} numberOfLines={2}>
                  {entry.content}
                </Text>
                {entry.stickers.length > 0 && (
                  <Text style={styles.stickerTag}>🏷️ {entry.stickers.length} Stickers Placed</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.feedContent}>
          <View style={styles.calendarCard}>
            <Text style={styles.calendarTitle}>📅 Calendar View</Text>
            <Text style={styles.calendarSubtitle}>Select any day below to view or write entries:</Text>

            <View style={styles.calendarGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <Text key={d} style={styles.calendarHeaderCell}>{d}</Text>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const dayStr = `2026-08-${day < 10 ? '0' + day : day}`;
                const hasEntry = entries.some((e) => e.date === dayStr);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.calendarCell, hasEntry && styles.calendarCellHasEntry]}
                    onPress={() => {
                      const found = entries.find((e) => e.date === dayStr);
                      if (found) {
                        router.push(`/entry/${found.id}`);
                      } else {
                        router.push('/entry/new');
                      }
                    }}
                  >
                    <Text style={[styles.calendarCellText, hasEntry && styles.calendarCellTextActive]}>
                      {day}
                    </Text>
                    {hasEntry && <View style={styles.dot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Floating Action Button (+ New Entry) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/entry/new')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  appTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 20,
    padding: 3,
  },
  switchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  switchBtnActive: {
    backgroundColor: '#10B981',
  },
  switchText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  switchTextActive: {
    color: '#0F172A',
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  companionAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  streakSubtitle: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  entryCard: {
    backgroundColor: '#FDF6E3', // Vintage parchment preview
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardDate: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  cardMood: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardSnippet: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  stickerTag: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  calendarTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calendarSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarHeaderCell: {
    width: '13%',
    textAlign: 'center',
    color: '#94A3B8',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  calendarCell: {
    width: '13%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  calendarCellHasEntry: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  calendarCellText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  calendarCellTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabIcon: {
    color: '#0F172A',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
});