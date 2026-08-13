import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { COMPANION_OPTIONS } from '@/features/diary/domain/Companion';

export default function InsightsScreen() {
  const { entries, streakStats, selectedCompanion, setSelectedCompanion } = useDiary();
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalWords: 0,
    avgWords: 0,
    mostActiveDay: 'None',
  });

  const activeCompanion = COMPANION_OPTIONS.find((c) => c.id === selectedCompanion) || COMPANION_OPTIONS[0]!;

  const computeStats = useCallback(() => {
    const total = entries.length;
    const totalWords = entries.reduce(
      (acc, entry) => acc + entry.content.trim().split(/\s+/).filter(Boolean).length,
      0
    );
    const avgWords = total ? Math.round(totalWords / total) : 0;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = Array(7).fill(0);
    entries.forEach((entry) => {
      const dayIndex = new Date(entry.date).getDay();
      if (!isNaN(dayIndex) && dayCounts[dayIndex] !== undefined) {
        dayCounts[dayIndex]++;
      }
    });

    const maxCount = Math.max(...dayCounts);
    const maxDayIndex = dayCounts.indexOf(maxCount);
    const mostActiveDay = total > 0 && maxCount > 0 ? days[maxDayIndex] || 'None' : 'None';

    setStats({
      totalEntries: total,
      totalWords,
      avgWords,
      mostActiveDay,
    });
  }, [entries]);

  useEffect(() => {
    computeStats();
  }, [computeStats]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics & AI Insights</Text>
        <Text style={styles.headerSubtitle}>Track your journaling habits & mood patterns</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Companion Active Banner */}
        <View style={styles.companionBanner}>
          <Text style={styles.companionAvatar}>{activeCompanion.avatar}</Text>
          <View style={styles.companionInfo}>
            <Text style={styles.companionTitle}>{activeCompanion.name}</Text>
            <Text style={styles.companionDesc}>{activeCompanion.description}</Text>
          </View>
        </View>

        {/* Writing Metrics Grid */}
        <Text style={styles.sectionTitle}>Writing Metrics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={styles.statNumber}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statNumber}>{streakStats.currentStreak} Days</Text>
            <Text style={styles.statLabel}>Writing Streak</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✍️</Text>
            <Text style={styles.statNumber}>{stats.avgWords}</Text>
            <Text style={styles.statLabel}>Avg Words/Entry</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statNumber}>{stats.mostActiveDay}</Text>
            <Text style={styles.statLabel}>Most Active Day</Text>
          </View>
        </View>

        {/* Change AI Companion Section */}
        <Text style={styles.sectionTitle}>Choose AI Companion Personality</Text>
        <View style={styles.companionsList}>
          {COMPANION_OPTIONS.map((item) => {
            const isSelected = item.id === selectedCompanion;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.companionCard, isSelected && styles.companionCardSelected]}
                onPress={() => setSelectedCompanion(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.cardAvatar}>{item.avatar}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                </View>
                {isSelected && <Text style={styles.checkIcon}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  companionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  companionAvatar: {
    fontSize: 40,
    marginRight: 14,
  },
  companionInfo: {
    flex: 1,
  },
  companionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companionDesc: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statNumber: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  companionsList: {
    marginBottom: 16,
  },
  companionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  companionCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  cardAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardDesc: {
    color: '#94A3B8',
    fontSize: 12,
  },
  checkIcon: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
