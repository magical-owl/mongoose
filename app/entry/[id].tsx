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
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useJournals } from '@/features/journal/hooks/useJournals';
import { useProfileForm } from '@/features/profile/hooks/useProfileForm';
import type { RichTextEditorHandle } from '@shared/components/RichTextEditor';
import { DiaryEntry, getEntryManualMoods } from '@/features/diary/domain/DiaryEntry';
import { getDiaryEntryViewCount } from '@/features/diary/domain/DiaryEntryViewHistory';
import { Template } from '@/features/diary/domain/Template';
import type { RichTextFormatItem } from '@/features/diary/components/RichTextFormattingDrawer';
import { EntryDetailHeaderCover } from '@/features/diary/components/EntryDetailHeaderCover';
import { EntryEditBodyForm } from '@/features/diary/components/EntryEditBodyForm';
import { EntryEditFooterTools } from '@/features/diary/components/EntryEditFooterTools';
import { EntryViewBodyContent } from '@/features/diary/components/EntryViewBodyContent';
import { DiaryPaperCanvas } from '@/features/diary/components/DiaryPaperCanvas';
import { EntryDetailModals } from '@/features/diary/components/EntryDetailModals';
import { EntryMetaRow } from '@/features/diary/components/EntryMetaRow';
import { EntryViewHistoryModal } from '@/features/diary/components/EntryViewHistoryModal';
import { normalizeDiaryTags } from '@/features/diary/services/DiaryTagService';
import { createPlacedPhotoSticker } from '@/features/diary/services/DiaryPhotoService';
import { formatFriendlyTimestamp } from '@shared/utils/timeFormat';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/localization/i18n';
import { appLockService } from '@/services/AppLockService';
import { useScrollCollapse } from '@/shared/hooks/useScrollCollapse';
import { resolveAppFontFamilyForWebContent } from '@/theme/fonts';
import {
  DiaryEntryEditorFooter,
  ENTRY_EDITOR_TOOLBAR_HEIGHT,
  getEntryEditorScrollBottomPadding,
  ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET,
  ENTRY_EDITOR_BODY_MIN_HEIGHT,
} from '@/features/diary/components/DiaryEntryEditorChrome';
import {
  ENTRY_DETAIL_VIEW_COVER_EXPANDED_HEIGHT,
  getEntryDetailLayoutMetrics,
} from '@/features/diary/components/EntryDetailLayout';
import { useEntryDetailNavigation } from '@/features/diary/hooks/useEntryDetailNavigation';
import { appendTemplateToEntryContent, useEntryEditDraft } from '@/features/diary/hooks/useEntryEditDraft';
import { useEntryStickerEditing } from '@/features/diary/hooks/useEntryStickerEditing';
import { useDiaryCoverPhotoEditing } from '@/features/diary/hooks/useDiaryCoverPhotoEditing';
import { useEntryDetailActions } from '@/features/diary/hooks/useEntryDetailActions';
import { useEntryDetailUiState } from '@/features/diary/hooks/useEntryDetailUiState';

