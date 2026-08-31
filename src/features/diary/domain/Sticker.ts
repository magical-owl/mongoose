import { z } from 'zod';
import { STICKER_IMAGES } from './StickerImages';

export const PlacedStickerSchema = z.object({
  id: z.string().uuid(),
  stickerId: z.string(),       // e.g. "cat-boba", "cat_sleepy"
  category: z.string().default('everyday'),
  x: z.number().default(0),
  y: z.number().default(0),
  scale: z.number().default(1),
  rotation: z.number().default(0),
  zIndex: z.number().default(1),
  imageUri: z.string().min(1).optional(),
  imageWidth: z.number().positive().optional(),
  imageHeight: z.number().positive().optional(),
  text: z.string().max(500).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textBackgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  opacity: z.number().min(0.2).max(1).optional(),
  // Optional keeps stickers saved before this feature readable on restore.
  behindText: z.boolean().optional().default(false),
});

export type PlacedSticker = z.infer<typeof PlacedStickerSchema>;

// ---------------------------------------------------------------------------
// Sticker item
// ---------------------------------------------------------------------------

export interface StickerItem {
  readonly id: string;
  readonly name: string;
  // Kept for legacy saved sticker data; release catalog entries should use source.
  readonly icon?: string;
  // PNG stickers use project-authored assets recorded in assets/ASSET_REGISTER.md.
  readonly source?: number;
}

export type StickerAccessTier = 'free' | 'premium';

export interface StickerCategory {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly accessTier: StickerAccessTier;
  readonly stickers: StickerItem[];
}

export const STICKER_PACKS: StickerCategory[] = [
  {
    id: 'cat-img',
    name: 'Cat',
    icon: 'cat',
    accessTier: 'free',
    stickers: [
      { id: 'cat_sleepy', name: 'Sleepy Cat', source: STICKER_IMAGES.cat_sleepy },
      { id: 'cat_curious', name: 'Curious Cat', source: STICKER_IMAGES.cat_curious },
      { id: 'cat_cozy', name: 'Cozy Cat', source: STICKER_IMAGES.cat_cozy },
    ],
  },
  {
    id: 'school-img',
    name: 'School',
    icon: 'school',
    accessTier: 'free',
    stickers: [
      { id: 'school_notebook', name: 'Notebook', source: STICKER_IMAGES.school_notebook },
      { id: 'school_pencil', name: 'Pencil', source: STICKER_IMAGES.school_pencil },
      { id: 'school_backpack', name: 'Backpack', source: STICKER_IMAGES.school_backpack },
    ],
  },
  {
    id: 'summer-img',
    name: 'Summer',
    icon: 'summer',
    accessTier: 'free',
    stickers: [
      { id: 'summer_sun', name: 'Sun', source: STICKER_IMAGES.summer_sun },
      { id: 'summer_wave', name: 'Wave', source: STICKER_IMAGES.summer_wave },
      { id: 'summer_ice_cream', name: 'Ice Cream', source: STICKER_IMAGES.summer_ice_cream },
    ],
  },
  {
    id: 'winter-img',
    name: 'Winter',
    icon: 'winter',
    accessTier: 'premium',
    stickers: [
      { id: 'winter_snowflake', name: 'Snowflake', source: STICKER_IMAGES.winter_snowflake },
      { id: 'winter_scarf', name: 'Scarf', source: STICKER_IMAGES.winter_scarf },
      { id: 'winter_snow_globe', name: 'Snow Globe', source: STICKER_IMAGES.winter_snow_globe },
    ],
  },
  {
    id: 'spring-img',
    name: 'Spring',
    icon: 'spring',
    accessTier: 'premium',
    stickers: [
      { id: 'spring_blossom', name: 'Blossom', source: STICKER_IMAGES.spring_blossom },
      { id: 'spring_tulip', name: 'Tulip', source: STICKER_IMAGES.spring_tulip },
      { id: 'spring_daisy', name: 'Daisy', source: STICKER_IMAGES.spring_daisy },
    ],
  },
  {
    id: 'fall-img',
    name: 'Fall',
    icon: 'fall',
    accessTier: 'premium',
    stickers: [
      { id: 'fall_leaf', name: 'Leaf', source: STICKER_IMAGES.fall_leaf },
      { id: 'fall_pumpkin', name: 'Pumpkin', source: STICKER_IMAGES.fall_pumpkin },
      { id: 'fall_acorn', name: 'Acorn', source: STICKER_IMAGES.fall_acorn },
    ],
  },
];

export function getStickerPacksByAccessTier(accessTier: StickerAccessTier): StickerCategory[] {
  return STICKER_PACKS.filter((pack) => pack.accessTier === accessTier);
}

/**
 * Lookup a StickerItem by its stickerId across all packs.
 */
export function findStickerItem(stickerId: string): StickerItem | undefined {
  for (const pack of STICKER_PACKS) {
    const item = pack.stickers.find((s) => s.id === stickerId);
    if (item) return item;
  }
  return undefined;
}
