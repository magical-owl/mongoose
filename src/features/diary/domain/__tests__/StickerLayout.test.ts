import {
  DIARY_PHOTO_STICKER_BASE_WIDTH,
  DIARY_PHOTO_STICKER_MAX_HEIGHT,
  DIARY_STICKER_BASE_SIZE,
  DIARY_STICKER_TEXT_WRAP_GUTTER,
  DIARY_TEXT_STICKER_BASE_HEIGHT,
  DIARY_TEXT_STICKER_BASE_WIDTH,
  clampStickerPosition,
  getStickerBodyPreviewBottom,
  getStickerPreviewHeight,
  getStickerTextAvoidanceInsets,
  getStickerTextAvoidanceZones,
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

  it('uses fixed square bounds for circular photo stickers', () => {
    const circlePhoto: PlacedSticker = {
      ...baseSticker,
      imageUri: 'file:///photo.jpg',
      imageWidth: 1200,
      imageHeight: 800,
      imageShape: 'circle',
    };

    expect(getStickerVisualSize(circlePhoto)).toEqual({
      width: DIARY_PHOTO_STICKER_BASE_WIDTH,
      height: DIARY_PHOTO_STICKER_BASE_WIDTH,
    });
  });

  it('uses compact horizontal bounds for oval photo stickers', () => {
    const ovalPhoto: PlacedSticker = {
      ...baseSticker,
      imageUri: 'file:///photo.jpg',
      imageWidth: 1200,
      imageHeight: 800,
      imageShape: 'oval',
    };

    expect(getStickerVisualSize(ovalPhoto)).toEqual({
      width: DIARY_PHOTO_STICKER_BASE_WIDTH,
      height: DIARY_PHOTO_STICKER_BASE_WIDTH * 0.72,
    });
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

  it('does not add text avoidance without wrapped stickers', () => {
    expect(getStickerTextAvoidanceInsets([baseSticker], { width: 320, height: 480 })).toEqual({
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
    });
  });

  it('adds left text avoidance for a wrapped sticker on the left side', () => {
    const insets = getStickerTextAvoidanceInsets(
      [{ ...baseSticker, x: 24, scale: 1, wrapText: true }],
      { width: 320, height: 480 },
    );

    expect(insets).toEqual({
      paddingLeft: 24 + DIARY_STICKER_BASE_SIZE + DIARY_STICKER_TEXT_WRAP_GUTTER,
      paddingRight: 0,
      paddingTop: 0,
    });
  });

  it('adds right text avoidance for a wrapped sticker on the right side', () => {
    const insets = getStickerTextAvoidanceInsets(
      [{ ...baseSticker, x: 220, scale: 1, wrapText: true }],
      { width: 320, height: 480 },
    );

    expect(insets).toEqual({
      paddingLeft: 0,
      paddingRight: 320 - 220 + DIARY_STICKER_TEXT_WRAP_GUTTER,
      paddingTop: 0,
    });
  });

  it('moves text below wrapped stickers when horizontal space is too narrow', () => {
    const insets = getStickerTextAvoidanceInsets(
      [{ ...baseSticker, x: 0, scale: 4, wrapText: true }],
      { width: 320, height: 480 },
    );

    expect(insets.paddingLeft).toBe(0);
    expect(insets.paddingRight).toBe(0);
    expect(insets.paddingTop).toBe(48 + DIARY_STICKER_BASE_SIZE * 4 + DIARY_STICKER_TEXT_WRAP_GUTTER);
  });

  it('creates vertical text avoidance zones for wrapped stickers', () => {
    expect(getStickerTextAvoidanceZones(
      [{ ...baseSticker, x: 24, y: 40, scale: 1, wrapText: true }],
      { width: 320, height: 480 },
    )).toEqual([
      {
        top: 40 - DIARY_STICKER_TEXT_WRAP_GUTTER,
        bottom: 40 + DIARY_STICKER_BASE_SIZE + DIARY_STICKER_TEXT_WRAP_GUTTER,
        paddingLeft: 24 + DIARY_STICKER_BASE_SIZE + DIARY_STICKER_TEXT_WRAP_GUTTER,
        paddingRight: 0,
        pushBelow: false,
      },
    ]);
  });

  it('creates a push-below zone when a wrapped sticker cannot leave enough horizontal text space', () => {
    expect(getStickerTextAvoidanceZones(
      [{ ...baseSticker, x: 0, scale: 4, wrapText: true }],
      { width: 320, height: 480 },
    )).toEqual([
      {
        top: 48 - DIARY_STICKER_TEXT_WRAP_GUTTER,
        bottom: 48 + DIARY_STICKER_BASE_SIZE * 4 + DIARY_STICKER_TEXT_WRAP_GUTTER,
        paddingLeft: 0,
        paddingRight: 0,
        pushBelow: true,
      },
    ]);
  });
});
