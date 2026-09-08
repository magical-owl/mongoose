import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import { getStickerBodyPreviewBottom } from '@/features/diary/domain/StickerLayout';
import {
  ENTRY_EDITOR_BODY_DEFAULT_VIEWPORT_RATIO,
  ENTRY_EDITOR_BODY_EXTRA_STICKER_SPACE,
  ENTRY_EDITOR_BODY_MIN_HEIGHT,
  ENTRY_EDITOR_COVER_TOP_GAP,
  ENTRY_EDITOR_HEADER_BOTTOM_PADDING,
  ENTRY_EDITOR_HEADER_BUTTON_HEIGHT,
  ENTRY_EDITOR_HEADER_TOP_OFFSET,
  getEntryEditorCoverHeight,
  getEntryEditorHorizontalPadding,
} from '@/features/diary/components/DiaryEntryEditorChrome';

export const ENTRY_DETAIL_EDIT_COVER_BOTTOM_GAP = 0;
export const ENTRY_DETAIL_VIEW_COVER_BOTTOM_GAP = 12;
export const ENTRY_DETAIL_VIEW_COVER_EXPANDED_HEIGHT = 270;
export const ENTRY_DETAIL_EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO = 0.5;

interface EntryDetailLayoutInput {
  readonly windowWidth: number;
  readonly windowHeight: number;
  readonly topInset: number;
  readonly isEditing: boolean;
  readonly hasEditCoverPhoto: boolean;
  readonly hasViewCoverPhoto: boolean;
  readonly bodyContentHeight: number;
  readonly displayStickers: readonly PlacedSticker[];
  readonly showStickerPicker: boolean;
  readonly showStickerBounds: boolean;
  readonly isStickerDragging: boolean;
}

export function getEntryDetailLayoutMetrics({
  windowWidth,
  windowHeight,
  topInset,
  isEditing,
  hasEditCoverPhoto,
  hasViewCoverPhoto,
  bodyContentHeight,
  displayStickers,
  showStickerPicker,
  showStickerBounds,
  isStickerDragging,
}: EntryDetailLayoutInput) {
  const entryHorizontalPadding = getEntryEditorHorizontalPadding(windowWidth);
  const editCoverExpandedHeight = hasEditCoverPhoto
    ? ENTRY_DETAIL_VIEW_COVER_EXPANDED_HEIGHT
    : getEntryEditorCoverHeight(windowWidth, entryHorizontalPadding);
  const headerOnlyHeight = topInset
    + ENTRY_EDITOR_HEADER_TOP_OFFSET
    + ENTRY_EDITOR_HEADER_BUTTON_HEIGHT
    + ENTRY_EDITOR_HEADER_BOTTOM_PADDING;
  const showBodyStickerBounds = isEditing && (showStickerPicker || showStickerBounds || isStickerDragging);
  const stickerCanvasBottom = displayStickers.length > 0
    ? Math.max(...displayStickers.map((sticker) => getStickerBodyPreviewBottom(sticker)))
    : 0;
  const bodyCanvasHeight = Math.max(
    ENTRY_EDITOR_BODY_MIN_HEIGHT,
    Math.round(windowHeight * ENTRY_EDITOR_BODY_DEFAULT_VIEWPORT_RATIO),
    bodyContentHeight + ENTRY_EDITOR_BODY_EXTRA_STICKER_SPACE,
    stickerCanvasBottom + ENTRY_EDITOR_BODY_EXTRA_STICKER_SPACE,
  );
  const headerOverlayHeight = isEditing
    ? hasEditCoverPhoto
      ? editCoverExpandedHeight + ENTRY_DETAIL_EDIT_COVER_BOTTOM_GAP
      : headerOnlyHeight + ENTRY_EDITOR_COVER_TOP_GAP + editCoverExpandedHeight
    : hasViewCoverPhoto
      ? ENTRY_DETAIL_VIEW_COVER_EXPANDED_HEIGHT + ENTRY_DETAIL_VIEW_COVER_BOTTOM_GAP
      : headerOnlyHeight;
  const coverTopOffset = hasEditCoverPhoto ? 0 : headerOnlyHeight + ENTRY_EDITOR_COVER_TOP_GAP;

  return {
    bodyCanvasHeight,
    coverTopOffset,
    editCoverExpandedHeight,
    entryHorizontalPadding,
    headerOnlyHeight,
    headerOverlayHeight,
    showBodyStickerBounds,
  };
}
