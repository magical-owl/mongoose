import type { PlacedSticker } from './Sticker';

export const DIARY_STICKER_BASE_SIZE = 80;
export const DIARY_PHOTO_STICKER_BASE_WIDTH = 148;
export const DIARY_PHOTO_STICKER_MAX_HEIGHT = 190;
export const DIARY_TEXT_STICKER_BASE_WIDTH = 160;
export const DIARY_TEXT_STICKER_BASE_HEIGHT = 54;
export const DIARY_IMAGE_STICKER_EDGE_ALLOWANCE_RATIO = 0.35;

export type StickerPreviewLayout = {
  readonly left: number;
  readonly top: number;
  readonly scale: number;
};

export type StickerSize = {
  readonly width: number;
  readonly height: number;
};

export type StickerBounds = {
  readonly width: number;
  readonly height: number;
};

export type StickerPosition = {
  readonly x: number;
  readonly y: number;
};

export function getStickerVisualSize(sticker: PlacedSticker): StickerSize {
  if (sticker.text !== undefined) {
    return { width: DIARY_TEXT_STICKER_BASE_WIDTH, height: DIARY_TEXT_STICKER_BASE_HEIGHT };
  }
  if (sticker.imageUri) {
    const aspectRatio = sticker.imageWidth && sticker.imageHeight
      ? sticker.imageWidth / sticker.imageHeight
      : 1;
    return {
      width: DIARY_PHOTO_STICKER_BASE_WIDTH,
      height: Math.min(DIARY_PHOTO_STICKER_MAX_HEIGHT, DIARY_PHOTO_STICKER_BASE_WIDTH / aspectRatio),
    };
  }
  return { width: DIARY_STICKER_BASE_SIZE, height: DIARY_STICKER_BASE_SIZE };
}

export function getStickerPreviewHeight(sticker: PlacedSticker): number {
  return getStickerVisualSize(sticker).height;
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

export function clampStickerPosition(
  position: StickerPosition,
  sticker: PlacedSticker,
  bounds: StickerBounds | undefined,
  scale = sticker.scale,
): StickerPosition {
  if (!bounds) return position;

  const visualSize = getStickerVisualSize(sticker);
  const edgeAllowance = sticker.text === undefined && !sticker.imageUri
    ? DIARY_STICKER_BASE_SIZE * scale * DIARY_IMAGE_STICKER_EDGE_ALLOWANCE_RATIO
    : 0;
  const minPosition = edgeAllowance > 0 ? -edgeAllowance : 0;
  const maxX = Math.max(minPosition, bounds.width - visualSize.width * scale + edgeAllowance);
  const maxY = Math.max(minPosition, bounds.height - visualSize.height * scale + edgeAllowance);

  return {
    x: Math.max(minPosition, Math.min(maxX, position.x)),
    y: Math.max(minPosition, Math.min(maxY, position.y)),
  };
}
