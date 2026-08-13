import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { CompanionPickerModal } from '@/features/diary/components/CompanionPickerModal';
import { COMPANION_OPTIONS } from '@/features/diary/domain/Companion';

export default function CreateEntryScreen() {
  const router = useRouter();
  const { saveDiaryEntry, selectedCompanion, setSelectedCompanion } = useDiary();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]!);
  const [paperId] = useState('vintage-parchment');
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showCompanionPicker, setShowCompanionPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeCompanion = COMPANION_OPTIONS.find((c) => c.id === selectedCompanion) || COMPANION_OPTIONS[0]!;

  const handleAddSticker = (stickerId: string, category: string) => {
    const newSticker: PlacedSticker = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stickerId,
      category,
      x: 120 + (stickers.length % 3) * 30,
      y: 100 + (stickers.length % 4) * 30,
      scale: 1,
      rotation: Math.floor(Math.random() * 30) - 15,
      zIndex: stickers.length + 1,
    };
    setStickers([...stickers, newSticker]);
  };

  const handleUpdateSticker = (updated: PlacedSticker) => {
    setStickers(stickers.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSticker = (id: string) => {
    setStickers(stickers.filter((s) => s.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your diary entry.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Content Required', 'Please write a few thoughts before saving.');
      return;
    }

    setIsSaving(true);
    const newEntry: DiaryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      content: content.trim(),
      date,
      paperBackgroundId: paperId,
      stickers,
      companion: selectedCompanion,
      isFavorite: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await saveDiaryEntry(newEntry);
    setIsSaving(false);

    if (result.success) {
      router.back();
    } else {
      Alert.alert('Error', result.error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Diary Entry</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Canvas Workspace */}
      <View style={styles.canvasContainer}>
        {/* Render Drag & Drop Stickers on Canvas */}
        {stickers.map((sticker) => (
          <StickerCanvasItem
            key={sticker.id}
            sticker={sticker}
            onUpdate={handleUpdateSticker}
            onDelete={handleDeleteSticker}
          />
        ))}

        {/* Paper Text & Editor */}
        <ScrollView contentContainerStyle={styles.editorContent}>
          {/* Companion Greeting Banner */}
          <TouchableOpacity style={styles.companionBanner} onPress={() => setShowCompanionPicker(true)}>
            <Text style={styles.companionAvatar}>{activeCompanion.avatar}</Text>
            <View style={styles.companionBannerTextContainer}>
              <Text style={styles.companionName}>{activeCompanion.name}</Text>
              <Text style={styles.companionGreeting}>"{activeCompanion.greeting}"</Text>
            </View>
          </TouchableOpacity>

          {/* Date & Title Inputs */}
          <TextInput
            style={styles.dateInput}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748B"
          />

          <TextInput
            style={styles.titleInput}
            placeholder="Entry Title..."
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.bodyInput}
            placeholder="What's on your mind today? Write freely..."
            placeholderTextColor="#64748B"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </View>

      {/* Toolbar Controls */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={() => setShowStickerPicker(true)}>
          <Text style={styles.toolButtonText}>🏷️ Add Sticker ({stickers.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton} onPress={() => setShowCompanionPicker(true)}>
          <Text style={styles.toolButtonText}>{activeCompanion.avatar} AI Companion</Text>
        </TouchableOpacity>
      </View>

      {/* Sticker Picker Modal */}
      <StickerPickerModal
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={handleAddSticker}
      />

      {/* Companion Picker Modal */}
      <CompanionPickerModal
        visible={showCompanionPicker}
        onClose={() => setShowCompanionPicker(false)}
        selectedCompanion={selectedCompanion}
        onSelectCompanion={setSelectedCompanion}
      />
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
  cancelText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FDF6E3', // Vintage Parchment paper texture
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  editorContent: {
    padding: 20,
  },
  companionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  companionAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  companionBannerTextContainer: {
    flex: 1,
  },
  companionName: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 14,
  },
  companionGreeting: {
    color: '#334155',
    fontSize: 12,
    fontStyle: 'italic',
  },
  dateInput: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleInput: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bodyInput: {
    color: '#1E293B',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 250,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  toolButton: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolButtonText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
});