function countWords(text: string): number {
  const clean = text.replace(/[*#`>•\-_]/g, '').trim();
  return clean ? clean.split(/\s+/).filter(Boolean).length : 0;
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
const ENTRY_BODY_MIN_HEIGHT = ENTRY_EDITOR_BODY_MIN_HEIGHT;
export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const t = useTranslation();
  const { entries, saveDiaryEntry, deleteDiaryEntry, addReflection, deleteReflection, toggleMemoryReaction, recordEntryView } = useDiary();
  const { journals } = useJournals();
  const { profile } = useProfileForm();
  const timeFormat = useAppStore((state) => state.timeFormat);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const lastRecordedViewedEntryId = useRef<string | null>(null);
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
  const {
    editTitle,
    setEditTitle,
    editContent,
    setEditContent,
    editDate,
    setEditDate,
    editStickers,
    setEditStickers,
    editCoverPhoto,
    setEditCoverPhoto,
    editPaperBackgroundId,
    setEditPaperBackgroundId,
    editBodyFontFamily,
    setEditBodyFontFamily,
    editBodyTextColor,
    setEditBodyTextColor,
    editMoods,
    setEditMoods,
    editFavorite,
    setEditFavorite,
    editJournalIds,
    setEditJournalIds,
    editTags,
    setEditTags,
    hydrateEditDraft,
    buildUpdatedEntry,
  } = useEntryEditDraft();
  const [isSaving, setIsSaving] = useState(false);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const [showViewHistory, setShowViewHistory] = useState(false);
  const {
    showEntryMetadata,
    setShowEntryMetadata,
    showStickerPicker,
    setShowStickerPicker,
    showTemplatePicker,
    setShowTemplatePicker,
    showPaperBackgroundPicker,
    setShowPaperBackgroundPicker,
    showFormattingTools,
    setShowFormattingTools,
    showReflections,
    setShowReflections,
    showMemoryReactionPicker,
    setShowMemoryReactionPicker,
    showPremiumModal,
    setShowPremiumModal,
    keyboardHeight,
    dismissEntryKeyboard,
    closeFormattingTools,
    openFormattingTools,
    resetTransientUi,
  } = useEntryDetailUiState({ editorRef });
  const {
    bodyLayout,
    setBodyLayout,
    bodyContentHeight,
    setBodyContentHeight,
    isStickerDragging,
    setIsStickerDragging,
    showStickerBounds,
    revealStickerBounds,
    handleAddSticker,
    handleUpdateSticker,
    handleDeleteSticker,
    handleAddTextSticker,
    handleAddPhotoStickers,
  } = useEntryStickerEditing({
    stickers: editStickers,
    setStickers: setEditStickers,
    windowWidth,
    bodyMinHeight: ENTRY_BODY_MIN_HEIGHT,
    horizontalSpacing: theme.spacing.lg,
    scrollOffsetYRef,
    scrollViewportHeight,
    onNativeModuleMissing: () => Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoNativeModuleMissingMessage')),
    onPhotoPermissionDenied: () => Alert.alert(t('entryPhotoPermissionTitle'), t('entryPhotoLibraryPermissionMessage')),
    onPhotoImportFailed: () => Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage')),
  });
  const {
    handleTakeCoverPhoto,
    handleChooseCoverPhoto,
    handleRemoveCoverPhoto,
  } = useDiaryCoverPhotoEditing({
    onChangePhoto: setEditCoverPhoto,
    onNativeModuleMissing: () => Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoNativeModuleMissingMessage')),
    onCameraPermissionDenied: () => Alert.alert(t('entryPhotoPermissionTitle'), t('entryCameraPermissionMessage')),
    onLibraryPermissionDenied: () => Alert.alert(t('entryPhotoPermissionTitle'), t('entryPhotoLibraryPermissionMessage')),
    onPhotoImportFailed: () => Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage')),
  });
  const hydrateEntryState = useCallback((sourceEntry: DiaryEntry) => {
    setEntry(sourceEntry);
    hydrateEditDraft(sourceEntry);
  }, [hydrateEditDraft]);

  const handleSelectTemplate = (template: Template) => {
    const newContent = appendTemplateToEntryContent(editContent, template.content);
    setEditContent(newContent);
    setTimeout(() => {
      editorRef.current?.setContentHTML(newContent);
    }, 50);
  };
  useEffect(() => {
    if (isEditing || !id || !entry || entry.id !== id || lastRecordedViewedEntryId.current === entry.id) return;
    lastRecordedViewedEntryId.current = entry.id;
    void recordEntryView(entry.id);
  }, [entry, id, isEditing, recordEntryView]);

  const navigateBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const handleStartEdit = () => {
    if (!entry) return;
    resetScrollCollapse();
    hydrateEntryState(entry);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!entry) return;
    resetScrollCollapse();
    hydrateEntryState(entry);
    setIsEditing(false);
  };

  const {
    handleSaveEdit,
    handleDelete,
    handleAddReflection,
    handleDeleteReflection,
    handleToggleMemoryReaction,
  } = useEntryDetailActions({
    entry,
    editTitle,
    buildUpdatedEntry,
    setEntry,
    setIsEditing,
    setIsSaving,
    setShowPremiumModal,
    setShowFormattingTools,
    setShowReflections,
    setShowMemoryReactionPicker,
    dismissEntryKeyboard,
    navigateBack,
    saveDiaryEntry,
    deleteDiaryEntry,
    addReflection,
    deleteReflection,
    toggleMemoryReaction,
    t,
  });

  const availableTags = useMemo(() => normalizeDiaryTags(entries.flatMap((item) => item.tags)), [entries]);
  const {
    previousEntry,
    loadingEntryDirection,
    viewEntryOpacity,
    handleLoadPreviousEntry,
    handleViewScroll,
    markViewScrollStarted,
    resetAdjacentEntryNavigation,
  } = useEntryDetailNavigation({
    entries,
    entry,
    isEditing,
    scrollRef,
    hydrateEntryState,
    resetScrollCollapse,
    onScroll: handleEditorScroll,
    onRouteEntryChange: (entryId) => router.setParams({ id: entryId }),
    onRequireLockboxAccess: () => appLockService.authenticate(),
    onResetTransientUi: () => {
      setIsEditing(false);
      setShowViewHistory(false);
      resetTransientUi();
    },
  });

  useEffect(() => {
    resetAdjacentEntryNavigation();
    const timer = setTimeout(() => {
      setShowMemoryReactionPicker(false);
      setShowViewHistory(false);
      if (!id) return;
      const found = entries.find((e) => e.id === id);
      if (found) {
        hydrateEntryState(found);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [id, entries, hydrateEntryState, resetAdjacentEntryNavigation, setShowMemoryReactionPicker]);

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
    <EntryMetaRow
      variant="viewFooter"
      moods={hasViewCoverPhoto ? [] : viewMoods}
      tags={hasViewCoverPhoto ? [] : entry.tags}
      memoryReactions={entry.memoryReactions}
      isMemoryReactionPickerVisible={showMemoryReactionPicker}
      onOpenMemoryReactionPicker={() => setShowMemoryReactionPicker(true)}
      onDismissMemoryReactionPicker={() => setShowMemoryReactionPicker(false)}
      onToggleMemoryReaction={handleToggleMemoryReaction}
      reflectionCount={entry.reflections.length}
      onReflectionPress={() => setShowReflections(true)}
      reflectionAccessibilityLabel={`${t('entryOpenReflectionsA11y')} ${entry.reflections.length} ${t('entrySavedA11y')}`}
      testID="entry-view-footer-meta"
      memoryReactionTestID="entry-view-memory-reaction"
      moodTestID="entry-view-footer-mood"
      tagTestID="entry-view-footer-tags"
    />
  );

  const TOOLBAR_H = ENTRY_EDITOR_TOOLBAR_HEIGHT;
  const hasEditCoverPhoto = Boolean(editCoverPhoto);
  const {
    bodyCanvasHeight,
    coverTopOffset,
    editCoverExpandedHeight,
    entryHorizontalPadding,
    headerOnlyHeight,
    headerOverlayHeight,
    showBodyStickerBounds,
  } = getEntryDetailLayoutMetrics({
    windowWidth,
    windowHeight,
    topInset: insets.top,
    isEditing,
    hasEditCoverPhoto,
    hasViewCoverPhoto,
    bodyContentHeight,
    displayStickers,
    showStickerPicker,
    showStickerBounds,
    isStickerDragging,
  });
  const viewCoverOverlayOpacity = coverScrollY.interpolate({
    inputRange: [0, 78, 120],
    outputRange: [1, 0.35, 0],
    extrapolate: 'clamp',
  });
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
          outputRange: [ENTRY_DETAIL_VIEW_COVER_EXPANDED_HEIGHT, 0],
          extrapolate: 'clamp',
        })
      : 0;
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <EntryDetailHeaderCover
        isEditing={isEditing}
        topInset={insets.top}
        entryHorizontalPadding={entryHorizontalPadding}
        hasEditCoverPhoto={hasEditCoverPhoto}
        hasViewCoverPhoto={hasViewCoverPhoto}
        editCoverPhoto={editCoverPhoto}
        viewCoverPhoto={entry.coverPhoto}
        editCoverExpandedHeight={editCoverExpandedHeight}
        coverTopOffset={coverTopOffset}
        headerOnlyHeight={headerOnlyHeight}
        coverScrollY={coverScrollY}
        viewEntryOpacity={viewEntryOpacity}
        viewCoverOverlayOpacity={viewCoverOverlayOpacity}
        entryTitle={entry.title}
        viewDateTime={viewDateTime}
        viewCount={getDiaryEntryViewCount(entry)}
        viewMoods={viewMoods}
        viewTags={entry.tags}
        canBringStickersForward={editStickers.some((sticker) => sticker.behindText)}
        isFavorite={editFavorite}
        isSaving={isSaving}
        onCancelEdit={handleCancelEdit}
        onBringStickersForward={() => setEditStickers((current) => current.map((sticker) => ({ ...sticker, behindText: false })))}
        onToggleFavorite={() => setEditFavorite((current) => !current)}
        onSaveEdit={handleSaveEdit}
        onBack={navigateBack}
        onStartEdit={handleStartEdit}
        onDelete={handleDelete}
        onTakeCoverPhoto={handleTakeCoverPhoto}
        onChooseCoverPhoto={handleChooseCoverPhoto}
        onRemoveCoverPhoto={handleRemoveCoverPhoto}
        onViewCountPress={() => setShowViewHistory(true)}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.entryPaperBackdropFrame,
          { top: paperBackdropTop },
        ]}
      >
        <View style={styles.entryPaperBackdrop}>
          <DiaryPaperCanvas
            paperBackgroundId={isEditing ? editPaperBackgroundId : entry.paperBackgroundId}
            style={styles.entryPaperBackdrop}
            testID={isEditing ? 'entry-edit-paper-canvas' : 'entry-view-paper-canvas'}
          />
        </View>
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
              minHeight: windowHeight + (isEditing ? editCoverExpandedHeight : hasViewCoverPhoto ? ENTRY_DETAIL_VIEW_COVER_EXPANDED_HEIGHT : 0),
              paddingTop: headerOverlayHeight,
              paddingBottom: getEntryEditorScrollBottomPadding(insets.bottom, theme.spacing.xl),
            },
          ]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={!isEditing && previousEntry ? (
            <RefreshControl
              refreshing={loadingEntryDirection === 'previous'}
              onRefresh={handleLoadPreviousEntry}
              tintColor={theme.colors.tint}
              colors={[theme.colors.tint]}
              progressBackgroundColor={theme.colors.surface}
            />
          ) : undefined}
          onScroll={handleViewScroll}
          onScrollBeginDrag={() => {
            if (!isEditing) markViewScrollStarted();
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
              <EntryEditBodyForm
                editorRef={editorRef}
                editDate={editDate}
                onChangeDate={setEditDate}
                editTitle={editTitle}
                onChangeTitle={setEditTitle}
                editContent={editContent}
                onChangeContent={setEditContent}
                editBodyFontFamily={editBodyFontFamily}
                editBodyTextColor={editBodyTextColor}
                bodyCanvasHeight={bodyCanvasHeight}
                showBodyStickerBounds={showBodyStickerBounds}
                bodyLayout={bodyLayout}
                onChangeBodyLayout={setBodyLayout}
                onChangeBodyContentHeight={setBodyContentHeight}
                behindStickers={behindDisplayStickers}
                foregroundStickers={foregroundDisplayStickers}
                onUpdateSticker={handleUpdateSticker}
                onDeleteSticker={handleDeleteSticker}
                onStickerDragStateChange={setIsStickerDragging}
              />
            ) : (
              /* ── View mode ──────────────────────────────────────────────── */
              <EntryViewBodyContent
                entry={entry}
                hasCoverPhoto={hasViewCoverPhoto}
                timestamp={viewDateTime}
                loadingEntryDirection={loadingEntryDirection}
                bodyOpacity={viewEntryOpacity}
                bodyCanvasHeight={bodyCanvasHeight}
                stickers={displayStickers}
                onChangeBodyLayout={setBodyLayout}
                onUpdateSticker={handleUpdateSticker}
                onDeleteSticker={handleDeleteSticker}
                onStickerDragStateChange={setIsStickerDragging}
              />
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
        </DiaryEntryEditorFooter>
      )}

      {/* ── Floating bottom toolbar (edit mode only) ────────────────────── */}
      {isEditing && (
        <EntryEditFooterTools
          bottom={keyboardHeight > 0 ? keyboardHeight + 8 : insets.bottom + ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET}
          wordCount={wordCount}
          stickerCount={editStickers.length}
          showFormattingTools={showFormattingTools}
          showKeyboardDismiss={keyboardHeight > 0}
          onOpenMetadata={() => setShowEntryMetadata(true)}
          onOpenFormatting={openFormattingTools}
          onOpenTemplatePicker={() => setShowTemplatePicker(true)}
          onOpenPaperBackgroundPicker={() => setShowPaperBackgroundPicker(true)}
          onAddPhotoSticker={() => { void handleAddPhotoStickers(); }}
          onAddTextSticker={handleAddTextSticker}
          onOpenStickerPicker={() => {
            setShowStickerPicker(true);
            revealStickerBounds();
          }}
          onDismissKeyboard={dismissEntryKeyboard}
        />
      )}

      <EntryDetailModals
        entry={entry}
        profile={profile}
        timeFormat={timeFormat}
        journals={journals}
        availableTags={availableTags}
        isEditing={isEditing}
        formatItems={FORMAT_ITEMS}
        showFormattingTools={showFormattingTools}
        showStickerPicker={showStickerPicker}
        showTemplatePicker={showTemplatePicker}
        showPaperBackgroundPicker={showPaperBackgroundPicker}
        showPremiumModal={showPremiumModal}
        showReflections={showReflections}
        showEntryMetadata={showEntryMetadata}
        editBodyFontFamily={editBodyFontFamily}
        editBodyTextColor={editBodyTextColor}
        selectedPaperBackgroundId={editPaperBackgroundId}
        editMoods={editMoods}
        selectedJournalIds={editJournalIds}
        selectedTags={editTags}
        onDismissFormattingTools={closeFormattingTools}
        onSelectFormat={(kind) => editorRef.current?.applyFormat(kind)}
        onSelectFontFamily={(fontFamily) => {
          setEditBodyFontFamily(fontFamily);
          editorRef.current?.setBodyStyle({ fontFamily: resolveAppFontFamilyForWebContent(fontFamily) });
        }}
        onSelectTextColor={(textColor) => {
          setEditBodyTextColor(textColor);
          editorRef.current?.setBodyStyle({ textColor: textColor ?? theme.colors.text });
        }}
        onCloseStickerPicker={() => setShowStickerPicker(false)}
        onSelectSticker={handleAddSticker}
        onRequestPremium={() => setShowPremiumModal(true)}
        onCloseTemplatePicker={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleSelectTemplate}
        onSelectPaperBackground={setEditPaperBackgroundId}
        onDismissPaperBackgroundPicker={() => setShowPaperBackgroundPicker(false)}
        onClosePremiumModal={() => setShowPremiumModal(false)}
        onDismissReflections={() => setShowReflections(false)}
        onAddReflection={handleAddReflection}
        onDeleteReflection={handleDeleteReflection}
        onDismissEntryMetadata={() => setShowEntryMetadata(false)}
        onChangeMoods={setEditMoods}
        onChangeJournalIds={setEditJournalIds}
        onChangeTags={setEditTags}
      />
      {showViewHistory ? (
        <EntryViewHistoryModal
          visible
          entry={entry}
          onDismiss={() => setShowViewHistory(false)}
        />
      ) : null}
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
  headerBtnPlaceholder: { width: 44, height: 44 },
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
  viewFooter: {
    paddingHorizontal: 12,
  },
});
