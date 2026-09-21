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

export type StickerTextAvoidanceInsets = {
  readonly paddingLeft: number;
  readonly paddingRight: number;
  readonly paddingTop: number;
};

export type StickerClampOptions = {
  readonly allowBottomOverflow?: boolean;
  readonly horizontalEdgeAllowanceRatio?: number;
};

export const DIARY_STICKER_TEXT_WRAP_GUTTER = 12;
const DIARY_STICKER_TEXT_WRAP_MIN_TEXT_WIDTH = 156;

export function getStickerVisualSize(sticker: PlacedSticker): StickerSize {
  if (sticker.text !== undefined) {
    return { width: DIARY_TEXT_STICKER_BASE_WIDTH, height: DIARY_TEXT_STICKER_BASE_HEIGHT };
  }
  if (sticker.imageUri) {
    const aspectRatio = sticker.imageWidth && sticker.imageHeight
      ? sticker.imageWidth / sticker.imageHeight
      : 1;
    if (sticker.imageShape === 'circle') {
      return { width: DIARY_PHOTO_STICKER_BASE_WIDTH, height: DIARY_PHOTO_STICKER_BASE_WIDTH };
    }
    if (sticker.imageShape === 'oval') {
      return { width: DIARY_PHOTO_STICKER_BASE_WIDTH, height: DIARY_PHOTO_STICKER_BASE_WIDTH * 0.72 };
    }
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

function getCenteredScaledStickerBounds(
  sticker: Pick<PlacedSticker, 'x' | 'y' | 'scale'>,
  visualSize: StickerSize,
): {
  readonly left: number;
  readonly right: number;
  readonly bottom: number;
  readonly horizontalOutset: number;
  readonly verticalOutset: number;
} {
  const scaledWidth = visualSize.width * sticker.scale;
  const scaledHeight = visualSize.height * sticker.scale;
  const horizontalOutset = Math.max(0, (scaledWidth - visualSize.width) / 2);
  const verticalOutset = Math.max(0, (scaledHeight - visualSize.height) / 2);

  return {
    left: sticker.x - horizontalOutset,
    right: sticker.x + visualSize.width + horizontalOutset,
    bottom: sticker.y + visualSize.height + verticalOutset,
    horizontalOutset,
    verticalOutset,
  };
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
  options: StickerClampOptions = {},
): StickerPosition {
  if (!bounds) return position;

  const visualSize = getStickerVisualSize(sticker);
  const defaultImageEdgeAllowanceRatio = sticker.text === undefined && !sticker.imageUri
    ? DIARY_IMAGE_STICKER_EDGE_ALLOWANCE_RATIO
    : 0;
  const horizontalEdgeAllowanceRatio = options.horizontalEdgeAllowanceRatio ?? defaultImageEdgeAllowanceRatio;
  const horizontalEdgeAllowance = sticker.text === undefined
    ? visualSize.width * scale * horizontalEdgeAllowanceRatio
    : 0;
  const verticalEdgeAllowance = sticker.text === undefined && !sticker.imageUri
    ? DIARY_STICKER_BASE_SIZE * scale * DIARY_IMAGE_STICKER_EDGE_ALLOWANCE_RATIO
    : 0;
  const scaledBounds = getCenteredScaledStickerBounds({ ...sticker, scale }, visualSize);
  const minX = scaledBounds.horizontalOutset - horizontalEdgeAllowance;
  const minY = verticalEdgeAllowance > 0
    ? scaledBounds.verticalOutset - verticalEdgeAllowance
    : scaledBounds.verticalOutset;
  const maxX = Math.max(
    minX,
    bounds.width + horizontalEdgeAllowance - visualSize.width - scaledBounds.horizontalOutset,
  );
  const maxY = options.allowBottomOverflow
    ? Number.POSITIVE_INFINITY
    : Math.max(
      minY,
      bounds.height + verticalEdgeAllowance - visualSize.height - scaledBounds.verticalOutset,
    );

  return {
    x: Math.max(minX, Math.min(maxX, position.x)),
    y: Math.max(minY, Math.min(maxY, position.y)),
  };
}

export function getStickerTextAvoidanceInsets(
  stickers: readonly PlacedSticker[],
  bounds: StickerBounds | undefined,
  gutter = DIARY_STICKER_TEXT_WRAP_GUTTER,
): StickerTextAvoidanceInsets {
  if (!bounds || bounds.width <= 0) {
    return { paddingLeft: 0, paddingRight: 0, paddingTop: 0 };
  }

  const maxSideInset = Math.max(0, bounds.width - DIARY_STICKER_TEXT_WRAP_MIN_TEXT_WIDTH);
  let paddingLeft = 0;
  let paddingRight = 0;
  let paddingTop = 0;

  for (const sticker of stickers) {
    if (!sticker.wrapText) continue;

    const visualSize = getStickerVisualSize(sticker);
    const stickerBounds = getCenteredScaledStickerBounds(sticker, visualSize);
    const stickerLeft = stickerBounds.left;
    const stickerRight = stickerBounds.right;
    const stickerBottom = stickerBounds.bottom;
    const stickerCenter = stickerLeft + (stickerRight - stickerLeft) / 2;
    const leftInset = Math.max(0, stickerRight + gutter);
    const rightInset = Math.max(0, bounds.width - stickerLeft + gutter);

    if (stickerCenter <= bounds.width / 2 && leftInset <= maxSideInset) {
      paddingLeft = Math.max(paddingLeft, leftInset);
      continue;
    }
    if (stickerCenter > bounds.width / 2 && rightInset <= maxSideInset) {
      paddingRight = Math.max(paddingRight, rightInset);
      continue;
    }

    paddingTop = Math.max(paddingTop, Math.max(0, stickerBottom + gutter));
  }

  return { paddingLeft, paddingRight, paddingTop };
}
