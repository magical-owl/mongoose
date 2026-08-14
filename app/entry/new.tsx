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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@shared/components/Text';
import { Modal } from '@shared/components/Modal';
import { RichTextEditor, type RichTextEditorHandle, type FormatActionKind } from '@shared/components/RichTextEditor';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useAppStore } from '@/stores/useAppStore';
import { DiaryEntry, ManualMoodWeather, WritingMode } from '@/features/diary/domain/DiaryEntry';
import { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { TemplatePickerModal } from '@/features/diary/components/TemplatePickerModal';
import { Template } from '@/features/diary/domain/Template';
import { CompanionPickerModal } from '@/features/diary/components/CompanionPickerModal';
import { COMPANION_OPTIONS } from '@/features/diary/domain/Companion';
import { generateUUID } from '@/shared/utils/uuid';
import { diaryDraftService } from '@/features/diary/services/DiaryDraftService';

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
  const { date: paramDate } = useLocalSearchParams<{ date?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { saveDiaryEntry, selectedCompanion, setSelectedCompanion } = useDiary();
  const selectedCalendarDate = useAppStore((state) => state.selectedCalendarDate);
  const setSelectedCalendarDate = useAppStore((state) => state.setSelectedCalendarDate);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const isHydratingDraft = useRef(true);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const target = paramDate || selectedCalendarDate;
    if (target) {
      const [y, m, d] = target.split('-').map(Number);
      if (y && m && d) return new Date(y, m - 1, d, 12, 0, 0);
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showCompanionPicker, setShowCompanionPicker] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saved'>('idle');
  const [manualMoodWeather, setManualMoodWeather] = useState<ManualMoodWeather>('calm');
  const [writingMode, setWritingMode] = useState<WritingMode>('free-write');
  const [locationLabel, setLocationLabel] = useState('');
  const [sounds, setSounds] = useState('');
  const [smells, setSmells] = useState('');
  const [energyLevel, setEnergyLevel] = useState('5');
  const [bodyState, setBodyState] = useState('');
  const [isLockbox, setIsLockbox] = useState(false);
  const [timeCapsuleUnlockAt, setTimeCapsuleUnlockAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const isoDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    let active = true;
    void diaryDraftService.get().then((draft) => {
      if (!active || !draft) {
        isHydratingDraft.current = false;
        return;
      }
      setTitle(draft.title);
      setContent(draft.content);
      setStickers(draft.stickers);
      setSelectedCompanion(draft.companion);
      setManualMoodWeather(draft.manualMoodWeather);
      setWritingMode(draft.writingMode);
      setLocationLabel(draft.sensory.locationLabel);
      setSounds(draft.sensory.sounds);
      setSmells(draft.sensory.smells);
      setEnergyLevel(String(draft.sensory.energyLevel));
      setBodyState(draft.sensory.bodyState);
      setIsLockbox(draft.isLockbox);
      setTimeCapsuleUnlockAt(draft.timeCapsuleUnlockAt ?? '');
      setExpiresAt(draft.expiresAt ?? '');
      const [year, month, day] = draft.date.split('-').map(Number);
      if (year && month && day) setSelectedDate(new Date(year, month - 1, day, 12, 0, 0));
      setTimeout(() => editorRef.current?.setContentHTML(draft.content), 50);
      isHydratingDraft.current = false;
      setDraftStatus('saved');
    }).catch(() => {
      isHydratingDraft.current = false;
    });
    return () => { active = false; };
  }, [setSelectedCompanion]);

  useEffect(() => {
    if (isHydratingDraft.current || (!title.trim() && !content.trim())) return;
    const timer = setTimeout(() => {
      void diaryDraftService.save({
        title,
        content,
        date: isoDate,
        companion: selectedCompanion,
        stickers,
        manualMoodWeather, writingMode,
        sensory: { locationLabel, sounds, smells, energyLevel: Number(energyLevel) || 5, bodyState },
        isLockbox, timeCapsuleUnlockAt: timeCapsuleUnlockAt ? new Date(timeCapsuleUnlockAt).toISOString() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      }).then(() => setDraftStatus('saved'));
    }, 700);
    return () => clearTimeout(timer);
  }, [title, content, isoDate, selectedCompanion, stickers, manualMoodWeather, writingMode, locationLabel, sounds, smells, energyLevel, bodyState, isLockbox, timeCapsuleUnlockAt, expiresAt]);

  const handleSelectTemplate = (template: Template) => {
    const trimmed = content
      ? content.replace(/[\s\n\r]*$/, '').replace(/(<p><\/p>|<br\s*\/?>)*$/, '')
      : '';
    const newContent = trimmed ? `${trimmed}<br><br>${template.content}` : template.content;
    setContent(newContent);
    setTimeout(() => {
      editorRef.current?.setContentHTML(newContent);
    }, 50);
  };
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
    setSelectedCalendarDate(null);
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
      manualMoodWeather,
      writingMode,
      sensory: { locationLabel, sounds, smells, energyLevel: Math.min(10, Math.max(1, Number(energyLevel) || 5)), bodyState },
      isLockbox,
      timeCapsuleUnlockAt: timeCapsuleUnlockAt ? new Date(timeCapsuleUnlockAt).toISOString() : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      collectionIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await saveDiaryEntry(newEntry);
    setIsSaving(false);
    if (result.success) {
      await diaryDraftService.clear();
      setSelectedCalendarDate(null);
      navigateBack();
    } else {
      Alert.alert('Error', result.error.message);
    }
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
        {draftStatus === 'saved' && (title.trim() || content.trim()) ? (
          <Text preset="caption" color="textSecondary">Draft saved</Text>
        ) : <View style={styles.headerBtn} />}

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

          <TouchableOpacity
            onPress={() => setShowEntryDetails(true)}
            style={[styles.detailsButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Open entry details"
          >
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryIcon}>{isLockbox ? '🔐' : '☼'}</Text>
              <View>
                <Text preset="label" color="text">Entry details</Text>
                <Text preset="caption" color="textSecondary">
                  {manualMoodWeather} mood · {writingMode === 'free-write' ? 'Free write' : writingMode.replace('-', ' ')}{timeCapsuleUnlockAt ? ' · Time capsule' : ''}
                </Text>
              </View>
            </View>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 22 }}>›</Text>
          </TouchableOpacity>

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
              onPressIn={() => editorRef.current?.applyFormat(item.kind)}
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

          {/* Template button */}
          <TouchableOpacity
            style={styles.toolbarIcon}
            onPress={() => setShowTemplatePicker(true)}
            activeOpacity={0.6}
            accessibilityLabel="Choose writing template"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="file-document-outline" size={22} color="#1E90FF" />
          </TouchableOpacity>

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
      <TemplatePickerModal
        visible={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleSelectTemplate}
      />
      <CompanionPickerModal
        visible={showCompanionPicker}
        onClose={() => setShowCompanionPicker(false)}
        selectedCompanion={selectedCompanion}
        onSelectCompanion={setSelectedCompanion}
      />
      <Modal
        visible={showEntryDetails}
        onDismiss={() => setShowEntryDetails(false)}
        title="Entry details"
        accessibilityLabel="Entry details"
      >
        <ScrollView style={styles.detailsModalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text preset="caption" color="textSecondary" style={styles.detailsLabel}>MOOD WEATHER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
            {(['sunny', 'cloudy', 'stormy', 'foggy', 'windy', 'calm'] as ManualMoodWeather[]).map((weather) => (
              <TouchableOpacity key={weather} onPress={() => setManualMoodWeather(weather)} style={[styles.choice, { borderColor: manualMoodWeather === weather ? theme.colors.tint : theme.colors.border, backgroundColor: manualMoodWeather === weather ? theme.colors.tint + '20' : 'transparent' }]}>
                <Text preset="caption" color="text">{weather}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text preset="caption" color="textSecondary" style={styles.detailsLabel}>WRITING MODE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
            {([['free-write', 'Free write'], ['one-line', 'One line'], ['five-minute', '5 minutes'], ['gratitude', 'Gratitude'], ['travel', 'Travel'], ['dream', 'Dream'], ['evening-review', 'Evening review']] as [WritingMode, string][]).map(([mode, label]) => (
              <TouchableOpacity key={mode} onPress={() => setWritingMode(mode)} style={[styles.choice, { borderColor: writingMode === mode ? theme.colors.tint : theme.colors.border, backgroundColor: writingMode === mode ? theme.colors.tint + '20' : 'transparent' }]}>
                <Text preset="caption" color="text">{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text preset="caption" color="textSecondary" style={styles.detailsLabel}>SENSORY SNAPSHOT</Text>
          <View style={styles.sensoryGrid}>
            <NativeTextInput value={locationLabel} onChangeText={setLocationLabel} placeholder="Location label" placeholderTextColor={theme.colors.textSecondary} style={[styles.detailInput, { color: theme.colors.text, borderColor: theme.colors.border }]} />
            <NativeTextInput value={sounds} onChangeText={setSounds} placeholder="Sounds" placeholderTextColor={theme.colors.textSecondary} style={[styles.detailInput, { color: theme.colors.text, borderColor: theme.colors.border }]} />
            <NativeTextInput value={smells} onChangeText={setSmells} placeholder="Smells" placeholderTextColor={theme.colors.textSecondary} style={[styles.detailInput, { color: theme.colors.text, borderColor: theme.colors.border }]} />
            <NativeTextInput value={energyLevel} onChangeText={setEnergyLevel} keyboardType="number-pad" placeholder="Energy 1-10" placeholderTextColor={theme.colors.textSecondary} style={[styles.detailInput, { color: theme.colors.text, borderColor: theme.colors.border }]} />
            <NativeTextInput value={bodyState} onChangeText={setBodyState} placeholder="Body state" placeholderTextColor={theme.colors.textSecondary} style={[styles.detailInput, { color: theme.colors.text, borderColor: theme.colors.border }]} />
          </View>
          <NativeTextInput value={timeCapsuleUnlockAt} onChangeText={setTimeCapsuleUnlockAt} placeholder="Unlock date (YYYY-MM-DD)" placeholderTextColor={theme.colors.textSecondary} style={[styles.detailInput, styles.fullWidthInput, { color: theme.colors.text, borderColor: theme.colors.border }]} />
          <NativeTextInput value={expiresAt} onChangeText={setExpiresAt} placeholder="Expiry date (YYYY-MM-DD)" placeholderTextColor={theme.colors.textSecondary} style={[styles.detailInput, styles.fullWidthInput, { color: theme.colors.text, borderColor: theme.colors.border }]} />
          <TouchableOpacity onPress={() => setIsLockbox((value) => !value)} style={styles.lockboxRow}>
            <Text style={{ fontSize: 20 }}>{isLockbox ? '🔐' : '🔓'}</Text>
            <Text preset="caption" color="text">{isLockbox ? 'Offline lockbox entry enabled' : 'Keep this entry in the normal diary'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
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
  detailsLabel: { marginTop: 10, marginBottom: 6, fontWeight: '700' },
  choiceRow: { gap: 8, paddingBottom: 4 },
  choice: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  sensoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8, minWidth: '47%' },
  lockboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  detailsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  detailsModalScroll: { maxHeight: 470 },
  fullWidthInput: { width: '100%' },
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
