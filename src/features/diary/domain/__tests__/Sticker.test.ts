import { getStickerPacksByAccessTier, PlacedStickerSchema, STICKER_PACKS } from '../Sticker';

describe('Sticker catalog', () => {
  it('groups sticker packs by access tier', () => {
    const freePacks = getStickerPacksByAccessTier('free');
    const premiumPacks = getStickerPacksByAccessTier('premium');

    expect(freePacks.length).toBeGreaterThan(0);
    expect(freePacks.every((pack) => pack.accessTier === 'free')).toBe(true);
    expect(premiumPacks.every((pack) => pack.accessTier === 'premium')).toBe(true);
    expect(freePacks.length + premiumPacks.length).toBe(STICKER_PACKS.length);
  });

  it('keeps bundled sticker packs backed by project-authored image assets', () => {
    const sourceBackedPacks = STICKER_PACKS.filter((pack) => pack.stickers.every((sticker) => sticker.source != null));

    expect(sourceBackedPacks).toHaveLength(STICKER_PACKS.length);
  });

  it('does not include emoji-only sticker items in the release catalog', () => {
    const emojiStickers = STICKER_PACKS.flatMap((pack) => pack.stickers).filter((sticker) => sticker.icon != null);

    expect(emojiStickers).toHaveLength(0);
  });

  it('includes the free Scribble Art sticker pack with six stickers', () => {
    const scribblePack = STICKER_PACKS.find((pack) => pack.id === 'scribble-img');

    expect(scribblePack?.accessTier).toBe('free');
    expect(scribblePack?.name).toBe('Scribble Art');
    expect(scribblePack?.stickers).toHaveLength(6);
    expect(scribblePack?.stickers.every((sticker) => sticker.source != null)).toBe(true);
  });

  it('supports text stickers in placed sticker data', () => {
    const result = PlacedStickerSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      stickerId: 'text-sticker',
      category: 'text',
      x: 20,
      y: 30,
      scale: 1,
      rotation: 0,
      zIndex: 1,
      text: 'A small note',
      textColor: '#2563EB',
      textBackgroundColor: '#FEF3C7',
      opacity: 0.75,
    });

    expect(result.text).toBe('A small note');
    expect(result.textColor).toBe('#2563EB');
    expect(result.textBackgroundColor).toBe('#FEF3C7');
    expect(result.opacity).toBe(0.75);
  });
});
