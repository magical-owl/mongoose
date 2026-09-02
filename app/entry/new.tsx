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
  Animated,
  View,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TextInput as NativeTextInput,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccentPillButton } from '@shared/components/AccentPillButton';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { RichTextEditor, type RichTextEditorHandle } from '@shared/components/RichTextEditor';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useJournals } from '@/features/journal/hooks/useJournals';
import { useAppStore } from '@/stores/useAppStore';
import { DiaryEntry, DiaryPhoto, ManualMood, ManualMoodWeather, WritingMode, getPrimaryManualMood, normalizeManualMoods } from '@/features/diary/domain/DiaryEntry';
import { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { TemplatePickerModal } from '@/features/diary/components/TemplatePickerModal';
import { Template } from '@/features/diary/domain/Template';
import { generateUUID } from '@/shared/utils/uuid';
import { diaryDraftService } from '@/features/diary/services/DiaryDraftService';
import { RichTextFormattingDrawer, type RichTextFormatItem } from '@/features/diary/components/RichTextFormattingDrawer';
import { DiaryDatePicker } from '@/features/diary/components/DiaryDatePicker';
import { DiaryCoverPhotoPicker } from '@/features/diary/components/DiaryCoverPhotoPicker';
import { DiaryPaperCanvas } from '@/features/diary/components/DiaryPaperCanvas';
import { DiaryPaperBackgroundPickerModal } from '@/features/diary/components/DiaryPaperBackgroundPickerModal';
import { EntryMetadataModal } from '@/features/diary/components/EntryMetadataModal';
import { DEFAULT_DIARY_PAPER_BACKGROUND_ID } from '@/features/diary/domain/DiaryPaperBackgrounds';
import { DIARY_BODY_DEFAULT_FONT_FAMILY, type DiaryBodyFontFamily, type DiaryBodyTextColor } from '@/features/diary/domain/DiaryBodyStyle';
import { normalizeDiaryTags } from '@/features/diary/services/DiaryTagService';
import { chooseDiaryPhoto, takeDiaryPhoto } from '@/features/diary/services/DiaryPhotoPickerService';
import { createPlacedPhotoSticker, diaryPhotoService } from '@/features/diary/services/DiaryPhotoService';
import { premiumPaywallTitle, useTranslation } from '@/localization/i18n';
import { PaywallModal } from '@/shared/components/PaywallModal';
import { isPlanLimitErrorCode } from '@/features/subscription/services/PlanLimitService';
import { APP_IDENTITY } from '@/config/appIdentity';
import { useScrollCollapse } from '@/shared/hooks/useScrollCollapse';
import { getStickerBodyPreviewBottom } from '@/features/diary/domain/StickerLayout';
import { resolveAppFontFamily } from '@/theme/fonts';
import {
  DiaryEntryEditorFooter,
  DiaryEntryEditorHeader,
  ENTRY_EDITOR_BODY_DEFAULT_VIEWPORT_RATIO,
  ENTRY_EDITOR_BODY_EXTRA_STICKER_SPACE,
  ENTRY_EDITOR_BODY_FONT_SIZE,
  ENTRY_EDITOR_BODY_LINE_HEIGHT,
  ENTRY_EDITOR_BODY_MIN_HEIGHT,
  ENTRY_EDITOR_COVER_TOP_GAP,
  ENTRY_EDITOR_HEADER_BOTTOM_PADDING,
  ENTRY_EDITOR_HEADER_BUTTON_HEIGHT,
  ENTRY_EDITOR_HEADER_TOP_OFFSET,
  ENTRY_EDITOR_TOOLBAR_HEIGHT,
  diaryEntryEditorChromeStyles,
  getEntryEditorCoverHeight,
  getEntryEditorHorizontalPadding,
  getEntryEditorScrollBottomPadding,
  ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET,
} from '@/features/diary/components/DiaryEntryEditorChrome';

// Word count helper (strips markdown syntax)
function countWords(text: string): number {
  const clean = text.replace(/[*#`>•\-_]/g, '').trim();
  return clean ? clean.split(/\s+/).filter(Boolean).length : 0;
}

// Toolbar format items
const FORMAT_ITEMS: readonly RichTextFormatItem[] = [
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
const INITIAL_STICKER_SCALE = 2.25;
const TEXT_STICKER_PLACEMENT_WIDTH = 160;
const PHOTO_STICKER_PLACEMENT_WIDTH = 148;
const VISIBLE_STICKER_STAGGER = 18;
const ENTRY_HEADER_TOP_OFFSET = ENTRY_EDITOR_HEADER_TOP_OFFSET;
const ENTRY_HEADER_BUTTON_HEIGHT = ENTRY_EDITOR_HEADER_BUTTON_HEIGHT;
const ENTRY_HEADER_BOTTOM_PADDING = ENTRY_EDITOR_HEADER_BOTTOM_PADDING;
const ENTRY_COVER_TOP_GAP = ENTRY_EDITOR_COVER_TOP_GAP;
const ENTRY_EDIT_COVER_BOTTOM_GAP = 0;
const ENTRY_VIEW_COVER_EXPANDED_HEIGHT = 270;
const ENTRY_BODY_MIN_HEIGHT = ENTRY_EDITOR_BODY_MIN_HEIGHT;
const ENTRY_BODY_DEFAULT_VIEWPORT_RATIO = ENTRY_EDITOR_BODY_DEFAULT_VIEWPORT_RATIO;
const ENTRY_BODY_EXTRA_STICKER_SPACE = ENTRY_EDITOR_BODY_EXTRA_STICKER_SPACE;
const EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO = 0.5;

function isSyntheticJournalId(value: string): boolean {
  return value === 'all' || value === 'unassigned';
}

export default function CreateEntryScreen() {
  const router = useRouter();
  const { date: paramDate, journalId: paramJournalId } = useLocalSearchParams<{ date?: string; journalId?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const t = useTranslation();
  const { entries, saveDiaryEntry } = useDiary();
  const { journals } = useJournals();
  const selectedCalendarDate = useAppStore((state) => state.selectedCalendarDate);
  const setSelectedCalendarDate = useAppStore((state) => state.setSelectedCalendarDate);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const isHydratingDraft = useRef(true);
  const stickerBoundsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCoverScrollBeginDrag = useCallback(() => {
    editorRef.current?.dismissKeyboard();
    Keyboard.dismiss();
  }, []);
  const {
    scrollY: coverScrollY,
    scrollOffsetYRef,
    handleScroll: handleEditorScroll,
    handleScrollBeginDrag: handleEditorScrollBeginDrag,
  } = useScrollCollapse({ onScrollBeginDrag: handleCoverScrollBeginDrag });

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
  const [coverPhoto, setCoverPhoto] = useState<DiaryPhoto | undefined>();
  const [paperBackgroundId, setPaperBackgroundId] = useState<string>(DEFAULT_DIARY_PAPER_BACKGROUND_ID);
  const [bodyFontFamily, setBodyFontFamily] = useState<DiaryBodyFontFamily>(DIARY_BODY_DEFAULT_FONT_FAMILY);
  const [bodyTextColor, setBodyTextColor] = useState<DiaryBodyTextColor | undefined>();
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showPaperBackgroundPicker, setShowPaperBackgroundPicker] = useState(false);
  const [showFormattingTools, setShowFormattingTools] = useState(false);
  const [showEntryMetadata, setShowEntryMetadata] = useState(false);
  const [manualMoodWeather, setManualMoodWeather] = useState<ManualMoodWeather>('neutral');
  const [manualMoods, setManualMoods] = useState<ManualMood[]>(['neutral']);
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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isStickerDragging, setIsStickerDragging] = useState(false);
  const [showStickerBounds, setShowStickerBounds] = useState(false);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const [bodyContentHeight, setBodyContentHeight] = useState(ENTRY_BODY_MIN_HEIGHT);
  const [bodyLayout, setBodyLayout] = useState({
    y: 0,
    width: 0,
    height: ENTRY_BODY_MIN_HEIGHT,
  });
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
      setCoverPhoto(draft.coverPhoto);
      setPaperBackgroundId(draft.paperBackgroundId);
      setBodyFontFamily(draft.bodyFontFamily);
      setBodyTextColor(draft.bodyTextColor);
      setStickers([...draft.stickers, ...draft.photos.map((photo, index) => createPlacedPhotoSticker(photo, draft.stickers.length + index))]);
      setSelectedTags(normalizeDiaryTags(draft.tags));
      setManualMoodWeather(draft.manualMoodWeather);
      setManualMoods(normalizeManualMoods(draft.manualMoods, draft.manualMood ?? 'neutral'));
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
        coverPhoto,
        paperBackgroundId,
        bodyFontFamily,
        bodyTextColor,
        photos: [],
        tags: selectedTags,
        manualMood: getPrimaryManualMood(manualMoods),
        manualMoods,
        manualMoodWeather,
        writingMode,
        sensory: { locationLabel, sounds, smells, energyLevel: Number(energyLevel) || 5, bodyState },
        isLockbox, timeCapsuleUnlockAt: timeCapsuleUnlockAt ? new Date(timeCapsuleUnlockAt).toISOString() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [title, content, isoDate, stickers, coverPhoto, paperBackgroundId, bodyFontFamily, bodyTextColor, selectedTags, manualMoods, manualMoodWeather, writingMode, locationLabel, sounds, smells, energyLevel, bodyState, isLockbox, timeCapsuleUnlockAt, expiresAt]);

  useEffect(() => () => {
    if (stickerBoundsTimer.current) clearTimeout(stickerBoundsTimer.current);
  }, []);

  const revealStickerBounds = useCallback(() => {
    setShowStickerBounds(true);
    if (stickerBoundsTimer.current) clearTimeout(stickerBoundsTimer.current);
    stickerBoundsTimer.current = setTimeout(() => {
      setShowStickerBounds(false);
      stickerBoundsTimer.current = null;
    }, 3500);
  }, []);

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
  const closeFormattingTools = useCallback(() => {
    setShowFormattingTools(false);
  }, []);

  // Track keyboard height to float toolbar above it
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const wordCount = countWords(content);
  const availableTags = useMemo(() => normalizeDiaryTags(entries.flatMap((entry) => entry.tags)), [entries]);
  const behindStickers = useMemo(() => stickers.filter((sticker) => sticker.behindText), [stickers]);
  const foregroundStickers = useMemo(() => stickers.filter((sticker) => !sticker.behindText), [stickers]);
  const getVisibleStickerPosition = useCallback((index: number, stickerWidth = STICKER_PLACEMENT_SIZE) => {
    const horizontalPadding = theme.spacing.lg * 2;
    const usableWidth = Math.max(stickerWidth, bodyLayout.width || windowWidth - horizontalPadding);
    const usableHeight = Math.max(ENTRY_BODY_MIN_HEIGHT, bodyLayout.height);
    const viewportTopInBody = Math.max(0, scrollOffsetYRef.current - bodyLayout.y);
    const viewportBottomInBody = Math.min(
      usableHeight,
      scrollOffsetYRef.current + scrollViewportHeight - bodyLayout.y,
    );
    const visibleBodyHeight = Math.max(180, viewportBottomInBody - viewportTopInBody);
    const stagger = (index % 5) * VISIBLE_STICKER_STAGGER;
    return {
      x: Math.max(0, Math.min(usableWidth - stickerWidth, (usableWidth - stickerWidth) / 2 + stagger)),
      y: Math.max(0, Math.min(usableHeight - STICKER_PLACEMENT_SIZE, viewportTopInBody + visibleBodyHeight / 2 - STICKER_PLACEMENT_SIZE / 2 + stagger)),
    };
  }, [bodyLayout, scrollOffsetYRef, scrollViewportHeight, theme.spacing.lg, windowWidth]);

  const handleAddSticker = useCallback((stickerId: string, category: string) => {
    revealStickerBounds();
    const position = getVisibleStickerPosition(stickers.length);
    const newSticker: PlacedSticker = {
      id: generateUUID(),
      stickerId,
      category,
      x: position.x,
      y: position.y,
      scale: INITIAL_STICKER_SCALE,
      rotation: Math.floor(Math.random() * 30) - 15,
      zIndex: stickers.length + 1,
      behindText: false,
    };
    setStickers((prev) => [...prev, newSticker]);
  }, [getVisibleStickerPosition, revealStickerBounds, stickers.length]);

  const handleUpdateSticker = useCallback((updated: PlacedSticker) => {
    setStickers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleDeleteSticker = useCallback((id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleAddTextSticker = useCallback(() => {
    revealStickerBounds();
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
  }, [getVisibleStickerPosition, revealStickerBounds, setStickers, stickers.length]);

  const handleAddPhotoStickers = useCallback(async () => {
    const result = await chooseDiaryPhoto();
    if (!result.success) {
      if (result.error === 'native-module-missing') {
        Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoNativeModuleMissingMessage'));
      } else {
        Alert.alert(t('entryPhotoPermissionTitle'), t('entryPhotoLibraryPermissionMessage'));
      }
      return;
    }
    if (result.assets.length === 0) return;
    try {
      const imported = await Promise.all(result.assets.map((asset) => diaryPhotoService.importAsset(asset)));
      revealStickerBounds();
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
  }, [getVisibleStickerPosition, revealStickerBounds, t]);

  const handleCoverPhotoPickerResult = useCallback(async (source: 'camera' | 'library') => {
    const result = source === 'camera' ? await takeDiaryPhoto() : await chooseDiaryPhoto();
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
    const [asset] = result.assets;
    if (!asset) return;
    try {
      const imported = await diaryPhotoService.importAsset(asset);
      setCoverPhoto(imported);
    } catch {
      Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage'));
    }
  }, [t]);

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
      paperBackgroundId,
      bodyFontFamily,
      bodyTextColor,
      stickers,
      coverPhoto,
      photos: [],
      companion: DEFAULT_COMPANION,
      isFavorite,
      tags: selectedTags,
      manualMoodWeather,
      manualMood: getPrimaryManualMood(manualMoods),
      manualMoods,
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
  const TOOLBAR_H = ENTRY_EDITOR_TOOLBAR_HEIGHT;
  const entryHorizontalPadding = getEntryEditorHorizontalPadding(windowWidth);
  const hasCreateCoverPhoto = Boolean(coverPhoto);
  const coverExpandedHeight = hasCreateCoverPhoto
    ? ENTRY_VIEW_COVER_EXPANDED_HEIGHT
    : getEntryEditorCoverHeight(windowWidth, entryHorizontalPadding);
  const showBodyStickerBounds = showStickerPicker || showStickerBounds || isStickerDragging;
  const stickerCanvasBottom = stickers.length > 0
    ? Math.max(...stickers.map((sticker) => getStickerBodyPreviewBottom(sticker)))
    : 0;
  const bodyCanvasHeight = Math.max(
    ENTRY_BODY_MIN_HEIGHT,
    Math.round(windowHeight * ENTRY_BODY_DEFAULT_VIEWPORT_RATIO),
    bodyContentHeight + ENTRY_BODY_EXTRA_STICKER_SPACE,
    stickerCanvasBottom + ENTRY_BODY_EXTRA_STICKER_SPACE,
  );
  const headerOnlyHeight = insets.top
    + ENTRY_HEADER_TOP_OFFSET
    + ENTRY_HEADER_BUTTON_HEIGHT
    + ENTRY_HEADER_BOTTOM_PADDING;
  const headerOverlayHeight = hasCreateCoverPhoto
    ? coverExpandedHeight + ENTRY_EDIT_COVER_BOTTOM_GAP
    : headerOnlyHeight + ENTRY_COVER_TOP_GAP + coverExpandedHeight;
  const paperBackdropTop = hasCreateCoverPhoto
    ? coverScrollY.interpolate({
        inputRange: [0, 120],
        outputRange: [coverExpandedHeight, 0],
        extrapolate: 'clamp',
      })
    : 0;
  const coverTopOffset = hasCreateCoverPhoto ? 0 : headerOnlyHeight + ENTRY_COVER_TOP_GAP;
  const entryPlaceholderColor = theme.colors.stickerControlText;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <DiaryEntryEditorHeader
        topInset={insets.top}
        horizontalPadding={entryHorizontalPadding}
        title={t('entryCreateTitle')}
        onCover
        left={(
          <IconCircleButton
            icon="close-circle-outline"
            onPress={navigateBack}
            accessibilityLabel={t('entryCancelA11y')}
            iconSize={25}
            surface="overlay"
          />
        )}
        actions={(
          <>
          {stickers.some((sticker) => sticker.behindText) && (
          <IconCircleButton
            icon="layers"
            onPress={() => setStickers((current) => current.map((sticker) => ({ ...sticker, behindText: false })))}
            style={styles.headerIcon}
            accessibilityLabel={t('entryBringStickersForwardA11y')}
            iconSize={20}
            size="sm"
            surface="overlay"
          />
          )}

          <IconCircleButton
            icon={isFavorite ? 'star' : 'star-outline'}
            onPress={() => setIsFavorite((current) => !current)}
            accessibilityLabel={isFavorite ? t('entryRemoveFavoriteA11y') : t('entryAddFavoriteA11y')}
            active={isFavorite}
            tone="warning"
            iconSize={24}
            surface="overlay"
          />

          <AccentPillButton
            onPress={handleSave}
            disabled={isSaving}
            label={isSaving ? t('entrySaving') : t('entrySave')}
            accessibilityLabel={t('entrySaveA11y')}
          />
          </>
        )}
      />

      <View
        style={[
          styles.coverHeader,
          hasCreateCoverPhoto
            ? styles.coverHeaderFullBleed
            : { top: coverTopOffset, paddingHorizontal: entryHorizontalPadding, backgroundColor: 'transparent' },
        ]}
      >
        <DiaryCoverPhotoPicker
          photo={coverPhoto}
          variant="entryHero"
          height={coverExpandedHeight}
          onTakePhoto={() => handleCoverPhotoPickerResult('camera')}
          onChoosePhoto={() => handleCoverPhotoPickerResult('library')}
          onRemovePhoto={() => setCoverPhoto(undefined)}
          scrollY={coverScrollY}
          containerStyle={hasCreateCoverPhoto ? styles.viewCoverPicker : undefined}
          actionAreaTopInset={hasCreateCoverPhoto ? headerOnlyHeight : 0}
        />
      </View>

      <Animated.View pointerEvents="none" style={[styles.entryPaperBackdropFrame, { top: paperBackdropTop }]}>
        <DiaryPaperCanvas
          paperBackgroundId={paperBackgroundId}
          style={styles.entryPaperBackdrop}
          testID="entry-create-paper-canvas"
        />
      </Animated.View>

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
              paddingHorizontal: entryHorizontalPadding,
              minHeight: windowHeight + coverExpandedHeight,
              paddingTop: headerOverlayHeight,
              paddingBottom: getEntryEditorScrollBottomPadding(insets.bottom, theme.spacing.xl),
            },
          ]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          onScroll={handleEditorScroll}
          onScrollBeginDrag={() => {
            closeFormattingTools();
            handleEditorScrollBeginDrag();
          }}
          scrollEventThrottle={16}
          onStartShouldSetResponderCapture={() => {
            closeFormattingTools();
            dismissEntryKeyboard();
            return false;
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.entryContentLayer}>
            <DiaryDatePicker value={selectedDate} onChange={setSelectedDate} maximumDate={new Date()} variant="entryHero" />

            {/* Title */}
            <NativeTextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('entryTitlePlaceholder')}
              placeholderTextColor={entryPlaceholderColor}
              style={[styles.titleInput, { color: theme.colors.text }]}
              multiline
              returnKeyType="next"
              accessibilityLabel={t('entryTitleA11y')}
              accessibilityHint={t('entryTitleHint')}
            />

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

            <View
              style={[
                styles.bodyStickerCanvas,
                { minHeight: bodyCanvasHeight },
                showBodyStickerBounds && [
                  styles.bodyStickerCanvasOutlined,
                  { borderColor: theme.colors.tint + '99', backgroundColor: theme.colors.tint + '08' },
                ],
              ]}
              onLayout={(event) => {
                const { y, width, height } = event.nativeEvent.layout;
                setBodyLayout((current) => (
                  current.y === y && current.width === width && current.height === height
                    ? current
                    : { y, width, height }
                ));
              }}
            >
              {behindStickers.map((sticker) => (
                <StickerCanvasItem
                  key={sticker.id}
                  sticker={sticker}
                  onUpdate={handleUpdateSticker}
                  onDelete={handleDeleteSticker}
                  onDragStateChange={setIsStickerDragging}
                  bounds={bodyLayout}
                  allowBottomOverflow
                  horizontalEdgeAllowanceRatio={EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO}
                />
              ))}
              <View style={styles.entryBodyLayer}>
                {/* Rich content editor — toolbar hidden, controlled from floating bar */}
                <RichTextEditor
                  ref={editorRef}
                  value={content}
                  onChangeText={setContent}
                  onHeightChange={(height) => setBodyContentHeight(Math.max(ENTRY_BODY_MIN_HEIGHT, height))}
                  placeholder={t('entryCreateContentPlaceholder')}
                  placeholderColor={entryPlaceholderColor}
                  textColor={bodyTextColor}
                  fontFamily={resolveAppFontFamily(bodyFontFamily, true)}
                  fontSize={ENTRY_EDITOR_BODY_FONT_SIZE}
                  lineHeight={ENTRY_EDITOR_BODY_LINE_HEIGHT}
                  fontWeight="600"
                  minHeight={bodyCanvasHeight}
                  showToolbar={false}
                  accessibilityLabel={t('entryContentA11y')}
                />
              </View>
              {foregroundStickers.map((sticker) => (
                <StickerCanvasItem
                  key={sticker.id}
                  sticker={sticker}
                  onUpdate={handleUpdateSticker}
                  onDelete={handleDeleteSticker}
                  onDragStateChange={setIsStickerDragging}
                  bounds={bodyLayout}
                  allowBottomOverflow
                  horizontalEdgeAllowanceRatio={EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Floating bottom toolbar ──────────────────────────────────────── */}
      <DiaryEntryEditorFooter
        bottom={keyboardHeight > 0 ? keyboardHeight + 8 : insets.bottom + ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET}
        wordCount={wordCount}
        trailing={(
          <IconCircleButton
            icon="tune-variant"
            size="sm"
            surface="transparent"
            onPress={() => setShowEntryMetadata(true)}
            accessibilityLabel={t('entryDetailsA11y')}
            testID="entry-metadata-button"
          />
        )}
      >
          <View>
            <IconCircleButton
              icon="format-text"
              size="sm"
              active={showFormattingTools}
              surface="transparent"
              onPress={() => {
                dismissEntryKeyboard();
                setShowFormattingTools(true);
              }}
              accessibilityLabel={showFormattingTools ? t('entryHideFormattingA11y') : t('entryShowFormattingA11y')}
            />
          </View>

          <View style={[diaryEntryEditorChromeStyles.toolbarDivider, { backgroundColor: theme.colors.border }]} />
          <IconCircleButton
            icon="file-document-edit-outline"
            size="sm"
            surface="transparent"
            onPress={() => setShowTemplatePicker(true)}
            accessibilityLabel={t('entryChooseTemplateA11y')}
          />
          <IconCircleButton
            icon="palette-outline"
            size="sm"
            surface="transparent"
            onPress={() => setShowPaperBackgroundPicker(true)}
            accessibilityLabel={t('entryPaperBackgroundPickerA11y')}
            testID="entry-paper-background-button"
          />

          <View style={diaryEntryEditorChromeStyles.toolbarPlainGroup}>
            <IconCircleButton
              icon="image-outline"
              size="sm"
              surface="transparent"
              onPress={() => { void handleAddPhotoStickers(); }}
              accessibilityLabel={t('entryChoosePhotoA11y')}
              testID="entry-add-photo-sticker-button"
            />

            <IconCircleButton
              icon="format-textbox"
              size="sm"
              surface="transparent"
              onPress={handleAddTextSticker}
              accessibilityLabel={t('entryAddTextStickerA11y')}
            />

            <IconCircleButton
              icon="sticker-outline"
              size="sm"
              surface="transparent"
              onPress={() => {
                setShowStickerPicker(true);
                revealStickerBounds();
              }}
              accessibilityLabel={`${t('entryAddStickerA11y')} ${stickers.length} ${t('entryStickerPlacedA11y')}`}
            />
          </View>
          {keyboardHeight > 0 ? (
            <IconCircleButton
              icon="keyboard-close"
              size="sm"
              surface="transparent"
              onPress={dismissEntryKeyboard}
              accessibilityLabel={t('entryDismissKeyboardA11y')}
            />
          ) : null}
      </DiaryEntryEditorFooter>

      {/* Modals */}
      <RichTextFormattingDrawer
        visible={showFormattingTools}
        onDismiss={closeFormattingTools}
        items={FORMAT_ITEMS}
        onSelect={(kind) => editorRef.current?.applyFormat(kind)}
        selectedFontFamily={bodyFontFamily}
        selectedTextColor={bodyTextColor}
        onSelectFontFamily={(fontFamily) => {
          setBodyFontFamily(fontFamily);
          editorRef.current?.setBodyStyle({ fontFamily: resolveAppFontFamily(fontFamily, true) });
        }}
        onSelectTextColor={(textColor) => {
          setBodyTextColor(textColor);
          editorRef.current?.setBodyStyle({ textColor: textColor ?? theme.colors.text });
        }}
      />
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
      <DiaryPaperBackgroundPickerModal
        visible={showPaperBackgroundPicker}
        selectedPaperBackgroundId={paperBackgroundId}
        onSelect={setPaperBackgroundId}
        onDismiss={() => setShowPaperBackgroundPicker(false)}
      />
      <EntryMetadataModal
        visible={showEntryMetadata}
        onDismiss={() => setShowEntryMetadata(false)}
        moods={manualMoods}
        onChangeMoods={setManualMoods}
        selectedJournalIds={selectedJournalIds}
        journals={journals}
        onChangeJournalIds={setSelectedJournalIds}
        selectedTags={selectedTags}
        availableTags={availableTags}
        onChangeTags={setSelectedTags}
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
  coverHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingTop: 0,
    zIndex: 29,
    elevation: 29,
  },
  coverHeaderFullBleed: {
    top: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  viewCoverPicker: {
    borderWidth: 0,
    borderRadius: 0,
  },
  scrollContent: {
    paddingTop: 2,
    flexGrow: 1,
    position: 'relative',
  },
  entryContentLayer: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
  },
  entryPaperBackdropFrame: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    elevation: 1,
  },
  entryPaperBackdrop: {
    flex: 1,
  },
  bodyStickerCanvas: {
    minHeight: ENTRY_BODY_MIN_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  bodyStickerCanvasOutlined: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  entryBodyLayer: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
  },
  titleInput: {
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 40,
    padding: 0,
    marginBottom: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
  headerIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
});
