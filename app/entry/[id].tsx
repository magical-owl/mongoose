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

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
import { Modal } from '@shared/components/Modal';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useJournals } from '@/features/journal/hooks/useJournals';
import { RichTextEditor, type RichTextEditorHandle, type FormatActionKind } from '@shared/components/RichTextEditor';
import { MarkdownText } from '@shared/components/MarkdownText';
import { DiaryEntry, ManualMood, ManualMoodWeather, WritingMode } from '@/features/diary/domain/DiaryEntry';
import type { CompanionType } from '@/features/diary/domain/Companion';
import { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { TemplatePickerModal } from '@/features/diary/components/TemplatePickerModal';
import { Template } from '@/features/diary/domain/Template';
import { generateUUID } from '@/shared/utils/uuid';
import { EntryDetailsModal } from '@/features/diary/components/EntryDetailsModal';
import { ManualMoodPicker } from '@/features/diary/components/ManualMoodPicker';
import { DiaryDatePicker } from '@/features/diary/components/DiaryDatePicker';
import { DiaryJournalSelector } from '@/features/diary/components/DiaryJournalSelector';
import { DiaryTagSelector } from '@/features/diary/components/DiaryTagSelector';
import { normalizeDiaryTags } from '@/features/diary/services/DiaryTagService';
import { chooseDiaryPhotos, takeDiaryPhoto } from '@/features/diary/services/DiaryPhotoPickerService';
import { createPlacedPhotoSticker, diaryPhotoService } from '@/features/diary/services/DiaryPhotoService';
import { formatDisplayDate } from '@shared/utils/dateFormat';
import { formatDisplayMonthDayTime } from '@shared/utils/timeFormat';
import { useAppStore } from '@/stores/useAppStore';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import { manualMoodLabel, premiumPaywallTitle, useTranslation } from '@/localization/i18n';
import { PaywallModal } from '@/shared/components/PaywallModal';
import { isPlanLimitErrorCode } from '@/features/subscription/services/PlanLimitService';
import { APP_IDENTITY } from '@/config/appIdentity';

function countWords(text: string): number {
  const clean = text.replace(/[*#`>•\-_]/g, '').trim();
  return clean ? clean.split(/\s+/).filter(Boolean).length : 0;
}

function entryDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day, 12, 0, 0) : new Date();
}

const FORMAT_ITEMS: { kind: FormatActionKind; icon: string }[] = [
  { kind: 'bold',    icon: 'format-bold' },
  { kind: 'italic',  icon: 'format-italic' },
  { kind: 'heading', icon: 'format-header-2' },
  { kind: 'bullet',  icon: 'format-list-bulleted' },
  { kind: 'quote',   icon: 'format-quote-close' },
  { kind: 'code',    icon: 'code-tags' },
  { kind: 'align-left', icon: 'format-align-left' },
  { kind: 'align-center', icon: 'format-align-center' },
  { kind: 'align-right', icon: 'format-align-right' },
  { kind: 'align-justify', icon: 'format-align-justify' },
];
const READ_ONLY_STICKER_Y_OFFSET = 80;

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { entries, saveDiaryEntry, deleteDiaryEntry, addReflection, deleteReflection } = useDiary();
  const { journals } = useJournals();
  const calendarDateFormat = useAppStore((state) => state.calendarDateFormat);
  const timeFormat = useAppStore((state) => state.timeFormat);
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
  const [editJournalIds, setEditJournalIds] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editCompanion, setEditCompanion] = useState<CompanionType>('cat');
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showFormattingTools, setShowFormattingTools] = useState(false);
  const [showReflections, setShowReflections] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isStickerDragging, setIsStickerDragging] = useState(false);

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
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!id) return;
      const found = entries.find((e) => e.id === id);
      if (found) {
        setEntry(found);
        setEditTitle(found.title);
        setEditContent(found.content);
        setEditDate(entryDate(found.date));
        setEditStickers([...found.stickers, ...found.photos.map((photo, index) => createPlacedPhotoSticker(photo, found.stickers.length + index))]);
        setEditCompanion(found.companion);
        setEditFavorite(found.isFavorite);
        setEditJournalIds(found.journalIds ?? found.collectionIds);
        setEditTags(normalizeDiaryTags(found.tags));
        setEditMood(found.manualMood ?? 'neutral'); setEditMoodWeather(found.manualMoodWeather); setEditWritingMode(found.writingMode); setEditLocation(found.sensory.locationLabel); setEditSounds(found.sensory.sounds); setEditSmells(found.sensory.smells); setEditEnergy(String(found.sensory.energyLevel)); setEditBody(found.sensory.bodyState); setEditLockbox(found.isLockbox); setEditUnlockAt(found.timeCapsuleUnlockAt ?? ''); setEditExpiresAt(found.expiresAt ?? '');
      }
    }, 0);
    return () => clearTimeout(timer);
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
    setEditStickers([...entry.stickers, ...entry.photos.map((photo, index) => createPlacedPhotoSticker(photo, entry.stickers.length + index))]);
    setEditCompanion(entry.companion);
    setEditFavorite(entry.isFavorite);
    setEditJournalIds(entry.journalIds ?? entry.collectionIds);
    setEditTags(normalizeDiaryTags(entry.tags));
    setEditMood(entry.manualMood ?? 'neutral'); setEditMoodWeather(entry.manualMoodWeather); setEditWritingMode(entry.writingMode); setEditLocation(entry.sensory.locationLabel); setEditSounds(entry.sensory.sounds); setEditSmells(entry.sensory.smells); setEditEnergy(String(entry.sensory.energyLevel)); setEditBody(entry.sensory.bodyState); setEditLockbox(entry.isLockbox); setEditUnlockAt(entry.timeCapsuleUnlockAt ?? ''); setEditExpiresAt(entry.expiresAt ?? '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!entry) return;
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditDate(entryDate(entry.date));
    setEditStickers([...entry.stickers, ...entry.photos.map((photo, index) => createPlacedPhotoSticker(photo, entry.stickers.length + index))]);
    setEditCompanion(entry.companion);
    setEditFavorite(entry.isFavorite);
    setEditJournalIds(entry.journalIds ?? entry.collectionIds);
    setEditTags(normalizeDiaryTags(entry.tags));
    setEditMood(entry.manualMood ?? 'neutral'); setEditMoodWeather(entry.manualMoodWeather); setEditWritingMode(entry.writingMode); setEditLocation(entry.sensory.locationLabel); setEditSounds(entry.sensory.sounds); setEditSmells(entry.sensory.smells); setEditEnergy(String(entry.sensory.energyLevel)); setEditBody(entry.sensory.bodyState); setEditLockbox(entry.isLockbox); setEditUnlockAt(entry.timeCapsuleUnlockAt ?? ''); setEditExpiresAt(entry.expiresAt ?? '');
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!entry) return;
    if (!editTitle.trim()) { Alert.alert(t('entryTitleRequiredTitle'), t('entryEditTitleRequiredMessage')); return; }
    setIsSaving(true);
    const updated: DiaryEntry = {
      ...entry,
      title: editTitle.trim(),
      content: editContent.trim(),
      date: `${editDate.getFullYear()}-${String(editDate.getMonth() + 1).padStart(2, '0')}-${String(editDate.getDate()).padStart(2, '0')}`,
      stickers: editStickers,
      photos: [],
      companion: editCompanion,
      isFavorite: editFavorite,
      tags: editTags,
      collectionIds: editJournalIds,
      journalIds: editJournalIds,
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
    else if (isPlanLimitErrorCode(result.error.code)) setShowPremiumModal(true);
    else Alert.alert(t('entrySaveFailedTitle'), result.error.message);
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

  const handleAddTextSticker = useCallback(() => {
    const newSticker: PlacedSticker = {
      id: generateUUID(),
      stickerId: 'text-sticker',
      category: 'text',
      x: 72 + (editStickers.length % 4) * 28,
      y: 150 + (editStickers.length % 5) * 28,
      scale: 1,
      rotation: 0,
      zIndex: editStickers.length + 1,
      behindText: false,
      text: '',
      textColor: '#111827',
      opacity: 1,
    };
    setEditStickers((prev) => [...prev, newSticker]);
  }, [editStickers.length, setEditStickers]);

  const handlePhotoPickerResult = useCallback(async (source: 'camera' | 'library') => {
    const result = source === 'camera' ? await takeDiaryPhoto() : await chooseDiaryPhotos();
    if (!result.success) {
      if (result.error === 'native-module-missing') {
        Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoNativeModuleMissingMessage'));
      } else if (result.error === 'camera-permission-denied') {
        Alert.alert(t('entryPhotoPermissionTitle'), t('entryCameraPermissionMessage'));
      } else {
        Alert.alert(t('entryPhotoPermissionTitle'), t('entryPhotoLibraryPermissionMessage'));
      }
      return;
    }
    if (result.assets.length === 0) return;
    try {
      const imported = await Promise.all(result.assets.map((asset) => diaryPhotoService.importAsset(asset)));
      setEditStickers((current) => [
        ...current,
        ...imported.map((photo, index) => createPlacedPhotoSticker(photo, current.length + index)),
      ]);
    } catch {
      Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage'));
    }
  }, [t]);

  const dismissEntryKeyboard = useCallback(() => {
    editorRef.current?.dismissKeyboard();
    Keyboard.dismiss();
  }, []);

  const handleDelete = async () => {
    if (!entry) return;
    Alert.alert(t('entryDeleteTitle'), t('entryDeleteMessage'), [
      { text: t('entryCancel'), style: 'cancel' },
      {
        text: t('entryDelete'), style: 'destructive',
        onPress: async () => { await deleteDiaryEntry(entry.id); navigateBack(); },
      },
    ]);
  };

  const handleAddReflection = async () => {
    if (!entry) return;
    const trimmed = reflectionText.trim();
    if (!trimmed) return;
    setIsSavingReflection(true);
    const result = await addReflection(entry.id, trimmed);
    setIsSavingReflection(false);
    if (result.success) {
      setEntry(result.data);
      setReflectionText('');
    } else {
      Alert.alert(t('reflectionNotSavedTitle'), result.error.message);
    }
  };

  const handleDeleteReflection = (reflectionId: string) => {
    if (!entry) return;
    Alert.alert(t('reflectionDeleteTitle'), t('reflectionDeleteMessage'), [
      { text: t('entryCancel'), style: 'cancel' },
      {
        text: t('entryDelete'),
        style: 'destructive',
        onPress: async () => {
          const result = await deleteReflection(entry.id, reflectionId);
          if (result.success) setEntry(result.data);
          else Alert.alert(t('reflectionNotDeletedTitle'), result.error.message);
        },
      },
    ]);
  };

  const availableTags = useMemo(() => normalizeDiaryTags(entries.flatMap((item) => item.tags)), [entries]);

  if (!entry) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
          <TouchableOpacity onPress={navigateBack} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel={t('entryBackA11y')}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <View style={styles.headerBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text preset="body" color="textSecondary">{t('entryNotFound')}</Text>
        </View>
      </View>
    );
  }

  const displayStickers = isEditing
    ? editStickers
    : [...entry.stickers, ...entry.photos.map((photo, index) => createPlacedPhotoSticker(photo, entry.stickers.length + index))]
      .map((sticker) => ({ ...sticker, y: Math.max(0, sticker.y - READ_ONLY_STICKER_Y_OFFSET) }));
  const behindDisplayStickers = displayStickers.filter((sticker) => sticker.behindText);
  const foregroundDisplayStickers = displayStickers.filter((sticker) => !sticker.behindText);
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
            <TouchableOpacity onPress={handleCancelEdit} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel={t('entryCancelEditingA11y')}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text preset="label" color="text" style={{ fontWeight: '600' }}>{t('entryEditTitle')}</Text>
            <View style={styles.headerActions}>
              {editStickers.some((sticker) => sticker.behindText) && (
                <TouchableOpacity
                  onPress={() => setEditStickers((current) => current.map((sticker) => ({ ...sticker, behindText: false })))}
                  style={styles.headerIcon}
                  accessibilityRole="button"
                  accessibilityLabel={t('entryBringStickersForwardA11y')}
                >
                  <MaterialCommunityIcons name="layers" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setEditFavorite((current) => !current)} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel={editFavorite ? t('entryRemoveFavoriteA11y') : t('entryAddFavoriteA11y')}>
                <MaterialCommunityIcons name={editFavorite ? 'star' : 'star-outline'} size={21} color={theme.colors.warning} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEntryDetails(true)} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel={t('entryDetailsA11y')}>
                <MaterialCommunityIcons name="information-outline" size={21} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} disabled={isSaving} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel={t('entrySaveChangesA11y')}>
                <MaterialCommunityIcons name="content-save-outline" size={22} color={isSaving ? theme.colors.textSecondary : theme.colors.tint} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={navigateBack} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel={t('entryBackA11y')}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.headerDateSpacer} />
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleStartEdit} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel={t('entryEditA11y')}>
                <MaterialCommunityIcons name="pencil-outline" size={21} color={theme.colors.tint} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel={t('entryDeleteA11y')}>
                <MaterialCommunityIcons name="trash-can-outline" size={21} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>




      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1, zIndex: 2, elevation: 2 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? TOOLBAR_H : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          scrollEnabled={!isStickerDragging}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: TOOLBAR_H + theme.spacing.xl,
            },
          ]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={dismissEntryKeyboard}
          onStartShouldSetResponderCapture={() => {
            dismissEntryKeyboard();
            return false;
          }}
        >
          {behindDisplayStickers.map((sticker) => (
            <StickerCanvasItem
              key={sticker.id}
              sticker={sticker}
              onUpdate={handleUpdateSticker}
              onDelete={handleDeleteSticker}
              isEditable={isEditing}
              onDragStateChange={setIsStickerDragging}
            />
          ))}
          <View style={styles.entryContentLayer}>
            {isEditing ? (
              /* ── Edit mode ──────────────────────────────────────────────── */
              <>
                <DiaryDatePicker value={editDate} onChange={setEditDate} maximumDate={new Date()} />
                <NativeTextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder={t('entryTitlePlaceholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.titleInput, { color: theme.colors.text }]}
                  multiline
                  returnKeyType="next"
                  accessibilityLabel={t('entryTitleA11y')}
                />
                <ManualMoodPicker value={editMood} onChange={setEditMood} />
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <RichTextEditor
                  ref={editorRef}
                  value={editContent}
                  onChangeText={setEditContent}
                  placeholder={t('entryEditContentPlaceholder')}
                  minHeight={320}
                  showToolbar={false}
                  accessibilityLabel={t('entryContentA11y')}
                />
                <View style={styles.belowBodyPickers}>
                  <DiaryJournalSelector
                    selectedJournalIds={editJournalIds}
                    journals={journals}
                    onChange={setEditJournalIds}
                  />
                  <DiaryTagSelector
                    selectedTags={editTags}
                    availableTags={availableTags}
                    onChange={setEditTags}
                  />
                </View>
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
                        {manualMoodLabel(entry.manualMood, t)}
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
          </View>
          {foregroundDisplayStickers.map((sticker) => (
            <StickerCanvasItem
              key={sticker.id}
              sticker={sticker}
              onUpdate={handleUpdateSticker}
              onDelete={handleDeleteSticker}
              isEditable={isEditing}
              onDragStateChange={setIsStickerDragging}
            />
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {!isEditing && (
        <View
          style={[
            styles.floatingBar,
            {
              bottom: 0,
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View style={styles.toolbarLeft}>
            <TouchableOpacity
              style={styles.viewFooterButton}
              onPress={() => setShowReflections(true)}
              activeOpacity={0.6}
              accessibilityLabel={`${t('entryOpenReflectionsA11y')} ${entry.reflections.length} ${t('entrySavedA11y')}`}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="comment-text-outline" size={21} color={theme.colors.tint} />
              <Text preset="caption" color="text" style={styles.viewFooterLabel}>
                {t('reflections')}
              </Text>
              {entry.reflections.length > 0 ? (
                <View style={[styles.reflectionCountBadge, { backgroundColor: theme.colors.tint }]}>
                  <Text preset="caption" style={styles.reflectionCountText}>{entry.reflections.length}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
      )}

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
              accessibilityLabel={showFormattingTools ? t('entryHideFormattingA11y') : t('entryShowFormattingA11y')}
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
              accessibilityLabel={t('entryChooseTemplateA11y')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="file-document-edit-outline" size={22} color={theme.colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolbarIcon}
              onPress={() => handlePhotoPickerResult('camera')}
              activeOpacity={0.6}
              accessibilityLabel={t('entryTakePhotoA11y')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="camera-outline" size={22} color={theme.colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolbarIcon}
              onPress={() => handlePhotoPickerResult('library')}
              activeOpacity={0.6}
              accessibilityLabel={t('entryChoosePhotoA11y')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="image-outline" size={22} color={theme.colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolbarIcon}
              onPress={handleAddTextSticker}
              activeOpacity={0.6}
              accessibilityLabel={t('entryAddTextStickerA11y')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="format-textbox" size={22} color={theme.colors.tint} />
            </TouchableOpacity>
            {/* Sticker button */}
            <TouchableOpacity
              style={styles.toolbarIcon}
              onPress={() => setShowStickerPicker(true)}
              activeOpacity={0.6}
              accessibilityLabel={`${t('entryAddStickerA11y')} ${editStickers.length} ${t('entryStickerPlacedA11y')}`}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="sticker-outline" size={22} color={theme.colors.tint} />
            </TouchableOpacity>
            {keyboardHeight > 0 ? (
              <TouchableOpacity
                style={styles.toolbarIcon}
                onPress={dismissEntryKeyboard}
                activeOpacity={0.6}
                accessibilityLabel={t('entryDismissKeyboardA11y')}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="keyboard-close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Right: word count */}
          <View style={styles.toolbarRight}>
            {wordCount > 0 && (
              <Text preset="caption" style={[styles.wordCount, { color: theme.colors.textSecondary }]}> 
                {wordCount}w
              </Text>
              )}
          </View>
        </View>
      )}

      <StickerPickerModal
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={handleAddSticker}
        onRequestPremium={() => setShowPremiumModal(true)}
      />
      <TemplatePickerModal
        visible={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleSelectTemplate}
      />
      <PaywallModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        appName={APP_IDENTITY.codename}
        title={premiumPaywallTitle(t)}
        subtitle={t('premiumPaywallSubtitle')}
        features={[
          t('premiumPaywallFeatureEntries'),
          t('premiumPaywallFeatureStickers'),
          t('premiumPaywallFeatureInsights'),
          t('premiumPaywallFeatureThemes'),
          t('premiumPaywallFeatureOffline'),
        ]}
      />
      <Modal
        visible={showReflections}
        onDismiss={() => setShowReflections(false)}
        title={t('reflections')}
        accessibilityLabel={t('entryReflectionsA11y')}
        scrollable={false}
      >
        <View style={styles.reflectionsModalBody}>
          <ScrollView style={styles.reflectionsScroll} contentContainerStyle={styles.reflectionsScrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {entry.reflections.length === 0 ? (
              <Text preset="bodySmall" color="textSecondary" style={styles.reflectionsEmpty}>{t('noReflections')}</Text>
            ) : (
              <View style={styles.reflectionsList}>
            {entry.reflections.map((reflection) => (
              <View key={reflection.id} style={styles.reflectionItem}>
                <View style={styles.reflectionHeader}>
                  <Text preset="caption" color="textTertiary">
                    {formatDisplayMonthDayTime(reflection.createdAt, timeFormat)}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteReflection(reflection.id)} accessibilityRole="button" accessibilityLabel={t('reflectionDeleteA11y')}>
                    <Text preset="caption" color="textSecondary">{t('entryDelete')}</Text>
                  </TouchableOpacity>
                </View>
                <Text preset="bodySmall" color="text" style={styles.reflectionText}>{reflection.text}</Text>
              </View>
            ))}
              </View>
            )}
          </ScrollView>
          <View style={[styles.reflectionInputBox, { minHeight: Math.max(38, theme.fontSizes.sm * 2.7), borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <NativeTextInput
            value={reflectionText}
            onChangeText={setReflectionText}
            placeholder={t('addReflectionPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.reflectionInput,
              {
                height: Math.max(36, theme.fontSizes.sm * 2.5),
                color: theme.colors.text,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSizes.sm,
                lineHeight: theme.fontSizes.sm * 1.35,
              },
            ]}
            returnKeyType="send"
            onSubmitEditing={handleAddReflection}
            accessibilityLabel={t('reflectionTextA11y')}
          />
          <TouchableOpacity
            onPress={handleAddReflection}
            disabled={isSavingReflection || !reflectionText.trim()}
            style={[
              styles.reflectionButton,
              { backgroundColor: reflectionText.trim() && !isSavingReflection ? theme.colors.tint : 'transparent' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('reflectionAddA11y')}
          >
            <MaterialCommunityIcons name="plus" size={18} color={reflectionText.trim() && !isSavingReflection ? '#fff' : theme.colors.textSecondary} />
          </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <EntryDetailsModal
        visible={showEntryDetails}
        onDismiss={() => setShowEntryDetails(false)}
        values={{ manualMood: editMood, manualMoodWeather: editMoodWeather, journalIds: editJournalIds, writingMode: editWritingMode, sensory: { locationLabel: editLocation, sounds: editSounds, smells: editSmells, energyLevel: Number(editEnergy) || 5, bodyState: editBody }, isLockbox: editLockbox, timeCapsuleUnlockAt: editUnlockAt, expiresAt: editExpiresAt }}
        journals={journals}
        onChange={(next) => { if (next.manualMood) setEditMood(next.manualMood); if (next.manualMoodWeather) setEditMoodWeather(next.manualMoodWeather); if (next.journalIds) setEditJournalIds([...next.journalIds]); if (next.writingMode) setEditWritingMode(next.writingMode); if (next.sensory) { setEditLocation(next.sensory.locationLabel); setEditSounds(next.sensory.sounds); setEditSmells(next.sensory.smells); setEditEnergy(String(next.sensory.energyLevel)); setEditBody(next.sensory.bodyState); } if (next.isLockbox !== undefined) setEditLockbox(next.isLockbox); if (next.timeCapsuleUnlockAt !== undefined) setEditUnlockAt(next.timeCapsuleUnlockAt); if (next.expiresAt !== undefined) setEditExpiresAt(next.expiresAt); }}
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
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  headerDateSpacer: { flex: 1 },
  scrollContent: {
    paddingTop: 6,
    flexGrow: 1,
    position: 'relative',
  },
  entryContentLayer: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
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
    marginBottom: 8,
  },
  belowBodyPickers: {
    marginTop: 14,
    paddingTop: 8,
  },
  headerActions: { minWidth: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  headerIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
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
  reflectionsModalBody: { maxHeight: 520 },
  reflectionsScroll: { maxHeight: 440 },
  reflectionsScrollContent: { paddingBottom: 12 },
  reflectionsEmpty: { marginBottom: 12 },
  reflectionsList: { gap: 6, marginTop: 4, marginBottom: 12 },
  reflectionItem: {
    paddingVertical: 1,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  reflectionText: { lineHeight: 20, marginTop: 2 },
  reflectionInputBox: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 4,
  },
  reflectionInput: {
    flex: 1,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  reflectionButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewFooterButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  viewFooterLabel: { fontWeight: '700' },
  reflectionCountBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionCountText: { color: '#fff', fontSize: 11, lineHeight: 22, fontWeight: '700', textAlign: 'center', includeFontPadding: false },
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
});
