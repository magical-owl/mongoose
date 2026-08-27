import type { PlacedSticker } from './Sticker';

export const DIARY_STICKER_BASE_SIZE = 80;
export const DIARY_PHOTO_STICKER_BASE_WIDTH = 148;
export const DIARY_PHOTO_STICKER_MAX_HEIGHT = 190;

export type StickerPreviewLayout = {
  readonly left: number;
  readonly top: number;
  readonly scale: number;
};

export function getStickerPreviewHeight(sticker: PlacedSticker): number {
  if (sticker.text !== undefined) return 54;
  if (!sticker.imageUri) return DIARY_STICKER_BASE_SIZE;
  const aspectRatio = sticker.imageWidth && sticker.imageHeight
    ? sticker.imageWidth / sticker.imageHeight
    : 1;
  return Math.min(DIARY_PHOTO_STICKER_MAX_HEIGHT, DIARY_PHOTO_STICKER_BASE_WIDTH / aspectRatio);
}

export function mapStickerToBodyPreview(
  sticker: PlacedSticker,
  coordinateScale = 1,
): StickerPreviewLayout {
  return {
    left: sticker.x * coordinateScale,
    top: Math.max(0, sticker.y * coordinateScale),
    scale: sticker.scale * coordinateScale,
  };
}

export function getStickerBodyPreviewBottom(sticker: PlacedSticker, coordinateScale = 1): number {
  const layout = mapStickerToBodyPreview(sticker, coordinateScale);
  return layout.top + getStickerPreviewHeight(sticker) * layout.scale;
}
