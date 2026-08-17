/**
 * Entry Detail / Edit Screen
 *
 * Design mirrors the reference diary app:
 *   View mode:
 *     - Back | date | Edit + Delete header
 *     - Full-bleed content (title → MarkdownText → AI card)
 *     - Stickers displayed (non-editable)
 *
 *   Edit mode:
 *     - Cancel | "Edit Entry" | Save header
 *     - Same floating bottom toolbar as Create screen
 *     - Stickers editable (drag/resize/delete)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  LayoutAnimation,
  Alert,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TextInput as NativeTextInput,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@shared/components/Text';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { RichTextEditor, type RichTextEditorHandle, type FormatActionKind } from '@shared/components/RichTextEditor';
import { MarkdownText } from '@shared/components/MarkdownText';
import { DiaryEntry, ManualMood, ManualMoodWeather, WritingMode } from '@/features/diary/domain/DiaryEntry';
import { CompanionType, COMPANION_OPTIONS } from '@/features/diary/domain/Companion';
import { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { TemplatePickerModal } from '@/features/diary/components/TemplatePickerModal';
import { CompanionPickerModal } from '@/features/diary/components/CompanionPickerModal';
import { Template } from '@/features/diary/domain/Template';
import { generateUUID } from '@/shared/utils/uuid';
import { EntryDetailsModal } from '@/features/diary/components/EntryDetailsModal';
import { ManualMoodPicker } from '@/features/diary/components/ManualMoodPicker';
import { DiaryDatePicker } from '@/features/diary/components/DiaryDatePicker';
import { formatDisplayDate } from '@shared/utils/dateFormat';
import { useAppStore } from '@/stores/useAppStore';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';

function countWords(text: string): number {
  const clean = text.replace(/[*#`>•\-_]/g, '').trim();
  return clean ? clean.split(/\s+/).filter(Boolean).length : 0;
}

function entryDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day, 12, 0, 0) : new Date();
}

function moodLabel(mood: ManualMood): string {
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}


const FORMAT_ITEMS: { kind: FormatActionKind; icon: string }[] = [
  { kind: 'bold',    icon: 'format-bold' },
  { kind: 'italic',  icon: 'format-italic' },
  { kind: 'heading', icon: 'format-header-2' },
  { kind: 'bullet',  icon: 'format-list-bulleted' },
  { kind: 'quote',   icon: 'format-quote-close' },
  { kind: 'code',    icon: 'code-tags' },
];

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, saveDiaryEntry, deleteDiaryEntry } = useDiary();
  const calendarDateFormat = useAppStore((state) => state.calendarDateFormat);
  const editorRef = useRef<RichTextEditorHandle>(null);

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editStickers, setEditStickers] = useState<PlacedSticker[]>([]);
  const [editMoodWeather, setEditMoodWeather] = useState<ManualMoodWeather>('neutral');
  const [editMood, setEditMood] = useState<ManualMood>('neutral');
  const [editWritingMode, setEditWritingMode] = useState<WritingMode>('free-write');
  const [editLocation, setEditLocation] = useState('');
  const [editSounds, setEditSounds] = useState('');
  const [editSmells, setEditSmells] = useState('');
  const [editEnergy, setEditEnergy] = useState('5');
  const [editBody, setEditBody] = useState('');
  const [editLockbox, setEditLockbox] = useState(false);
  const [editUnlockAt, setEditUnlockAt] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editFavorite, setEditFavorite] = useState(false);
  const [editCompanion, setEditCompanion] = useState<CompanionType>('cat');
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showFormattingTools, setShowFormattingTools] = useState(false);
  const [showCompanionPicker, setShowCompanionPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectTemplate = (template: Template) => {
    const trimmed = editContent
      ? editContent.replace(/[\s\n\r]*$/, '').replace(/(<p><\/p>|<br\s*\/?>)*$/, '')
      : '';
    const newContent = trimmed ? `${trimmed}<br><br>${template.content}` : template.content;
    setEditContent(newContent);
    setTimeout(() => {
      editorRef.current?.setContentHTML(newContent);
    }, 50);
  };
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (id) {
      const found = entries.find((e) => e.id === id);
      if (found) {
        setEntry(found);
        setEditTitle(found.title);
        setEditContent(found.content);
        setEditDate(entryDate(found.date));
        setEditStickers(found.stickers);
        setEditCompanion(found.companion);
        setEditFavorite(found.isFavorite);
        setEditMood(found.manualMood ?? 'neutral'); setEditMoodWeather(found.manualMoodWeather); setEditWritingMode(found.writingMode); setEditLocation(found.sensory.locationLabel); setEditSounds(found.sensory.sounds); setEditSmells(found.sensory.smells); setEditEnergy(String(found.sensory.energyLevel)); setEditBody(found.sensory.bodyState); setEditLockbox(found.isLockbox); setEditUnlockAt(found.timeCapsuleUnlockAt ?? ''); setEditExpiresAt(found.expiresAt ?? '');
      }
    }
  }, [id, entries]);

  const navigateBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const handleStartEdit = () => {
    if (!entry) return;
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditDate(entryDate(entry.date));
    setEditStickers(entry.stickers);
    setEditCompanion(entry.companion);
    setEditFavorite(entry.isFavorite);
    setEditMood(entry.manualMood ?? 'neutral'); setEditMoodWeather(entry.manualMoodWeather); setEditWritingMode(entry.writingMode); setEditLocation(entry.sensory.locationLabel); setEditSounds(entry.sensory.sounds); setEditSmells(entry.sensory.smells); setEditEnergy(String(entry.sensory.energyLevel)); setEditBody(entry.sensory.bodyState); setEditLockbox(entry.isLockbox); setEditUnlockAt(entry.timeCapsuleUnlockAt ?? ''); setEditExpiresAt(entry.expiresAt ?? '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!entry) return;
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditDate(entryDate(entry.date));
    setEditStickers(entry.stickers);
    setEditCompanion(entry.companion);
    setEditFavorite(entry.isFavorite);
    setEditMood(entry.manualMood ?? 'neutral'); setEditMoodWeather(entry.manualMoodWeather); setEditWritingMode(entry.writingMode); setEditLocation(entry.sensory.locationLabel); setEditSounds(entry.sensory.sounds); setEditSmells(entry.sensory.smells); setEditEnergy(String(entry.sensory.energyLevel)); setEditBody(entry.sensory.bodyState); setEditLockbox(entry.isLockbox); setEditUnlockAt(entry.timeCapsuleUnlockAt ?? ''); setEditExpiresAt(entry.expiresAt ?? '');
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!entry) return;
    if (!editTitle.trim()) { Alert.alert('Title Required', 'Please enter a title.'); return; }
    setIsSaving(true);
    const updated: DiaryEntry = {
      ...entry,
      title: editTitle.trim(),
      content: editContent.trim(),
      date: `${editDate.getFullYear()}-${String(editDate.getMonth() + 1).padStart(2, '0')}-${String(editDate.getDate()).padStart(2, '0')}`,
      stickers: editStickers,
      companion: editCompanion,
      isFavorite: editFavorite,
      // Tags are intentionally preserved while tag editing is shelved.
      tags: entry.tags,
      manualMoodWeather: editMoodWeather,
      manualMood: editMood,
      writingMode: editWritingMode,
      sensory: { locationLabel: editLocation, sounds: editSounds, smells: editSmells, energyLevel: Math.min(10, Math.max(1, Number(editEnergy) || 5)), bodyState: editBody },
      isLockbox: editLockbox,
      timeCapsuleUnlockAt: editUnlockAt || undefined,
      expiresAt: editExpiresAt || undefined,
      updatedAt: new Date().toISOString(),
    };
    const result = await saveDiaryEntry(updated);
    setIsSaving(false);
    if (result.success) { setEntry(updated); setIsEditing(false); }
    else Alert.alert('Save Failed', result.error.message);
  };

  const handleAddSticker = useCallback((stickerId: string, category: string) => {
    const newSticker: PlacedSticker = {
      id: generateUUID(),
      stickerId,
      category,
      x: 80 + (editStickers.length % 4) * 40,
      y: 120 + (editStickers.length % 5) * 30,
      scale: 1,
      rotation: Math.floor(Math.random() * 30) - 15,
      zIndex: editStickers.length + 1,
      behindText: false,
    };
    setEditStickers((prev) => [...prev, newSticker]);
  }, [editStickers.length]);

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
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteDiaryEntry(entry.id); navigateBack(); },
      },
    ]);
  };

  if (!entry) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
          <TouchableOpacity onPress={navigateBack} style={styles.headerBtn} accessibilityRole="button">
            <Text preset="label" color="textSecondary">‹ Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <View style={styles.headerBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text preset="body" color="textSecondary">Entry not found</Text>
        </View>
      </View>
    );
  }

  const displayStickers = isEditing ? editStickers : entry.stickers;
  const activeCompanion = COMPANION_OPTIONS.find((item) => item.id === editCompanion) ?? COMPANION_OPTIONS[0]!;
  const wordCount = countWords(isEditing ? editContent : entry.content);
  const moodTone = getManualMoodColor(entry.manualMood, theme.colors);

  const TOOLBAR_H = 56;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
        {isEditing ? (
          <>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Cancel editing">
              <Text preset="label" color="textSecondary">Cancel</Text>
            </TouchableOpacity>
            <Text preset="label" color="text" style={{ fontWeight: '600' }}>Edit Entry</Text>
            <View style={styles.headerActions}>
              {editStickers.some((sticker) => sticker.behindText) && (
                <TouchableOpacity
                  onPress={() => setEditStickers((current) => current.map((sticker) => ({ ...sticker, behindText: false })))}
                  style={styles.headerIcon}
                  accessibilityRole="button"
                  accessibilityLabel="Bring all stickers in front of text"
                >
                  <MaterialCommunityIcons name="layers" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleSaveEdit} disabled={isSaving} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Save changes">
                <Text preset="label" style={{ color: isSaving ? theme.colors.textSecondary : '#1E90FF', fontWeight: '600', textAlign: 'right' }}>
                  {isSaving ? 'Saving…' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={navigateBack} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Go back">
              <Text preset="label" color="textSecondary">‹ Back</Text>
            </TouchableOpacity>
            <View style={styles.headerDateSpacer} />
            <View style={[styles.headerBtn, { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }]}>
              <TouchableOpacity onPress={handleStartEdit} accessibilityRole="button" accessibilityLabel="Edit this entry">
                <Text preset="label" style={{ color: '#1E90FF', fontWeight: '600' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete this entry">
                <Text preset="label" color="textSecondary">Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>




      {/* ── Stickers (float above scroll area) ─────────────────────────────── */}
      {displayStickers.map((sticker) => (
        <StickerCanvasItem
          key={sticker.id}
          sticker={sticker}
          onUpdate={handleUpdateSticker}
          onDelete={handleDeleteSticker}
          isEditable={isEditing}
        />
      ))}

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1, zIndex: 2, elevation: 2 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? TOOLBAR_H : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: (isEditing ? TOOLBAR_H : 0) + theme.spacing.xl,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isEditing ? (
            /* ── Edit mode ──────────────────────────────────────────────── */
            <>
              <View style={styles.entryDetailsToggleRow}>
                <TouchableOpacity
                  onPress={() => setEditFavorite((current) => !current)}
                  style={styles.entryFavoriteToggle}
                  accessibilityRole="button"
                  accessibilityLabel={editFavorite ? 'Remove favorite' : 'Add favorite'}
                >
                  <MaterialCommunityIcons name={editFavorite ? 'star' : 'star-outline'} size={20} color={theme.colors.warning} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowEntryDetails(true)}
                  style={[styles.entryDetailsToggle, { borderColor: theme.colors.border }]}
                  accessibilityRole="button"
                  accessibilityLabel="Open entry details"
                >
                  <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <DiaryDatePicker value={editDate} onChange={setEditDate} maximumDate={new Date()} />
              <NativeTextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Entry title…"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.titleInput, { color: theme.colors.text }]}
                multiline
                returnKeyType="next"
                accessibilityLabel="Entry title"
              />
              <ManualMoodPicker value={editMood} onChange={setEditMood} />
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <RichTextEditor
                ref={editorRef}
                value={editContent}
                onChangeText={setEditContent}
                placeholder="Write your thoughts…"
                minHeight={320}
                showToolbar={false}
                accessibilityLabel="Entry content"
              />
            </>
          ) : (
            /* ── View mode ──────────────────────────────────────────────── */
            <>
              <Text
                preset="caption"
                color="textSecondary"
                style={{ marginBottom: 4, fontWeight: '600', marginTop: 4 }}
              >
                {formatDisplayDate(entry.date, calendarDateFormat)}
              </Text>
              <Text
                preset="h1"
                color="text"
                style={{
                  fontSize: theme.fontSizes.xxxl,
                  lineHeight: theme.fontSizes.xxxl * 1.25,
                  marginBottom: 12,
                }}
              >
                {entry.title}
              </Text>
              <View style={styles.entryMetaRow}>
                {entry.manualMood ? (
                  <View style={[styles.moodBadge, { backgroundColor: moodTone + '18', borderColor: moodTone }]}>
                    <Text preset="caption" style={[styles.moodBadgeText, { color: moodTone }]}>
                      {moodLabel(entry.manualMood)}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.tagRow}>
                  {entry.tags.map((tag) => <Text key={tag} preset="caption" color="textSecondary">#{tag}</Text>)}
                </View>
              </View>
              <MarkdownText style={{ lineHeight: 26 }}>
                {entry.content}
              </MarkdownText>

            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Floating bottom toolbar (edit mode only) ────────────────────── */}
      {isEditing && (
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
          <View style={styles.toolbarLeft}>
            <TouchableOpacity
              style={[styles.toolbarIcon, showFormattingTools && { backgroundColor: theme.colors.tint + '18' }]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowFormattingTools((current) => !current);
              }}
              activeOpacity={0.6}
              accessibilityLabel={showFormattingTools ? 'Hide text formatting tools' : 'Show text formatting tools'}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="format-text" size={22} color={showFormattingTools ? theme.colors.tint : theme.colors.text} />
            </TouchableOpacity>
            {showFormattingTools && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" style={styles.formattingDrawer}>
                {FORMAT_ITEMS.map((item) => (
                  <TouchableOpacity key={item.kind} style={styles.toolbarIcon} onPressIn={() => editorRef.current?.applyFormat(item.kind)} activeOpacity={0.6} accessibilityLabel={item.kind} accessibilityRole="button">
                    <MaterialCommunityIcons name={item.icon as any} size={22} color={theme.colors.text} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <View style={[styles.barDivider, { backgroundColor: theme.colors.border }]} />
            <TouchableOpacity
              style={styles.toolbarIcon}
              onPress={() => setShowTemplatePicker(true)}
              activeOpacity={0.6}
              accessibilityLabel="Choose writing template"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="file-document-edit-outline" size={22} color={theme.colors.tint} />
            </TouchableOpacity>
            {/* Sticker button */}
            <TouchableOpacity
              style={styles.toolbarIcon}
              onPress={() => setShowStickerPicker(true)}
              activeOpacity={0.6}
              accessibilityLabel={`Add sticker. ${editStickers.length} placed.`}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="sticker-outline" size={22} color={theme.colors.tint} />
            </TouchableOpacity>
          </View>

          {/* Right: word count */}
          <View style={styles.toolbarRight}>
            {wordCount > 0 && (
              <Text preset="caption" style={[styles.wordCount, { color: theme.colors.textSecondary }]}> 
                {wordCount}w
              </Text>
              )}
            <TouchableOpacity
              onPress={() => setShowCompanionPicker(true)}
              style={styles.companionAvatar}
              accessibilityLabel={`AI Companion: ${activeCompanion.name}. Tap to change.`}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 22 }}>{activeCompanion.avatar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
        selectedCompanion={editCompanion}
        onSelectCompanion={setEditCompanion}
      />
      <EntryDetailsModal
        visible={showEntryDetails}
        onDismiss={() => setShowEntryDetails(false)}
        values={{ manualMood: editMood, manualMoodWeather: editMoodWeather, writingMode: editWritingMode, sensory: { locationLabel: editLocation, sounds: editSounds, smells: editSmells, energyLevel: Number(editEnergy) || 5, bodyState: editBody }, isLockbox: editLockbox, timeCapsuleUnlockAt: editUnlockAt, expiresAt: editExpiresAt }}
        onChange={(next) => { if (next.manualMood) setEditMood(next.manualMood); if (next.manualMoodWeather) setEditMoodWeather(next.manualMoodWeather); if (next.writingMode) setEditWritingMode(next.writingMode); if (next.sensory) { setEditLocation(next.sensory.locationLabel); setEditSounds(next.sensory.sounds); setEditSmells(next.sensory.smells); setEditEnergy(String(next.sensory.energyLevel)); setEditBody(next.sensory.bodyState); } if (next.isLockbox !== undefined) setEditLockbox(next.isLockbox); if (next.timeCapsuleUnlockAt !== undefined) setEditUnlockAt(next.timeCapsuleUnlockAt); if (next.expiresAt !== undefined) setEditExpiresAt(next.expiresAt); }}
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
  headerBtn: { padding: 6, minWidth: 70 },
  headerDateSpacer: { flex: 1 },
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
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  entryDetailsToggleRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 8, marginBottom: 4 },
  entryFavoriteToggle: {
    width: 42,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDetailsToggle: {
    width: 42,
    height: 34,
    borderWidth: 1,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  entryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  moodBadge: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  moodBadgeText: { fontWeight: '700' },
  floatingBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 3000,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 20,
  },
  toolbarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  formattingDrawer: { flex: 1 },
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
