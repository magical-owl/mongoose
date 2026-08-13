/**
 * Create Diary Entry Screen
 *
 * Design mirrors the reference diary app:
 *   - Thin header:  Cancel | date | Save
 *   - Full-bleed journal body: title → rich editor
 *   - Stickers float absolutely over the scroll area
 *   - Floating bottom toolbar (above keyboard) with formatting + sticker + companion icons
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TextInput as NativeTextInput,
  StyleSheet,
  Text as RNText,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@shared/components/Text';
import { RichTextEditor, type RichTextEditorHandle, type FormatActionKind } from '@shared/components/RichTextEditor';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { CompanionPickerModal } from '@/features/diary/components/CompanionPickerModal';
import { COMPANION_OPTIONS } from '@/features/diary/domain/Companion';
import { generateUUID } from '@/shared/utils/uuid';

// Word count helper (strips markdown syntax)
function countWords(text: string): number {
  const clean = text.replace(/[*#`>•\-_]/g, '').trim();
  return clean ? clean.split(/\s+/).filter(Boolean).length : 0;
}

// Toolbar format items
const FORMAT_ITEMS: { kind: FormatActionKind; icon: string }[] = [
  { kind: 'bold',    icon: 'format-bold' },
  { kind: 'italic',  icon: 'format-italic' },
  { kind: 'heading', icon: 'format-header-2' },
  { kind: 'bullet',  icon: 'format-list-bulleted' },
  { kind: 'quote',   icon: 'format-quote-close' },
  { kind: 'code',    icon: 'code-tags' },
];

export default function CreateEntryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { saveDiaryEntry, selectedCompanion, setSelectedCompanion } = useDiary();
  const editorRef = useRef<RichTextEditorHandle>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showCompanionPicker, setShowCompanionPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track keyboard height to float toolbar above it
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const isoDate = selectedDate.toISOString().split('T')[0]!;
  const wordCount = countWords(content);

  const activeCompanion = COMPANION_OPTIONS.find((c) => c.id === selectedCompanion) || COMPANION_OPTIONS[0]!;

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleAddSticker = useCallback((stickerId: string, category: string) => {
    const newSticker: PlacedSticker = {
      id: generateUUID(),
      stickerId,
      category,
      x: 80 + (stickers.length % 4) * 40,
      y: 120 + (stickers.length % 5) * 30,
      scale: 1,
      rotation: Math.floor(Math.random() * 30) - 15,
      zIndex: stickers.length + 1,
    };
    setStickers((prev) => [...prev, newSticker]);
  }, [stickers.length]);

  const handleUpdateSticker = useCallback((updated: PlacedSticker) => {
    setStickers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleDeleteSticker = useCallback((id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const navigateBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
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
      paperBackgroundId: 'vintage-parchment',
      stickers,
      companion: selectedCompanion,
      isFavorite: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await saveDiaryEntry(newEntry);
    setIsSaving(false);
    if (result.success) navigateBack();
    else Alert.alert('Error', result.error.message);
  };

  // Toolbar height constant used for scroll padding
  const TOOLBAR_H = 56;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 4,
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={navigateBack}
          style={styles.headerBtn}
          accessibilityLabel="Cancel and go back"
          accessibilityRole="button"
        >
          <Text preset="label" color="textSecondary">Cancel</Text>
        </TouchableOpacity>

        {/* Date — tap to change */}
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          accessibilityLabel={`Entry date: ${formattedDate}. Tap to change.`}
          accessibilityRole="button"
        >
          <Text preset="caption" color="textSecondary" style={{ textAlign: 'center' }}>
            {selectedDate.toDateString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={styles.headerBtn}
          accessibilityLabel="Save diary entry"
          accessibilityRole="button"
        >
          <Text
            preset="label"
            style={{ color: isSaving ? theme.colors.textSecondary : '#1E90FF', fontWeight: '600' }}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date picker */}
      {showDatePicker && (
        <View style={[styles.pickerWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.pickerDone, { backgroundColor: theme.colors.tint }]}
              onPress={() => setShowDatePicker(false)}
              accessibilityLabel="Done selecting date"
            >
              <Text preset="label" style={{ color: '#fff' }}>Done</Text>
            </TouchableOpacity>
          )}
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            style={{ width: '100%', height: Platform.OS === 'ios' ? 150 : undefined }}
          />
        </View>
      )}

      {/* ── Stickers (float above scroll area) ────────────────────────────── */}
      {stickers.map((sticker) => (
        <StickerCanvasItem
          key={sticker.id}
          sticker={sticker}
          onUpdate={handleUpdateSticker}
          onDelete={handleDeleteSticker}
        />
      ))}

      {/* ── Journal body ─────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? TOOLBAR_H : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: TOOLBAR_H + theme.spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <NativeTextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Entry title…"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.titleInput, { color: theme.colors.text }]}
            multiline
            returnKeyType="next"
            accessibilityLabel="Entry title"
            accessibilityHint="Write the title of your diary entry"
          />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Rich content editor — toolbar hidden, controlled from floating bar */}
          <RichTextEditor
            ref={editorRef}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind today? Write freely…"
            minHeight={320}
            showToolbar={false}
            accessibilityLabel="Entry content"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Floating bottom toolbar ──────────────────────────────────────── */}
      <View
        style={[
          styles.floatingBar,
          {
            bottom: keyboardHeight,
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            paddingBottom: keyboardHeight > 0 ? 0 : insets.bottom,
          },
        ]}
      >
        {/* Left: formatting icons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarLeft}
          keyboardShouldPersistTaps="always"
        >
          {FORMAT_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.kind}
              style={styles.toolbarIcon}
              onPress={() => editorRef.current?.applyFormat(item.kind)}
              activeOpacity={0.6}
              accessibilityLabel={item.kind}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={22}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          ))}

          {/* Separator */}
          <View style={[styles.barDivider, { backgroundColor: theme.colors.border }]} />

          {/* Sticker button */}
          <TouchableOpacity
            style={styles.toolbarIcon}
            onPress={() => setShowStickerPicker(true)}
            activeOpacity={0.6}
            accessibilityLabel={`Add sticker. ${stickers.length} placed.`}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="sticker-emoji" size={22} color="#FF6B6B" />
          </TouchableOpacity>
        </ScrollView>

        {/* Right: word count + companion avatar */}
        <View style={styles.toolbarRight}>
          {wordCount > 0 && (
            <RNText style={[styles.wordCount, { color: theme.colors.textSecondary }]}>
              {wordCount}w
            </RNText>
          )}
          <TouchableOpacity
            onPress={() => setShowCompanionPicker(true)}
            style={styles.companionAvatar}
            accessibilityLabel={`AI Companion: ${activeCompanion.name}. Tap to change.`}
            accessibilityRole="button"
          >
            <RNText style={{ fontSize: 22 }}>{activeCompanion.avatar}</RNText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <StickerPickerModal
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={handleAddSticker}
      />
      <CompanionPickerModal
        visible={showCompanionPicker}
        onClose={() => setShowCompanionPicker(false)}
        selectedCompanion={selectedCompanion}
        onSelectCompanion={setSelectedCompanion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 6, minWidth: 60 },
  pickerWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pickerDone: {
    padding: 10,
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 16,
    flexGrow: 1,
  },
  titleInput: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    padding: 0,
    marginBottom: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  floatingBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  toolbarIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  barDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    marginHorizontal: 4,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
    paddingLeft: 8,
  },
  wordCount: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  companionAvatar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
});
