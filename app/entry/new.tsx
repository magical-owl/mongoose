/**
 * Create Diary Entry Screen
 *
 * Design mirrors the reference diary app:
 *   - Thin header:  Cancel | date | Save
 *   - Full-bleed journal body: title → rich editor
 *   - Stickers float absolutely over the scroll area
 *   - Floating bottom toolbar (above keyboard) with formatting + sticker icons
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  LayoutAnimation,
  Alert,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextInput as NativeTextInput,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@shared/components/Text';
import { RichTextEditor, type RichTextEditorHandle, type FormatActionKind } from '@shared/components/RichTextEditor';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useJournals } from '@/features/journal/hooks/useJournals';
import { useAppStore } from '@/stores/useAppStore';
import { DiaryEntry, ManualMood, ManualMoodWeather, WritingMode } from '@/features/diary/domain/DiaryEntry';
import { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { TemplatePickerModal } from '@/features/diary/components/TemplatePickerModal';
import { Template } from '@/features/diary/domain/Template';
import { generateUUID } from '@/shared/utils/uuid';
import { diaryDraftService } from '@/features/diary/services/DiaryDraftService';
import { EntryDetailsModal } from '@/features/diary/components/EntryDetailsModal';
import { ManualMoodPicker } from '@/features/diary/components/ManualMoodPicker';
import { DiaryDatePicker } from '@/features/diary/components/DiaryDatePicker';
import { DiaryJournalSelector } from '@/features/diary/components/DiaryJournalSelector';
import { DiaryTagSelector } from '@/features/diary/components/DiaryTagSelector';
import { normalizeDiaryTags } from '@/features/diary/services/DiaryTagService';
import { chooseDiaryPhotos, takeDiaryPhoto } from '@/features/diary/services/DiaryPhotoPickerService';
import { createPlacedPhotoSticker, diaryPhotoService } from '@/features/diary/services/DiaryPhotoService';
import { premiumPaywallTitle, useTranslation } from '@/localization/i18n';
import { PaywallModal } from '@/shared/components/PaywallModal';
import { isPlanLimitErrorCode } from '@/features/subscription/services/PlanLimitService';
import { APP_IDENTITY } from '@/config/appIdentity';

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
  { kind: 'align-left', icon: 'format-align-left' },
  { kind: 'align-center', icon: 'format-align-center' },
  { kind: 'align-right', icon: 'format-align-right' },
  { kind: 'align-justify', icon: 'format-align-justify' },
];
const DEFAULT_COMPANION = 'cat' as const;
const STICKER_PLACEMENT_SIZE = 96;
const TEXT_STICKER_PLACEMENT_WIDTH = 160;
const PHOTO_STICKER_PLACEMENT_WIDTH = 148;
const VISIBLE_STICKER_STAGGER = 18;

function isSyntheticJournalId(value: string): boolean {
  return value === 'all' || value === 'unassigned';
}

export default function CreateEntryScreen() {
  const router = useRouter();
  const { date: paramDate, journalId: paramJournalId } = useLocalSearchParams<{ date?: string; journalId?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const t = useTranslation();
  const { entries, saveDiaryEntry } = useDiary();
  const { journals } = useJournals();
  const selectedCalendarDate = useAppStore((state) => state.selectedCalendarDate);
  const setSelectedCalendarDate = useAppStore((state) => state.setSelectedCalendarDate);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const isHydratingDraft = useRef(true);
  const scrollOffsetYRef = useRef(0);

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
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showFormattingTools, setShowFormattingTools] = useState(false);
  const [manualMoodWeather, setManualMoodWeather] = useState<ManualMoodWeather>('neutral');
  const [manualMood, setManualMood] = useState<ManualMood>('neutral');
  const [writingMode, setWritingMode] = useState<WritingMode>('free-write');
  const [locationLabel, setLocationLabel] = useState('');
  const [sounds, setSounds] = useState('');
  const [smells, setSmells] = useState('');
  const [energyLevel, setEnergyLevel] = useState('5');
  const [bodyState, setBodyState] = useState('');
  const [isLockbox, setIsLockbox] = useState(false);
  const [timeCapsuleUnlockAt, setTimeCapsuleUnlockAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedJournalIds, setSelectedJournalIds] = useState<string[]>(() => paramJournalId && !isSyntheticJournalId(paramJournalId) ? [paramJournalId] : []);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isStickerDragging, setIsStickerDragging] = useState(false);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
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
      setStickers([...draft.stickers, ...draft.photos.map((photo, index) => createPlacedPhotoSticker(photo, draft.stickers.length + index))]);
      setSelectedTags(normalizeDiaryTags(draft.tags));
      setManualMoodWeather(draft.manualMoodWeather);
      setManualMood(draft.manualMood ?? 'neutral');
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
    }).catch(() => {
      isHydratingDraft.current = false;
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (isHydratingDraft.current || (!title.trim() && !content.trim())) return;
    const timer = setTimeout(() => {
      void diaryDraftService.save({
        title,
        content,
        date: isoDate,
        companion: DEFAULT_COMPANION,
        stickers,
        photos: [],
        tags: selectedTags,
        manualMood, manualMoodWeather, writingMode,
        sensory: { locationLabel, sounds, smells, energyLevel: Number(energyLevel) || 5, bodyState },
        isLockbox, timeCapsuleUnlockAt: timeCapsuleUnlockAt ? new Date(timeCapsuleUnlockAt).toISOString() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [title, content, isoDate, stickers, selectedTags, manualMood, manualMoodWeather, writingMode, locationLabel, sounds, smells, energyLevel, bodyState, isLockbox, timeCapsuleUnlockAt, expiresAt]);

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
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const wordCount = countWords(content);
  const availableTags = useMemo(() => normalizeDiaryTags(entries.flatMap((entry) => entry.tags)), [entries]);
  const behindStickers = useMemo(() => stickers.filter((sticker) => sticker.behindText), [stickers]);
  const foregroundStickers = useMemo(() => stickers.filter((sticker) => !sticker.behindText), [stickers]);
  const getVisibleStickerPosition = useCallback((index: number, stickerWidth = STICKER_PLACEMENT_SIZE) => {
    const horizontalPadding = theme.spacing.lg * 2;
    const usableWidth = Math.max(stickerWidth, windowWidth - horizontalPadding);
    const stagger = (index % 5) * VISIBLE_STICKER_STAGGER;
    return {
      x: Math.max(0, (usableWidth - stickerWidth) / 2 + stagger),
      y: Math.max(0, scrollOffsetYRef.current + Math.max(180, scrollViewportHeight) / 2 - STICKER_PLACEMENT_SIZE / 2 + stagger),
    };
  }, [scrollViewportHeight, theme.spacing.lg, windowWidth]);

  const handleEditorScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleAddSticker = useCallback((stickerId: string, category: string) => {
    const position = getVisibleStickerPosition(stickers.length);
    const newSticker: PlacedSticker = {
      id: generateUUID(),
      stickerId,
      category,
      x: position.x,
      y: position.y,
      scale: 1,
      rotation: Math.floor(Math.random() * 30) - 15,
      zIndex: stickers.length + 1,
      behindText: false,
    };
    setStickers((prev) => [...prev, newSticker]);
  }, [getVisibleStickerPosition, stickers.length]);

  const handleUpdateSticker = useCallback((updated: PlacedSticker) => {
    setStickers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleDeleteSticker = useCallback((id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleAddTextSticker = useCallback(() => {
    const position = getVisibleStickerPosition(stickers.length, TEXT_STICKER_PLACEMENT_WIDTH);
    const newSticker: PlacedSticker = {
      id: generateUUID(),
      stickerId: 'text-sticker',
      category: 'text',
      x: position.x,
      y: position.y,
      scale: 1,
      rotation: 0,
      zIndex: stickers.length + 1,
      behindText: false,
      text: '',
      textColor: '#DC2626',
      textBackgroundColor: '#E5E7EB',
      opacity: 1,
    };
    setStickers((prev) => [...prev, newSticker]);
  }, [getVisibleStickerPosition, setStickers, stickers.length]);

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
      setStickers((current) => [
        ...current,
        ...imported.map((photo, index) => ({
          ...createPlacedPhotoSticker(photo, current.length + index),
          ...getVisibleStickerPosition(current.length + index, PHOTO_STICKER_PLACEMENT_WIDTH),
        })),
      ]);
    } catch {
      Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage'));
    }
  }, [getVisibleStickerPosition, t]);

  const dismissEntryKeyboard = useCallback(() => {
    editorRef.current?.dismissKeyboard();
    Keyboard.dismiss();
  }, []);

  const navigateBack = () => {
    setSelectedCalendarDate(null);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('entryTitleRequiredTitle'), t('entryCreateTitleRequiredMessage'));
      return;
    }
    if (!content.trim()) {
      Alert.alert(t('entryContentRequiredTitle'), t('entryContentRequiredMessage'));
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
      photos: [],
      companion: DEFAULT_COMPANION,
      isFavorite,
      tags: selectedTags,
      manualMoodWeather,
      manualMood,
      writingMode,
      sensory: { locationLabel, sounds, smells, energyLevel: Math.min(10, Math.max(1, Number(energyLevel) || 5)), bodyState },
      isLockbox,
      timeCapsuleUnlockAt: timeCapsuleUnlockAt ? new Date(timeCapsuleUnlockAt).toISOString() : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      collectionIds: selectedJournalIds,
      journalIds: selectedJournalIds,
      reflections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await saveDiaryEntry(newEntry);
    setIsSaving(false);
    if (result.success) {
      await diaryDraftService.clear();
      setSelectedCalendarDate(null);
      navigateBack();
    } else if (isPlanLimitErrorCode(result.error.code)) {
      setShowPremiumModal(true);
    } else {
      Alert.alert(t('entryErrorTitle'), result.error.message);
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
          accessibilityLabel={t('entryCancelA11y')}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <Text preset="label" color="text" style={{ fontWeight: '600' }}>
          {t('entryCreateTitle')}
        </Text>

        <View style={styles.headerActions}>
          {stickers.some((sticker) => sticker.behindText) && (
          <TouchableOpacity
            onPress={() => setStickers((current) => current.map((sticker) => ({ ...sticker, behindText: false })))}
            style={styles.headerIcon}
            accessibilityRole="button"
            accessibilityLabel={t('entryBringStickersForwardA11y')}
          >
            <MaterialCommunityIcons name="layers" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setIsFavorite((current) => !current)}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? t('entryRemoveFavoriteA11y') : t('entryAddFavoriteA11y')}
          >
            <MaterialCommunityIcons name={isFavorite ? 'star' : 'star-outline'} size={21} color={theme.colors.warning} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowEntryDetails(true)}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel={t('entryDetailsA11y')}
          >
            <MaterialCommunityIcons name="information-outline" size={21} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={styles.headerBtn}
            accessibilityLabel={t('entrySaveA11y')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="content-save-outline" size={22} color={isSaving ? theme.colors.textSecondary : theme.colors.tint} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Journal body ─────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1, zIndex: 2, elevation: 2 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? TOOLBAR_H : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          scrollEnabled={!isStickerDragging}
          onLayout={(event) => setScrollViewportHeight(event.nativeEvent.layout.height)}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: TOOLBAR_H + theme.spacing.xl,
            },
          ]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          onScroll={handleEditorScroll}
          onScrollBeginDrag={dismissEntryKeyboard}
          scrollEventThrottle={16}
          onStartShouldSetResponderCapture={() => {
            dismissEntryKeyboard();
            return false;
          }}
          showsVerticalScrollIndicator={false}
        >
          {behindStickers.map((sticker) => (
            <StickerCanvasItem
              key={sticker.id}
              sticker={sticker}
              onUpdate={handleUpdateSticker}
              onDelete={handleDeleteSticker}
              onDragStateChange={setIsStickerDragging}
            />
          ))}
          <View style={styles.entryContentLayer}>
            <DiaryDatePicker value={selectedDate} onChange={setSelectedDate} maximumDate={new Date()} />

            {/* Title */}
            <NativeTextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('entryTitlePlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              style={[styles.titleInput, { color: theme.colors.text }]}
              multiline
              returnKeyType="next"
              accessibilityLabel={t('entryTitleA11y')}
              accessibilityHint={t('entryTitleHint')}
            />

            <ManualMoodPicker value={manualMood} onChange={setManualMood} />

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Rich content editor — toolbar hidden, controlled from floating bar */}
            <RichTextEditor
              ref={editorRef}
              value={content}
              onChangeText={setContent}
              placeholder={t('entryCreateContentPlaceholder')}
              minHeight={320}
              showToolbar={false}
              accessibilityLabel={t('entryContentA11y')}
            />
            <View style={styles.belowBodyPickers}>
              <DiaryJournalSelector
                selectedJournalIds={selectedJournalIds}
                journals={journals}
                onChange={setSelectedJournalIds}
              />
              <DiaryTagSelector
                selectedTags={selectedTags}
                availableTags={availableTags}
                onChange={setSelectedTags}
              />
            </View>
          </View>
          {foregroundStickers.map((sticker) => (
            <StickerCanvasItem
              key={sticker.id}
              sticker={sticker}
              onUpdate={handleUpdateSticker}
              onDelete={handleDeleteSticker}
              onDragStateChange={setIsStickerDragging}
            />
          ))}
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

          <View style={[styles.toolbarGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
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
          </View>

          <View style={[styles.toolbarGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
            <TouchableOpacity
              style={styles.toolbarIcon}
              onPress={handleAddTextSticker}
              activeOpacity={0.6}
              accessibilityLabel={t('entryAddTextStickerA11y')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="format-textbox" size={22} color={theme.colors.tint} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolbarIcon}
              onPress={() => setShowStickerPicker(true)}
              activeOpacity={0.6}
              accessibilityLabel={`${t('entryAddStickerA11y')} ${stickers.length} ${t('entryStickerPlacedA11y')}`}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="sticker-outline" size={22} color={theme.colors.tint} />
            </TouchableOpacity>
          </View>
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

      {/* Modals */}
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
      <EntryDetailsModal
        visible={showEntryDetails}
        onDismiss={() => setShowEntryDetails(false)}
        values={{ manualMood, manualMoodWeather, journalIds: selectedJournalIds, writingMode, sensory: { locationLabel, sounds, smells, energyLevel: Number(energyLevel) || 5, bodyState }, isLockbox, timeCapsuleUnlockAt, expiresAt }}
        journals={journals}
        onChange={(next) => {
          if (next.manualMood) setManualMood(next.manualMood);
          if (next.manualMoodWeather) setManualMoodWeather(next.manualMoodWeather);
          if (next.journalIds) setSelectedJournalIds([...next.journalIds]);
          if (next.writingMode) setWritingMode(next.writingMode);
          if (next.sensory) { setLocationLabel(next.sensory.locationLabel); setSounds(next.sensory.sounds); setSmells(next.sensory.smells); setEnergyLevel(String(next.sensory.energyLevel)); setBodyState(next.sensory.bodyState); }
          if (next.isLockbox !== undefined) setIsLockbox(next.isLockbox);
          if (next.timeCapsuleUnlockAt !== undefined) setTimeCapsuleUnlockAt(next.timeCapsuleUnlockAt);
          if (next.expiresAt !== undefined) setExpiresAt(next.expiresAt);
        }}
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
  headerActions: { minWidth: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
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
  headerIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
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
    gap: 4,
  },
  formattingDrawer: { flex: 1 },
  toolbarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
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
});
