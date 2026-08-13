import { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { ScreenContainer } from '@shared/components/ScreenContainer';
import { Text } from '@shared/components/Text';
import { Button } from '@shared/components/Button';
import { Card } from '@shared/components/Card';
import { TextInput as MeadowTextInput } from '@shared/components/TextInput';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { COMPANION_OPTIONS } from '@/features/diary/domain/Companion';
import { generateUUID } from '@/shared/utils/uuid';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { entries, saveDiaryEntry, deleteDiaryEntry } = useDiary();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Local edit state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editStickers, setEditStickers] = useState<PlacedSticker[]>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const found = entries.find((e) => e.id === id);
      if (found) {
        setEntry(found);
        setEditTitle(found.title);
        setEditContent(found.content);
        setEditStickers(found.stickers);
      }
    }
  }, [id, entries]);

  const navigateBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  const handleStartEdit = () => {
    if (!entry) return;
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditStickers(entry.stickers);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!entry) return;
    // Restore original values
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditStickers(entry.stickers);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!entry) return;
    if (!editTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title.');
      return;
    }
    setIsSaving(true);
    const updated: DiaryEntry = {
      ...entry,
      title: editTitle.trim(),
      content: editContent.trim(),
      stickers: editStickers,
      updatedAt: new Date().toISOString(),
    };
    const result = await saveDiaryEntry(updated);
    setIsSaving(false);
    if (result.success) {
      setEntry(updated);
      setIsEditing(false);
    } else {
      Alert.alert('Save Failed', result.error.message);
    }
  };

  const handleAddSticker = (stickerId: string, category: string) => {
    const newSticker: PlacedSticker = {
      id: generateUUID(),
      stickerId,
      category,
      x: 120 + (editStickers.length % 3) * 30,
      y: 100 + (editStickers.length % 4) * 30,
      scale: 1,
      rotation: Math.floor(Math.random() * 30) - 15,
      zIndex: editStickers.length + 1,
    };
    setEditStickers((prev) => [...prev, newSticker]);
  };

  const handleUpdateSticker = useCallback((updated: PlacedSticker) => {
    setEditStickers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleDeleteSticker = useCallback((stickerId: string) => {
    setEditStickers((prev) => prev.filter((s) => s.id !== stickerId));
  }, []);

  const handleDelete = async () => {
    if (!entry) return;
    Alert.alert('Delete Entry', 'Are you sure you want to delete this diary entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDiaryEntry(entry.id);
          navigateBack();
        },
      },
    ]);
  };

  if (!entry) {
    return (
      <ScreenContainer safeArea>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <Button label="‹ Back" variant="ghost" size="sm" onPress={navigateBack} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text preset="body" color="textSecondary">Entry not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  const companion =
    COMPANION_OPTIONS.find((c) => c.id === entry.companion) || COMPANION_OPTIONS[0]!;

  // Which stickers to show: live edit list or saved entry list
  const displayStickers = isEditing ? editStickers : entry.stickers;

  return (
    <ScreenContainer safeArea scrollable={false}>
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
        {isEditing ? (
          <>
            <Button
              label="Cancel"
              variant="ghost"
              size="sm"
              onPress={handleCancelEdit}
              accessibilityLabel="Cancel editing"
            />
            <Text preset="h3">Edit Entry</Text>
            <Button
              label={isSaving ? 'Saving…' : 'Save'}
              variant="primary"
              size="sm"
              loading={isSaving}
              onPress={handleSaveEdit}
              accessibilityLabel="Save changes"
            />
          </>
        ) : (
          <>
            <Button
              label="‹ Back"
              variant="ghost"
              size="sm"
              onPress={navigateBack}
              accessibilityLabel="Go back"
            />
            <Text preset="label" color="textSecondary">{entry.date}</Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button
                label="Edit"
                variant="outline"
                size="sm"
                onPress={handleStartEdit}
                accessibilityLabel="Edit this entry"
              />
              <Button
                label="Delete"
                variant="ghost"
                size="sm"
                onPress={handleDelete}
                style={{ opacity: 0.8 }}
                accessibilityLabel="Delete this entry"
              />
            </View>
          </>
        )}
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
        {/* Sticker layer — editable in edit mode, view-only otherwise */}
        {displayStickers.map((sticker) => (
          <StickerCanvasItem
            key={sticker.id}
            sticker={sticker}
            onUpdate={handleUpdateSticker}
            onDelete={handleDeleteSticker}
            isEditable={isEditing}
          />
        ))}

        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isEditing ? (
            /* ── Edit mode ── */
            <>
              <MeadowTextInput
                value={editTitle}
                onChangeText={setEditTitle}
                label="Title"
                placeholder="Entry title…"
                accessibilityLabel="Entry title"
                style={{ marginBottom: theme.spacing.md }}
              />
              <MeadowTextInput
                value={editContent}
                onChangeText={setEditContent}
                label="Content"
                placeholder="Write your thoughts…"
                multiline
                accessibilityLabel="Entry content"
              />
            </>
          ) : (
            /* ── View mode ── */
            <>
              <Text
                preset="caption"
                style={{ color: '#64748B', marginBottom: theme.spacing.xs, fontWeight: '600' }}
              >
                {entry.date}
              </Text>
              <Text
                preset="h2"
                style={{ color: '#0F172A', marginBottom: theme.spacing.lg }}
              >
                {entry.title}
              </Text>
              <Text
                preset="body"
                style={{ color: '#1E293B', lineHeight: 26, marginBottom: theme.spacing.xl }}
              >
                {entry.content}
              </Text>

              {/* AI Sentiment Card */}
              {entry.sentiment && (
                <Card
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    marginTop: theme.spacing.md,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    <Text style={{ fontSize: 36, marginRight: theme.spacing.md }}>
                      {companion.avatar}
                    </Text>
                    <View>
                      <Text preset="label" style={{ color: '#F8FAFC' }}>
                        {companion.name}'s Insights
                      </Text>
                      <Text preset="caption" color="tint">{entry.sentiment.mood}</Text>
                    </View>
                  </View>

                  <Text
                    preset="bodySmall"
                    style={{ color: '#CBD5E1', lineHeight: 20, marginBottom: theme.spacing.sm }}
                  >
                    {entry.sentiment.emotional_analysis}
                  </Text>

                  {entry.sentiment.supportive_message && (
                    <Text
                      preset="bodySmall"
                      style={{ color: '#F8FAFC', fontStyle: 'italic', marginBottom: theme.spacing.md }}
                    >
                      {entry.sentiment.supportive_message}
                    </Text>
                  )}

                  {entry.sentiment.suggestion && (
                    <View
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: theme.borderRadius.md,
                        padding: theme.spacing.md,
                      }}
                    >
                      <Text
                        preset="caption"
                        color="tint"
                        style={{ marginBottom: 2, fontWeight: '700' }}
                      >
                        💡 Tip for you:
                      </Text>
                      <Text preset="caption" style={{ color: '#F8FAFC' }}>
                        {entry.sentiment.suggestion}
                      </Text>
                    </View>
                  )}
                </Card>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {/* Edit-mode toolbar: add stickers */}
      {isEditing && (
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
            label={`🏷️ Add Sticker (${editStickers.length})`}
            variant="outline"
            size="sm"
            onPress={() => setShowStickerPicker(true)}
            accessibilityLabel={`Add sticker. ${editStickers.length} placed.`}
          />
        </View>
      )}

      <StickerPickerModal
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={handleAddSticker}
      />
    </ScreenContainer>
  );
}
