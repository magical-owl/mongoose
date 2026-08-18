import { getStickerPacksByAccessTier, STICKER_PACKS } from '../Sticker';

describe('Sticker catalog', () => {
  it('groups sticker packs by access tier', () => {
    const freePacks = getStickerPacksByAccessTier('free');
    const premiumPacks = getStickerPacksByAccessTier('premium');

    expect(freePacks.length).toBeGreaterThan(0);
    expect(premiumPacks.length).toBeGreaterThan(0);
    expect(freePacks.every((pack) => pack.accessTier === 'free')).toBe(true);
    expect(premiumPacks.every((pack) => pack.accessTier === 'premium')).toBe(true);
    expect(freePacks.length + premiumPacks.length).toBe(STICKER_PACKS.length);
  });

  it('keeps image sticker packs premium by default', () => {
    const imagePacks = STICKER_PACKS.filter((pack) => pack.stickers.some((sticker) => sticker.source != null));

    expect(imagePacks.length).toBeGreaterThan(0);
    expect(imagePacks.every((pack) => pack.accessTier === 'premium')).toBe(true);
  });
});
