import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { COMPANION_OPTIONS } from '@/features/diary/domain/Companion';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { entries, deleteDiaryEntry } = useDiary();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);

  useEffect(() => {
    if (id) {
      const found = entries.find((e) => e.id === id);
      if (found) {
        setEntry(found);
      }
    }
  }, [id, entries]);

  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Entry not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const companion = COMPANION_OPTIONS.find((c) => c.id === entry.companion) || COMPANION_OPTIONS[0]!;

  const handleDelete = async () => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this diary entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDiaryEntry(entry.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{entry.date}</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Paper Canvas & Entry View */}
      <View style={styles.canvasContainer}>
        {/* Render Saved Drag & Drop Stickers with saved coordinates */}
        {entry.stickers.map((sticker) => (
          <StickerCanvasItem
            key={sticker.id}
            sticker={sticker}
            onUpdate={() => {}}
            onDelete={() => {}}
            isEditable={false}
          />
        ))}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.dateLabel}>{entry.date}</Text>
          <Text style={styles.title}>{entry.title}</Text>
          <Text style={styles.content}>{entry.content}</Text>

          {/* AI Sentiment Analysis Card */}
          {entry.sentiment && (
            <View style={styles.sentimentCard}>
              <View style={styles.sentimentHeader}>
                <Text style={styles.companionAvatar}>{companion.avatar}</Text>
                <View>
                  <Text style={styles.sentimentTitle}>{companion.name}'s Insights</Text>
                  <Text style={styles.moodBadge}>{entry.sentiment.mood}</Text>
                </View>
              </View>

              <Text style={styles.sentimentText}>{entry.sentiment.emotional_analysis}</Text>
              
              {entry.sentiment.supportive_message && (
                <Text style={styles.supportiveText}>{entry.sentiment.supportive_message}</Text>
              )}

              {entry.sentiment.suggestion && (
                <View style={styles.suggestionBox}>
                  <Text style={styles.suggestionTitle}>💡 Tip for you:</Text>
                  <Text style={styles.suggestionText}>{entry.sentiment.suggestion}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
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
  backText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FDF6E3', // Vintage Parchment texture
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
  },
  dateLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  title: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  content: {
    color: '#1E293B',
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 24,
  },
  sentimentCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  sentimentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companionAvatar: {
    fontSize: 36,
    marginRight: 12,
  },
  sentimentTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  moodBadge: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  sentimentText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  supportiveText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  suggestionBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 10,
    padding: 10,
  },
  suggestionTitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  suggestionText: {
    color: '#F8FAFC',
    fontSize: 13,
  },
});
