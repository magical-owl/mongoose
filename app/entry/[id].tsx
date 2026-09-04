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
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@shared/components/Text';
import { AccentPillButton } from '@shared/components/AccentPillButton';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useJournals } from '@/features/journal/hooks/useJournals';
import { useProfileForm } from '@/features/profile/hooks/useProfileForm';
import { RichTextEditor, type RichTextEditorHandle } from '@shared/components/RichTextEditor';
import { DiaryEntry, DiaryPhoto, ManualMood, ManualMoodWeather, WritingMode, getEntryManualMoods, getPrimaryManualMood } from '@/features/diary/domain/DiaryEntry';
import type { CompanionType } from '@/features/diary/domain/Companion';
import { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { TemplatePickerModal } from '@/features/diary/components/TemplatePickerModal';
import { Template } from '@/features/diary/domain/Template';
import { generateUUID } from '@/shared/utils/uuid';
import { RichTextFormattingDrawer, type RichTextFormatItem } from '@/features/diary/components/RichTextFormattingDrawer';
import { DiaryDatePicker } from '@/features/diary/components/DiaryDatePicker';
import { DiaryCoverPhotoPicker } from '@/features/diary/components/DiaryCoverPhotoPicker';
import { DiaryEntryBodyView } from '@/features/diary/components/DiaryEntryBodyView';
import { DiaryPaperCanvas } from '@/features/diary/components/DiaryPaperCanvas';
import { DiaryPaperBackgroundPickerModal } from '@/features/diary/components/DiaryPaperBackgroundPickerModal';
import { EntryReflectionsModal } from '@/features/diary/components/EntryReflectionsModal';
import { EntryMetadataModal } from '@/features/diary/components/EntryMetadataModal';
import { ReflectionSummaryButton } from '@/features/diary/components/ReflectionSummaryButton';
import { MemoryReactionButton } from '@/features/diary/components/MemoryReactionButton';
import { MoodBadgeList } from '@/features/diary/components/MoodBadgeList';
import { TagBadgeList } from '@/features/diary/components/TagBadgeList';
import { normalizeDiaryTags } from '@/features/diary/services/DiaryTagService';
import { chooseDiaryPhoto, takeDiaryPhoto } from '@/features/diary/services/DiaryPhotoPickerService';
import { createPlacedPhotoSticker, diaryPhotoService } from '@/features/diary/services/DiaryPhotoService';
import { formatDisplayDate } from '@shared/utils/dateFormat';
import { formatFriendlyTimestamp } from '@shared/utils/timeFormat';
import { useAppStore } from '@/stores/useAppStore';
import { premiumPaywallTitle, useTranslation } from '@/localization/i18n';
import { PaywallModal } from '@/shared/components/PaywallModal';
import { isPlanLimitErrorCode } from '@/features/subscription/services/PlanLimitService';
import { APP_IDENTITY } from '@/config/appIdentity';
import { useScrollCollapse } from '@/shared/hooks/useScrollCollapse';
import { getStickerBodyPreviewBottom } from '@/features/diary/domain/StickerLayout';
import { DIARY_BODY_DEFAULT_FONT_FAMILY, normalizeDiaryBodyFontFamily, normalizeDiaryBodyTextColor, type DiaryBodyFontFamily, type DiaryBodyTextColor } from '@/features/diary/domain/DiaryBodyStyle';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';
import { resolveAppFontFamilyForWebContent } from '@/theme/fonts';
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
import { DEFAULT_DIARY_PAPER_BACKGROUND_ID } from '@/features/diary/domain/DiaryPaperBackgrounds';

function countWords(text: string): number {
  const clean = text.replace(/[*#`>•\-_]/g, '').trim();
  return clean ? clean.split(/\s+/).filter(Boolean).length : 0;
}

function entryDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day, 12, 0, 0) : new Date();
}

const FORMAT_ITEMS: readonly RichTextFormatItem[] = [
  { kind: 'bold',    icon: 'format-bold' },
  { kind: 'italic',  icon: 'format-italic' },
  { kind: 'heading', icon: 'format-header-2' },
  { kind: 'bullet',  icon: 'format-list-bulleted' },
  { kind: 'align-left', icon: 'format-align-left' },
  { kind: 'align-center', icon: 'format-align-center' },
  { kind: 'align-right', icon: 'format-align-right' },
  { kind: 'align-justify', icon: 'format-align-justify' },
];
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
const ENTRY_VIEW_COVER_BOTTOM_GAP = 12;
const ENTRY_VIEW_COVER_EXPANDED_HEIGHT = 270;
const ENTRY_BODY_MIN_HEIGHT = ENTRY_EDITOR_BODY_MIN_HEIGHT;
const ENTRY_BODY_DEFAULT_VIEWPORT_RATIO = ENTRY_EDITOR_BODY_DEFAULT_VIEWPORT_RATIO;
const ENTRY_BODY_EXTRA_STICKER_SPACE = ENTRY_EDITOR_BODY_EXTRA_STICKER_SPACE;
const EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO = 0.5;

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const t = useTranslation();
  const { entries, saveDiaryEntry, deleteDiaryEntry, addReflection, deleteReflection, toggleMemoryReaction } = useDiary();
  const { journals } = useJournals();
  const { profile } = useProfileForm();
  const calendarDateFormat = useAppStore((state) => state.calendarDateFormat);
  const timeFormat = useAppStore((state) => state.timeFormat);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const stickerBoundsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCoverScrollBeginDrag = useCallback(() => {
    editorRef.current?.dismissKeyboard();
    Keyboard.dismiss();
  }, []);
  const {
    scrollRef,
    scrollY: coverScrollY,
    scrollOffsetYRef,
    handleScroll: handleEditorScroll,
    handleScrollBeginDrag: handleEditorScrollBeginDrag,
    resetScrollCollapse,
  } = useScrollCollapse({ onScrollBeginDrag: handleCoverScrollBeginDrag });

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editStickers, setEditStickers] = useState<PlacedSticker[]>([]);
  const [editCoverPhoto, setEditCoverPhoto] = useState<DiaryPhoto | undefined>();
  const [editPaperBackgroundId, setEditPaperBackgroundId] = useState<string>(DEFAULT_DIARY_PAPER_BACKGROUND_ID);
  const [editBodyFontFamily, setEditBodyFontFamily] = useState<DiaryBodyFontFamily>(DIARY_BODY_DEFAULT_FONT_FAMILY);
  const [editBodyTextColor, setEditBodyTextColor] = useState<DiaryBodyTextColor | undefined>();
  const [editMoodWeather, setEditMoodWeather] = useState<ManualMoodWeather>('neutral');
  const [editMoods, setEditMoods] = useState<ManualMood[]>(['neutral']);
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
  const [showEntryMetadata, setShowEntryMetadata] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showPaperBackgroundPicker, setShowPaperBackgroundPicker] = useState(false);
  const [showFormattingTools, setShowFormattingTools] = useState(false);
  const [showReflections, setShowReflections] = useState(false);
  const [showMemoryReactionPicker, setShowMemoryReactionPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
  const closeFormattingTools = useCallback(() => {
    setShowFormattingTools(false);
  }, []);

  const resetEditableBodyStyle = useCallback((sourceEntry: DiaryEntry) => {
    setEditBodyFontFamily(normalizeDiaryBodyFontFamily(sourceEntry.bodyFontFamily));
    setEditBodyTextColor(normalizeDiaryBodyTextColor(sourceEntry.bodyTextColor));
  }, []);

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
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!id) return;
      const found = entries.find((e) => e.id === id);
      if (found) {
        setEntry(found);
        setEditTitle(found.title);
        setEditContent(found.content);
        setEditDate(entryDate(found.date));
        setEditCoverPhoto(found.coverPhoto);
        setEditPaperBackgroundId(found.paperBackgroundId ?? DEFAULT_DIARY_PAPER_BACKGROUND_ID);
        resetEditableBodyStyle(found);
        setEditStickers([...found.stickers, ...found.photos.map((photo, index) => createPlacedPhotoSticker(photo, found.stickers.length + index))]);
        setEditCompanion(found.companion);
        setEditFavorite(found.isFavorite);
        setEditJournalIds(found.journalIds ?? found.collectionIds);
        setEditTags(normalizeDiaryTags(found.tags));
        setEditMoods(getEntryManualMoods(found)); setEditMoodWeather(found.manualMoodWeather); setEditWritingMode(found.writingMode); setEditLocation(found.sensory.locationLabel); setEditSounds(found.sensory.sounds); setEditSmells(found.sensory.smells); setEditEnergy(String(found.sensory.energyLevel)); setEditBody(found.sensory.bodyState); setEditLockbox(found.isLockbox); setEditUnlockAt(found.timeCapsuleUnlockAt ?? ''); setEditExpiresAt(found.expiresAt ?? '');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [id, entries, resetEditableBodyStyle]);

  const navigateBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const handleStartEdit = () => {
    if (!entry) return;
    resetScrollCollapse();
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditDate(entryDate(entry.date));
    setEditCoverPhoto(entry.coverPhoto);
    setEditPaperBackgroundId(entry.paperBackgroundId ?? DEFAULT_DIARY_PAPER_BACKGROUND_ID);
    resetEditableBodyStyle(entry);
    setEditStickers([...entry.stickers, ...entry.photos.map((photo, index) => createPlacedPhotoSticker(photo, entry.stickers.length + index))]);
    setEditCompanion(entry.companion);
    setEditFavorite(entry.isFavorite);
    setEditJournalIds(entry.journalIds ?? entry.collectionIds);
    setEditTags(normalizeDiaryTags(entry.tags));
    setEditMoods(getEntryManualMoods(entry)); setEditMoodWeather(entry.manualMoodWeather); setEditWritingMode(entry.writingMode); setEditLocation(entry.sensory.locationLabel); setEditSounds(entry.sensory.sounds); setEditSmells(entry.sensory.smells); setEditEnergy(String(entry.sensory.energyLevel)); setEditBody(entry.sensory.bodyState); setEditLockbox(entry.isLockbox); setEditUnlockAt(entry.timeCapsuleUnlockAt ?? ''); setEditExpiresAt(entry.expiresAt ?? '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!entry) return;
    resetScrollCollapse();
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditDate(entryDate(entry.date));
    setEditCoverPhoto(entry.coverPhoto);
    setEditPaperBackgroundId(entry.paperBackgroundId ?? DEFAULT_DIARY_PAPER_BACKGROUND_ID);
    resetEditableBodyStyle(entry);
    setEditStickers([...entry.stickers, ...entry.photos.map((photo, index) => createPlacedPhotoSticker(photo, entry.stickers.length + index))]);
    setEditCompanion(entry.companion);
    setEditFavorite(entry.isFavorite);
    setEditJournalIds(entry.journalIds ?? entry.collectionIds);
    setEditTags(normalizeDiaryTags(entry.tags));
    setEditMoods(getEntryManualMoods(entry)); setEditMoodWeather(entry.manualMoodWeather); setEditWritingMode(entry.writingMode); setEditLocation(entry.sensory.locationLabel); setEditSounds(entry.sensory.sounds); setEditSmells(entry.sensory.smells); setEditEnergy(String(entry.sensory.energyLevel)); setEditBody(entry.sensory.bodyState); setEditLockbox(entry.isLockbox); setEditUnlockAt(entry.timeCapsuleUnlockAt ?? ''); setEditExpiresAt(entry.expiresAt ?? '');
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
      paperBackgroundId: editPaperBackgroundId,
      bodyFontFamily: editBodyFontFamily,
      bodyTextColor: editBodyTextColor,
      stickers: editStickers,
      coverPhoto: editCoverPhoto,
      photos: [],
      companion: editCompanion,
      isFavorite: editFavorite,
      tags: editTags,
      collectionIds: editJournalIds,
      journalIds: editJournalIds,
      manualMoodWeather: editMoodWeather,
      manualMood: getPrimaryManualMood(editMoods),
      manualMoods: editMoods,
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
    const position = getVisibleStickerPosition(editStickers.length);
    const newSticker: PlacedSticker = {
      id: generateUUID(),
      stickerId,
      category,
      x: position.x,
      y: position.y,
      scale: INITIAL_STICKER_SCALE,
      rotation: Math.floor(Math.random() * 30) - 15,
      zIndex: editStickers.length + 1,
      behindText: false,
    };
    setEditStickers((prev) => [...prev, newSticker]);
  }, [editStickers.length, getVisibleStickerPosition, revealStickerBounds]);

  const handleUpdateSticker = useCallback((updated: PlacedSticker) => {
    setEditStickers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleDeleteSticker = useCallback((stickerId: string) => {
    setEditStickers((prev) => prev.filter((s) => s.id !== stickerId));
  }, []);

  const handleAddTextSticker = useCallback(() => {
    revealStickerBounds();
    const position = getVisibleStickerPosition(editStickers.length, TEXT_STICKER_PLACEMENT_WIDTH);
    const newSticker: PlacedSticker = {
      id: generateUUID(),
      stickerId: 'text-sticker',
      category: 'text',
      x: position.x,
      y: position.y,
      scale: 1,
      rotation: 0,
      zIndex: editStickers.length + 1,
      behindText: false,
      text: '',
      textColor: '#DC2626',
      textBackgroundColor: '#E5E7EB',
      opacity: 1,
    };
    setEditStickers((prev) => [...prev, newSticker]);
  }, [editStickers.length, getVisibleStickerPosition, revealStickerBounds, setEditStickers]);

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
      setEditStickers((current) => [
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
      setEditCoverPhoto(imported);
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
    dismissEntryKeyboard();
    setShowFormattingTools(false);
    setShowReflections(false);
    setTimeout(() => {
      Alert.alert(t('entryDeleteTitle'), t('entryDeleteMessage'), [
        { text: t('entryCancel'), style: 'cancel' },
        {
          text: t('entryDelete'),
          style: 'destructive',
          onPress: async () => { await deleteDiaryEntry(entry.id); navigateBack(); },
        },
      ]);
    }, 80);
  };

  const handleAddReflection = async (entryId: string, text: string) => {
    if (!entry || entry.id !== entryId) return false;
    const trimmed = text.trim();
    if (!trimmed) return false;
    const result = await addReflection(entry.id, trimmed);
    if (result.success) {
      setEntry(result.data);
      return true;
    } else {
      Alert.alert(t('reflectionNotSavedTitle'), result.error.message);
      return false;
    }
  };

  const handleDeleteReflection = (entryId: string, reflectionId: string) => {
    if (!entry || entry.id !== entryId) return;
    Alert.alert(t('reflectionDeleteTitle'), t('reflectionDeleteMessage'), [
      { text: t('entryCancel'), style: 'cancel' },
      {
        text: t('entryDelete'),
        style: 'destructive',
        onPress: async () => {
          const result = await deleteReflection(entryId, reflectionId);
          if (result.success) setEntry(result.data);
          else Alert.alert(t('reflectionNotDeletedTitle'), result.error.message);
        },
      },
    ]);
  };

  const handleToggleMemoryReaction = useCallback(
    async (reaction: MemoryReaction) => {
      if (!entry) return;
      const result = await toggleMemoryReaction(entry.id, reaction);
      if (result.success) {
        setEntry(result.data);
      } else {
        Alert.alert(t('memoryReactionNotSavedTitle'), result.error.message);
      }
    },
    [entry, toggleMemoryReaction, t],
  );

  const availableTags = useMemo(() => normalizeDiaryTags(entries.flatMap((item) => item.tags)), [entries]);

  if (!entry) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
          <IconCircleButton icon="chevron-left" onPress={navigateBack} accessibilityLabel={t('entryBackA11y')} />
          <View style={{ flex: 1 }} />
          <View style={styles.headerBtnPlaceholder} />
        </View>
        <View style={styles.entryFallback}>
          <ActivityIndicator color={theme.colors.tint} />
        </View>
      </View>
    );
  }

  const displayStickers = isEditing
    ? editStickers
    : [...entry.stickers, ...entry.photos.map((photo, index) => createPlacedPhotoSticker(photo, entry.stickers.length + index))];
  const behindDisplayStickers = displayStickers.filter((sticker) => sticker.behindText);
  const foregroundDisplayStickers = displayStickers.filter((sticker) => !sticker.behindText);
  const wordCount = countWords(isEditing ? editContent : entry.content);
  const viewMoods = getEntryManualMoods(entry);
  const hasViewCoverPhoto = Boolean(entry.coverPhoto);
  const friendlyTimestampLabels = {
    today: t('timeToday'),
    yesterday: t('timeYesterday'),
    todayAt: t('timeTodayAt'),
    yesterdayAt: t('timeYesterdayAt'),
    justNow: t('timeJustNow'),
    minutesAgo: t('timeMinutesAgoShort'),
    hoursAgo: t('timeHoursAgoShort'),
  };
  const viewDateTime = formatFriendlyTimestamp(entry.createdAt, timeFormat, friendlyTimestampLabels);
  const renderViewFooterMoodAndTags = () => (
    <View style={styles.viewFooterMeta} testID="entry-view-footer-meta">
      <MemoryReactionButton
        reactions={entry.memoryReactions}
        visible={showMemoryReactionPicker}
        onOpen={() => setShowMemoryReactionPicker(true)}
        onDismiss={() => setShowMemoryReactionPicker(false)}
        onToggleReaction={handleToggleMemoryReaction}
        style={styles.viewFooterReactionButton}
        testID="entry-view-memory-reaction"
      />
      {viewMoods.length > 0 ? (
        <MoodBadgeList
          moods={viewMoods}
          maxVisible={1}
          overflowPopup
          style={styles.viewFooterMoodBadges}
          testID="entry-view-footer-mood"
        />
      ) : null}
      <TagBadgeList
        tags={entry.tags}
        maxVisible={1}
        overflowPopup
        style={styles.viewFooterTagBadges}
        testID="entry-view-footer-tags"
      />
    </View>
  );

  const TOOLBAR_H = ENTRY_EDITOR_TOOLBAR_HEIGHT;
  const entryHorizontalPadding = getEntryEditorHorizontalPadding(windowWidth);
  const hasEditCoverPhoto = Boolean(editCoverPhoto);
  const editCoverExpandedHeight = hasEditCoverPhoto
    ? ENTRY_VIEW_COVER_EXPANDED_HEIGHT
    : getEntryEditorCoverHeight(windowWidth, entryHorizontalPadding);
  const headerOnlyHeight = insets.top
    + ENTRY_HEADER_TOP_OFFSET
    + ENTRY_HEADER_BUTTON_HEIGHT
    + ENTRY_HEADER_BOTTOM_PADDING;
  const viewCoverOverlayOpacity = coverScrollY.interpolate({
    inputRange: [0, 78, 120],
    outputRange: [1, 0.35, 0],
    extrapolate: 'clamp',
  });
  const showBodyStickerBounds = isEditing && (showStickerPicker || showStickerBounds || isStickerDragging);
  const stickerCanvasBottom = displayStickers.length > 0
    ? Math.max(...displayStickers.map((sticker) => getStickerBodyPreviewBottom(sticker)))
    : 0;
  const bodyCanvasHeight = Math.max(
    ENTRY_BODY_MIN_HEIGHT,
    Math.round(windowHeight * ENTRY_BODY_DEFAULT_VIEWPORT_RATIO),
    bodyContentHeight + ENTRY_BODY_EXTRA_STICKER_SPACE,
    stickerCanvasBottom + ENTRY_BODY_EXTRA_STICKER_SPACE,
  );
  const headerOverlayHeight = isEditing
    ? hasEditCoverPhoto
      ? editCoverExpandedHeight + ENTRY_EDIT_COVER_BOTTOM_GAP
      : headerOnlyHeight + ENTRY_COVER_TOP_GAP + editCoverExpandedHeight
    : hasViewCoverPhoto
      ? ENTRY_VIEW_COVER_EXPANDED_HEIGHT + ENTRY_VIEW_COVER_BOTTOM_GAP
      : headerOnlyHeight;
  const paperBackdropTop = isEditing
    ? hasEditCoverPhoto
      ? coverScrollY.interpolate({
          inputRange: [0, 120],
          outputRange: [editCoverExpandedHeight, 0],
          extrapolate: 'clamp',
        })
      : 0
    : hasViewCoverPhoto
      ? coverScrollY.interpolate({
          inputRange: [0, 120],
          outputRange: [ENTRY_VIEW_COVER_EXPANDED_HEIGHT, 0],
          extrapolate: 'clamp',
        })
      : headerOverlayHeight;
  const coverTopOffset = hasEditCoverPhoto ? 0 : headerOnlyHeight + ENTRY_COVER_TOP_GAP;
  const entryPlaceholderColor = theme.colors.stickerControlText;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      {isEditing ? (
        <DiaryEntryEditorHeader
          topInset={insets.top}
          horizontalPadding={entryHorizontalPadding}
          title={t('entryEditTitle')}
          onCover
          left={(
            <IconCircleButton
              icon="close-circle-outline"
              onPress={handleCancelEdit}
              accessibilityLabel={t('entryCancelEditingA11y')}
              iconSize={25}
              surface="overlay"
            />
          )}
          actions={(
            <>
              {editStickers.some((sticker) => sticker.behindText) && (
                <IconCircleButton
                  icon="layers"
                  onPress={() => setEditStickers((current) => current.map((sticker) => ({ ...sticker, behindText: false })))}
                  style={styles.headerIcon}
                  accessibilityLabel={t('entryBringStickersForwardA11y')}
                  iconSize={20}
                  size="sm"
                  surface="overlay"
                />
              )}
              <IconCircleButton
                icon={editFavorite ? 'star' : 'star-outline'}
                onPress={() => setEditFavorite((current) => !current)}
                accessibilityLabel={editFavorite ? t('entryRemoveFavoriteA11y') : t('entryAddFavoriteA11y')}
                active={editFavorite}
                tone="warning"
                iconSize={24}
                surface="overlay"
              />
              <AccentPillButton
                onPress={handleSaveEdit}
                disabled={isSaving}
                label={isSaving ? t('entrySaving') : t('entrySave')}
                accessibilityLabel={t('entrySaveChangesA11y')}
              />
            </>
          )}
        />
      ) : (
        <View
          style={[
            styles.header,
            hasViewCoverPhoto && styles.headerOnCover,
            {
              paddingTop: insets.top + 4,
              backgroundColor: hasViewCoverPhoto ? 'transparent' : theme.colors.background,
              borderBottomColor: hasViewCoverPhoto ? 'transparent' : theme.colors.border,
            },
          ]}
        >
          <>
            <IconCircleButton icon="chevron-left" onPress={navigateBack} accessibilityLabel={t('entryBackA11y')} surface={hasViewCoverPhoto ? 'overlay' : 'surface'} />
            <View style={styles.headerDateSpacer} />
            <View style={styles.headerActions}>
              <IconCircleButton icon="pencil-outline" onPress={handleStartEdit} accessibilityLabel={t('entryEditA11y')} surface={hasViewCoverPhoto ? 'overlay' : 'surface'} />
              <IconCircleButton icon="trash-can-outline" onPress={handleDelete} accessibilityLabel={t('entryDeleteA11y')} destructive surface={hasViewCoverPhoto ? 'overlay' : 'surface'} />
            </View>
          </>
        </View>
      )}


      {isEditing || hasViewCoverPhoto ? (
        <View
          style={[
            styles.coverHeader,
            isEditing
              ? hasEditCoverPhoto
                ? styles.coverHeaderFullBleed
                : { top: coverTopOffset, paddingHorizontal: entryHorizontalPadding, backgroundColor: 'transparent' }
              : styles.coverHeaderFullBleed,
          ]}
        >
          {isEditing ? (
            <DiaryCoverPhotoPicker
              photo={editCoverPhoto}
              variant="entryHero"
              height={editCoverExpandedHeight}
              onTakePhoto={() => handleCoverPhotoPickerResult('camera')}
              onChoosePhoto={() => handleCoverPhotoPickerResult('library')}
              onRemovePhoto={() => setEditCoverPhoto(undefined)}
              scrollY={coverScrollY}
              containerStyle={hasEditCoverPhoto ? styles.viewCoverPicker : undefined}
              actionAreaTopInset={hasEditCoverPhoto ? headerOnlyHeight : 0}
            />
          ) : (
            <DiaryCoverPhotoPicker
              photo={entry.coverPhoto}
              editable={false}
              variant="entryHero"
              height={ENTRY_VIEW_COVER_EXPANDED_HEIGHT}
              scrollY={coverScrollY}
              containerStyle={styles.viewCoverPicker}
            >
              <Animated.View style={[styles.coverEntryOverlay, { opacity: viewCoverOverlayOpacity }]}>
                <Text preset="h2" numberOfLines={2} style={[styles.coverTitle, { color: theme.colors.stickerControlText }]}>
                  {entry.title}
                </Text>
                <Text preset="caption" numberOfLines={1} style={[styles.coverDateTime, { color: theme.colors.stickerControlText }]}>
                  {viewDateTime}
                </Text>
              </Animated.View>
            </DiaryCoverPhotoPicker>
          )}
        </View>
      ) : null}

      <Animated.View pointerEvents="none" style={[styles.entryPaperBackdropFrame, { top: paperBackdropTop }]}>
        <DiaryPaperCanvas
          paperBackgroundId={isEditing ? editPaperBackgroundId : entry.paperBackgroundId}
          style={styles.entryPaperBackdrop}
          testID={isEditing ? 'entry-edit-paper-canvas' : 'entry-view-paper-canvas'}
        />
      </Animated.View>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1, zIndex: 2, elevation: 2 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? TOOLBAR_H : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          scrollEnabled={!isStickerDragging}
          onLayout={(event) => setScrollViewportHeight(event.nativeEvent.layout.height)}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: isEditing ? entryHorizontalPadding : theme.spacing.lg,
              minHeight: windowHeight + (isEditing ? editCoverExpandedHeight : hasViewCoverPhoto ? ENTRY_VIEW_COVER_EXPANDED_HEIGHT : 0),
              paddingTop: headerOverlayHeight,
              paddingBottom: getEntryEditorScrollBottomPadding(insets.bottom, theme.spacing.xl),
            },
          ]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
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
        >
          <View style={styles.entryContentLayer}>
            {isEditing ? (
              /* ── Edit mode ──────────────────────────────────────────────── */
              <>
                <DiaryDatePicker value={editDate} onChange={setEditDate} maximumDate={new Date()} variant="entryHero" />
                <NativeTextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder={t('entryTitlePlaceholder')}
                  placeholderTextColor={entryPlaceholderColor}
                  style={[styles.titleInput, { color: theme.colors.text }]}
                  multiline
                  returnKeyType="next"
                  accessibilityLabel={t('entryTitleA11y')}
                />
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
                  {behindDisplayStickers.map((sticker) => (
                    <StickerCanvasItem
                      key={sticker.id}
                      sticker={sticker}
                      onUpdate={handleUpdateSticker}
                      onDelete={handleDeleteSticker}
                      isEditable={isEditing}
                      onDragStateChange={setIsStickerDragging}
                      bounds={bodyLayout}
                      allowBottomOverflow
                      horizontalEdgeAllowanceRatio={EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO}
                    />
                  ))}
                  <View style={styles.entryBodyLayer}>
                    <RichTextEditor
                      ref={editorRef}
                      value={editContent}
                      onChangeText={setEditContent}
                      onHeightChange={(height) => setBodyContentHeight(Math.max(ENTRY_BODY_MIN_HEIGHT, height))}
                      placeholder={t('entryEditContentPlaceholder')}
                      placeholderColor={entryPlaceholderColor}
                      textColor={editBodyTextColor}
                      fontFamily={resolveAppFontFamilyForWebContent(editBodyFontFamily)}
                      fontSize={ENTRY_EDITOR_BODY_FONT_SIZE}
                      lineHeight={ENTRY_EDITOR_BODY_LINE_HEIGHT}
                      fontWeight="600"
                      minHeight={bodyCanvasHeight}
                      showToolbar={false}
                      accessibilityLabel={t('entryContentA11y')}
                    />
                  </View>
                  {foregroundDisplayStickers.map((sticker) => (
                    <StickerCanvasItem
                      key={sticker.id}
                      sticker={sticker}
                      onUpdate={handleUpdateSticker}
                      onDelete={handleDeleteSticker}
                      isEditable={isEditing}
                      onDragStateChange={setIsStickerDragging}
                      bounds={bodyLayout}
                      allowBottomOverflow
                      horizontalEdgeAllowanceRatio={EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO}
                    />
                  ))}
                </View>
              </>
            ) : (
              /* ── View mode ──────────────────────────────────────────────── */
              <>
                {hasViewCoverPhoto ? null : (
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
                    <Text
                      preset="caption"
                      color="textSecondary"
                      style={styles.entryDateTime}
                      numberOfLines={1}
                    >
                      {viewDateTime}
                    </Text>
                  </>
                )}
                <DiaryEntryBodyView
                  entry={entry}
                  bodyCanvasHeight={bodyCanvasHeight}
                  bodyFontSize={ENTRY_EDITOR_BODY_FONT_SIZE}
                  bodyLineHeight={ENTRY_EDITOR_BODY_LINE_HEIGHT}
                  stickers={displayStickers}
                  onBodyLayout={(layout) => {
                    setBodyLayout((current) => (
                      current.y === layout.y && current.width === layout.width && current.height === layout.height
                        ? current
                        : layout
                    ));
                  }}
                  onUpdateSticker={handleUpdateSticker}
                  onDeleteSticker={handleDeleteSticker}
                  onStickerDragStateChange={setIsStickerDragging}
                />

              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {!isEditing && (
        <DiaryEntryEditorFooter
          bottom={insets.bottom + ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET}
          style={styles.viewFooter}
        >
          {renderViewFooterMoodAndTags()}
            <ReflectionSummaryButton
              count={entry.reflections.length}
              onPress={() => setShowReflections(true)}
              accessibilityLabel={`${t('entryOpenReflectionsA11y')} ${entry.reflections.length} ${t('entrySavedA11y')}`}
              iconSize={21}
              height={38}
              minWidth={62}
              style={styles.viewFooterButton}
            />
        </DiaryEntryEditorFooter>
      )}

      {/* ── Floating bottom toolbar (edit mode only) ────────────────────── */}
      {isEditing && (
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
              testID="entry-edit-metadata-button"
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
                  editorRef.current?.prepareFormat();
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
              testID="entry-edit-paper-background-button"
            />
            <View style={diaryEntryEditorChromeStyles.toolbarPlainGroup}>
              <IconCircleButton
                icon="image-outline"
                size="sm"
                surface="transparent"
                onPress={() => { void handleAddPhotoStickers(); }}
                accessibilityLabel={t('entryChoosePhotoA11y')}
                testID="entry-edit-add-photo-sticker-button"
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
                accessibilityLabel={`${t('entryAddStickerA11y')} ${editStickers.length} ${t('entryStickerPlacedA11y')}`}
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
      )}

      <RichTextFormattingDrawer
        visible={isEditing && showFormattingTools}
        onDismiss={closeFormattingTools}
        items={FORMAT_ITEMS}
        onSelect={(kind) => editorRef.current?.applyFormat(kind)}
        selectedFontFamily={editBodyFontFamily}
        selectedTextColor={editBodyTextColor}
        onSelectFontFamily={(fontFamily) => {
          setEditBodyFontFamily(fontFamily);
          editorRef.current?.setBodyStyle({ fontFamily: resolveAppFontFamilyForWebContent(fontFamily) });
        }}
        onSelectTextColor={(textColor) => {
          setEditBodyTextColor(textColor);
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
        selectedPaperBackgroundId={editPaperBackgroundId}
        onSelect={setEditPaperBackgroundId}
        onDismiss={() => setShowPaperBackgroundPicker(false)}
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
      <EntryReflectionsModal
        visible={showReflections}
        onDismiss={() => setShowReflections(false)}
        entry={entry}
        profile={profile}
        timeFormat={timeFormat}
        onAddReflection={handleAddReflection}
        onDeleteReflection={handleDeleteReflection}
      />
      <EntryMetadataModal
        visible={showEntryMetadata}
        onDismiss={() => setShowEntryMetadata(false)}
        moods={editMoods}
        onChangeMoods={setEditMoods}
        selectedJournalIds={editJournalIds}
        journals={journals}
        onChangeJournalIds={setEditJournalIds}
        selectedTags={editTags}
        availableTags={availableTags}
        onChangeTags={setEditTags}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerOnCover: {
    borderBottomWidth: 0,
  },
  headerBtnPlaceholder: { width: 44, height: 44 },
  headerDateSpacer: { flex: 1 },
  coverHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
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
  entryFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerActions: { minWidth: 98, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  headerIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  entryDateTime: {
    marginTop: -8,
    marginBottom: 16,
    fontWeight: '600',
  },
  coverEntryOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  coverDateTime: {
    fontWeight: '700',
    flexShrink: 0,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 8,
  },
  viewFooter: {
    paddingHorizontal: 12,
  },
  viewFooterMeta: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewFooterReactionButton: { flexShrink: 0 },
  viewFooterMoodBadges: { maxWidth: 116 },
  viewFooterTagBadges: { flex: 1, maxWidth: '100%' },
  viewFooterButton: {
    flexShrink: 0,
    gap: 8,
  },
});
