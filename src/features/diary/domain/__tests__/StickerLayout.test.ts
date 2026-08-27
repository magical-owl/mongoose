import {
  DIARY_PHOTO_STICKER_BASE_WIDTH,
  DIARY_PHOTO_STICKER_MAX_HEIGHT,
  getStickerBodyPreviewBottom,
  getStickerPreviewHeight,
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
});
