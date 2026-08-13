import { useState } from 'react';
import { View, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { useRouter } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { ScreenContainer } from '@shared/components/ScreenContainer';
import { Text } from '@shared/components/Text';
import { Button } from '@shared/components/Button';
import { TextInput } from '@shared/components/TextInput';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { CompanionPickerModal } from '@/features/diary/components/CompanionPickerModal';
import { COMPANION_OPTIONS } from '@/features/diary/domain/Companion';
import { generateUUID } from '@/shared/utils/uuid';

export default function CreateEntryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { saveDiaryEntry, selectedCompanion, setSelectedCompanion } = useDiary();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paperId] = useState('vintage-parchment');
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showCompanionPicker, setShowCompanionPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Format for display: "Thursday, August 13, 2026"
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Format for storage: "YYYY-MM-DD"
  const isoDate = selectedDate.toISOString().split('T')[0]!;

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    // On Android the picker closes automatically on selection; on iOS it stays open.
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const activeCompanion =
    COMPANION_OPTIONS.find((c) => c.id === selectedCompanion) || COMPANION_OPTIONS[0]!;

  const handleAddSticker = (stickerId: string, category: string) => {
    const newSticker: PlacedSticker = {
      id: generateUUID(),
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

  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
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
      id: generateUUID(),
      title: title.trim(),
      content: content.trim(),
      date: isoDate,
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
      navigateBack();
    } else {
      Alert.alert('Error', result.error.message);
    }
  };

  return (
    <ScreenContainer safeArea keyboardAvoiding scrollable={false}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <Button
          label="Cancel"
          variant="ghost"
          size="sm"
          onPress={navigateBack}
          accessibilityLabel="Cancel and go back"
        />
        <Text preset="h3">New Diary Entry</Text>
        <Button
          label={isSaving ? 'Saving…' : 'Save'}
          variant="primary"
          size="sm"
          loading={isSaving}
          onPress={handleSave}
          accessibilityLabel="Save diary entry"
        />
      </View>

      {/* Paper Canvas */}
      <View
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#FDF6E3',
          marginHorizontal: theme.spacing.lg,
          marginVertical: theme.spacing.md,
          borderRadius: theme.borderRadius.xl,
          overflow: 'hidden',
        }}
      >
        {/* Drag-and-drop stickers */}
        {stickers.map((sticker) => (
          <StickerCanvasItem
            key={sticker.id}
            sticker={sticker}
            onUpdate={handleUpdateSticker}
            onDelete={handleDeleteSticker}
          />
        ))}

        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Companion banner */}
          <TouchableOpacity
            onPress={() => setShowCompanionPicker(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.08)',
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.lg,
              marginBottom: theme.spacing.lg,
            }}
            accessibilityLabel={`AI Companion: ${activeCompanion.name}. Tap to change.`}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 32, marginRight: theme.spacing.md }}>
              {activeCompanion.avatar}
            </Text>
            <View style={{ flex: 1 }}>
              <Text preset="label" style={{ color: '#0F172A' }}>{activeCompanion.name}</Text>
              <Text preset="caption" style={{ color: '#334155', fontStyle: 'italic' }}>
                "{activeCompanion.greeting}"
              </Text>
            </View>
          </TouchableOpacity>

          {/* Date picker row */}
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              marginBottom: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.inputBorder,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.inputBackground,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            accessibilityLabel={`Entry date: ${formattedDate}. Tap to change.`}
            accessibilityRole="button"
          >
            <View>
              <Text preset="caption" color="textSecondary" style={{ marginBottom: 2 }}>Date</Text>
              <Text preset="body" color="text">{formattedDate}</Text>
            </View>
            <Text style={{ fontSize: 20 }}>📅</Text>
          </TouchableOpacity>

          {/* Native date picker — inline on iOS, dialog on Android */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              style={{ marginBottom: theme.spacing.md }}
            />
          )}
          {/* iOS: show a Done button to dismiss the inline picker */}
          {showDatePicker && Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              style={{
                alignSelf: 'flex-end',
                marginBottom: theme.spacing.md,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
              }}
              accessibilityLabel="Done selecting date"
              accessibilityRole="button"
            >
              <Text preset="button" color="tint">Done</Text>
            </TouchableOpacity>
          )}

          {/* Title */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Entry Title…"
            label="Title"
            accessibilityLabel="Entry title"
            style={{ marginBottom: theme.spacing.md }}
          />

          {/* Body */}
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind today? Write freely…"
            label="Content"
            multiline
            accessibilityLabel="Entry content"
          />
        </ScrollView>
      </View>

      {/* Toolbar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        <Button
          label={`🏷️ Add Sticker (${stickers.length})`}
          variant="outline"
          size="sm"
          onPress={() => setShowStickerPicker(true)}
          accessibilityLabel={`Add sticker. ${stickers.length} placed.`}
        />
        <Button
          label={`${activeCompanion.avatar} AI Companion`}
          variant="outline"
          size="sm"
          onPress={() => setShowCompanionPicker(true)}
          accessibilityLabel="Change AI companion"
        />
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
    </ScreenContainer>
  );
}
