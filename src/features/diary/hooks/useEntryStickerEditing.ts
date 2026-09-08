import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import { getStickerBodyPreviewBottom } from '@/features/diary/domain/StickerLayout';
import { chooseDiaryPhoto } from '@/features/diary/services/DiaryPhotoPickerService';
import { createPlacedPhotoSticker, diaryPhotoService } from '@/features/diary/services/DiaryPhotoService';
import { generateUUID } from '@/shared/utils/uuid';

const STICKER_PLACEMENT_SIZE = 96;
const INITIAL_STICKER_SCALE = 2.25;
const TEXT_STICKER_PLACEMENT_WIDTH = 160;
const PHOTO_STICKER_PLACEMENT_WIDTH = 148;
const VISIBLE_STICKER_STAGGER = 18;
const STICKER_BOUNDS_VISIBLE_MS = 3500;

export interface StickerCanvasLayout {
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface UseEntryStickerEditingOptions {
  readonly stickers: readonly PlacedSticker[];
  readonly setStickers: React.Dispatch<React.SetStateAction<PlacedSticker[]>>;
  readonly windowWidth: number;
  readonly bodyMinHeight: number;
  readonly horizontalSpacing: number;
  readonly scrollOffsetYRef: MutableRefObject<number>;
  readonly scrollViewportHeight: number;
  readonly onNativeModuleMissing: () => void;
  readonly onPhotoPermissionDenied: () => void;
  readonly onPhotoImportFailed: () => void;
}

export function useEntryStickerEditing({
  stickers,
  setStickers,
  windowWidth,
  bodyMinHeight,
  horizontalSpacing,
  scrollOffsetYRef,
  scrollViewportHeight,
  onNativeModuleMissing,
  onPhotoPermissionDenied,
  onPhotoImportFailed,
}: UseEntryStickerEditingOptions) {
  const stickerBoundsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isStickerDragging, setIsStickerDragging] = useState(false);
  const [showStickerBounds, setShowStickerBounds] = useState(false);
  const [bodyContentHeight, setBodyContentHeight] = useState(bodyMinHeight);
  const [bodyLayout, setBodyLayout] = useState<StickerCanvasLayout>({
    y: 0,
    width: 0,
    height: bodyMinHeight,
  });

  useEffect(() => () => {
    if (stickerBoundsTimer.current) clearTimeout(stickerBoundsTimer.current);
  }, []);

  const revealStickerBounds = useCallback(() => {
    setShowStickerBounds(true);
    if (stickerBoundsTimer.current) clearTimeout(stickerBoundsTimer.current);
    stickerBoundsTimer.current = setTimeout(() => {
      setShowStickerBounds(false);
      stickerBoundsTimer.current = null;
    }, STICKER_BOUNDS_VISIBLE_MS);
  }, []);

  const getVisibleStickerPosition = useCallback((index: number, stickerWidth = STICKER_PLACEMENT_SIZE) => {
    const horizontalPadding = horizontalSpacing * 2;
    const usableWidth = Math.max(stickerWidth, bodyLayout.width || windowWidth - horizontalPadding);
    const usableHeight = Math.max(bodyMinHeight, bodyLayout.height);
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
  }, [bodyLayout, bodyMinHeight, horizontalSpacing, scrollOffsetYRef, scrollViewportHeight, windowWidth]);

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
    setStickers((current) => [...current, newSticker]);
  }, [getVisibleStickerPosition, revealStickerBounds, setStickers, stickers.length]);

  const handleUpdateSticker = useCallback((updated: PlacedSticker) => {
    setStickers((current) => current.map((sticker) => (sticker.id === updated.id ? updated : sticker)));
  }, [setStickers]);

  const handleDeleteSticker = useCallback((stickerId: string) => {
    setStickers((current) => current.filter((sticker) => sticker.id !== stickerId));
  }, [setStickers]);

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
    setStickers((current) => [...current, newSticker]);
  }, [getVisibleStickerPosition, revealStickerBounds, setStickers, stickers.length]);

  const handleAddPhotoStickers = useCallback(async () => {
    const result = await chooseDiaryPhoto();
    if (!result.success) {
      if (result.error === 'native-module-missing') onNativeModuleMissing();
      else onPhotoPermissionDenied();
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
      onPhotoImportFailed();
    }
  }, [
    getVisibleStickerPosition,
    onNativeModuleMissing,
    onPhotoImportFailed,
    onPhotoPermissionDenied,
    revealStickerBounds,
    setStickers,
  ]);

  const stickerCanvasBottom = stickers.length > 0
    ? Math.max(...stickers.map((sticker) => getStickerBodyPreviewBottom(sticker)))
    : 0;

  return {
    bodyLayout,
    setBodyLayout,
    bodyContentHeight,
    setBodyContentHeight,
    isStickerDragging,
    setIsStickerDragging,
    showStickerBounds,
    revealStickerBounds,
    stickerCanvasBottom,
    handleAddSticker,
    handleUpdateSticker,
    handleDeleteSticker,
    handleAddTextSticker,
    handleAddPhotoStickers,
  };
}
