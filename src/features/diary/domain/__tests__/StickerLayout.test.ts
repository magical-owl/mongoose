import {
  DIARY_PHOTO_STICKER_BASE_WIDTH,
  DIARY_PHOTO_STICKER_MAX_HEIGHT,
  DIARY_STICKER_BASE_SIZE,
  DIARY_TEXT_STICKER_BASE_HEIGHT,
  DIARY_TEXT_STICKER_BASE_WIDTH,
  clampStickerPosition,
  getStickerBodyPreviewBottom,
  getStickerPreviewHeight,
  getStickerVisualSize,
  mapStickerToBodyPreview,
} from '../StickerLayout';
import type { PlacedSticker } from '../Sticker';

const baseSticker: PlacedSticker = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  stickerId: 'happy-star',
  category: 'everyday',
  x: 120,
  y: 48,
  scale: 1.5,
  rotation: 15,
  zIndex: 2,
  behindText: false,
};

describe('StickerLayout', () => {
  it('maps saved sticker coordinates into body-relative preview coordinates', () => {
    expect(mapStickerToBodyPreview(baseSticker)).toEqual({
      left: 120,
      top: 48,
      scale: 1.5,
    });
  });

  it('scales preview coordinates and sticker scale together', () => {
    expect(mapStickerToBodyPreview(baseSticker, 0.5)).toEqual({
      left: 60,
      top: 24,
      scale: 0.75,
    });
  });

  it('does not allow preview stickers to render above the body', () => {
    expect(mapStickerToBodyPreview({ ...baseSticker, y: -24 }).top).toBe(0);
  });

  it('caps photo sticker preview height by aspect ratio', () => {
    const tallPhoto: PlacedSticker = {
      ...baseSticker,
      imageUri: 'file:///photo.jpg',
      imageWidth: 100,
      imageHeight: 400,
    };

    expect(getStickerPreviewHeight(tallPhoto)).toBe(DIARY_PHOTO_STICKER_MAX_HEIGHT);
  });

  it('calculates preview bottom from mapped top and visual height', () => {
    const photo: PlacedSticker = {
      ...baseSticker,
      imageUri: 'file:///photo.jpg',
      imageWidth: 400,
      imageHeight: 200,
      scale: 2,
    };

    expect(getStickerBodyPreviewBottom(photo)).toBe(48 + (DIARY_PHOTO_STICKER_BASE_WIDTH / 2) * 2);
  });

  it('reports fixed dimensions for text stickers', () => {
    expect(getStickerVisualSize({ ...baseSticker, text: 'hello' })).toEqual({
      width: DIARY_TEXT_STICKER_BASE_WIDTH,
      height: DIARY_TEXT_STICKER_BASE_HEIGHT,
    });
  });

  it('allows bundled image stickers to reach canvas edges despite transparent padding', () => {
    const position = clampStickerPosition(
      { x: -40, y: -40 },
      { ...baseSticker, scale: 1 },
      { width: 240, height: 240 },
    );

    expect(position).toEqual({
      x: -DIARY_STICKER_BASE_SIZE * 0.35,
      y: -DIARY_STICKER_BASE_SIZE * 0.35,
    });
  });

  it('keeps text stickers within the canvas bounds', () => {
    const position = clampStickerPosition(
      { x: -40, y: 220 },
      { ...baseSticker, text: 'hello', scale: 1 },
      { width: 240, height: 240 },
    );

    expect(position).toEqual({
      x: 0,
      y: 240 - DIARY_TEXT_STICKER_BASE_HEIGHT,
    });
  });

  it('allows editable sticker placement to grow past the bottom boundary', () => {
    const position = clampStickerPosition(
      { x: -40, y: 320 },
      { ...baseSticker, text: 'hello', scale: 1 },
      { width: 240, height: 240 },
      1,
      { allowBottomOverflow: true },
    );

    expect(position).toEqual({
      x: 0,
      y: 320,
    });
  });

  it('allows enlarged photo stickers to sit near the horizontal canvas edges', () => {
    const photoSticker: PlacedSticker = {
      ...baseSticker,
      imageUri: 'file:///album-photo.jpg',
      imageWidth: 1200,
      imageHeight: 800,
      scale: 2,
    };
    const position = clampStickerPosition(
      { x: 260, y: 48 },
      photoSticker,
      { width: 300, height: 320 },
      2,
      { horizontalEdgeAllowanceRatio: 0.5 },
    );

    expect(position.x).toBe(300 - DIARY_PHOTO_STICKER_BASE_WIDTH * 2 + DIARY_PHOTO_STICKER_BASE_WIDTH);
  });
});
