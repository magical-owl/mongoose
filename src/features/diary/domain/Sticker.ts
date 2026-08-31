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
// Sticker item — either emoji or PNG image
// ---------------------------------------------------------------------------

export interface StickerItem {
  readonly id: string;
  readonly name: string;
  // Emoji stickers
  readonly icon?: string;
  // PNG stickers — value is a require() result (number in RN)
  readonly source?: number;
}

export type StickerAccessTier = 'free' | 'premium';

export interface StickerCategory {
  readonly id: string;
  readonly name: string;
  readonly icon: string; // always an emoji, used for the category tab
  readonly accessTier: StickerAccessTier;
  readonly stickers: StickerItem[];
}

// ---------------------------------------------------------------------------
// Sticker packs — emoji packs first, image packs after
// ---------------------------------------------------------------------------

export const STICKER_PACKS: StickerCategory[] = [
  // ── Emoji packs ──────────────────────────────────────────────────────────
  {
    id: 'animals',
    name: 'Animals',
    icon: '🐱',
    accessTier: 'free',
    stickers: [
      { id: 'cat-boba',     name: 'Cat',       icon: '🐱' },
      { id: 'dog-happy',    name: 'Dog',        icon: '🐶' },
      { id: 'bear-hug',     name: 'Bear',       icon: '🐻' },
      { id: 'bunny-cute',   name: 'Bunny',      icon: '🐰' },
      { id: 'fox-leaf',     name: 'Fox',        icon: '🦊' },
      { id: 'panda-bamboo', name: 'Panda',      icon: '🐼' },
      { id: 'koala',        name: 'Koala',      icon: '🐨' },
      { id: 'frog',         name: 'Frog',       icon: '🐸' },
      { id: 'hamster',      name: 'Hamster',    icon: '🐹' },
    ],
  },
  {
    id: 'everyday',
    name: 'Vibes',
    icon: '✨',
    accessTier: 'free',
    stickers: [
      { id: 'happy-star',   name: 'Star',       icon: '⭐' },
      { id: 'coffee-cup',   name: 'Coffee',     icon: '☕' },
      { id: 'music-notes',  name: 'Headphones', icon: '🎧' },
      { id: 'heart-pink',   name: 'Heart',      icon: '💖' },
      { id: 'sparkles',     name: 'Sparkles',   icon: '✨' },
      { id: 'rainbow-em',   name: 'Rainbow',    icon: '🌈' },
      { id: 'fire',         name: 'Fire',       icon: '🔥' },
      { id: 'crystal-ball', name: 'Crystal',    icon: '🔮' },
      { id: 'camera',       name: 'Camera',     icon: '📷' },
      { id: 'pencil',       name: 'Pencil',     icon: '✏️' },
      { id: 'books',        name: 'Books',      icon: '📚' },
    ],
  },
  {
    id: 'celebration',
    name: 'Celebrate',
    icon: '🎉',
    accessTier: 'free',
    stickers: [
      { id: 'cake-birthday', name: 'Cake',      icon: '🎂' },
      { id: 'party-popper',  name: 'Party',     icon: '🎉' },
      { id: 'balloon-red',   name: 'Balloon',   icon: '🎈' },
      { id: 'gift-box',      name: 'Gift',      icon: '🎁' },
      { id: 'trophy',        name: 'Trophy',    icon: '🏆' },
      { id: 'medal',         name: 'Medal',     icon: '🥇' },
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: '🌿',
    accessTier: 'free',
    stickers: [
      { id: 'flower-sakura', name: 'Blossom',  icon: '🌸' },
      { id: 'leaf-maple',    name: 'Maple',    icon: '🍁' },
      { id: 'sun-bright',    name: 'Sun',      icon: '☀️' },
      { id: 'moon-crescent', name: 'Moon',     icon: '🌙' },
      { id: 'pumpkin',       name: 'Pumpkin',  icon: '🎃' },
      { id: 'cloud-rain',    name: 'Rain',     icon: '🌧️' },
      { id: 'snowflake',     name: 'Snow',     icon: '❄️' },
      { id: 'wave',          name: 'Wave',     icon: '🌊' },
      { id: 'mushroom',      name: 'Mushroom', icon: '🍄' },
    ],
  },
  {
    id: 'mood',
    name: 'Mood',
    icon: '😊',
    accessTier: 'free',
    stickers: [
      { id: 'happy-face',  name: 'Happy',     icon: '😊' },
      { id: 'love-face',   name: 'In Love',   icon: '😍' },
      { id: 'cool-face',   name: 'Cool',      icon: '😎' },
      { id: 'cry-face',    name: 'Crying',    icon: '😢' },
      { id: 'angry-face',  name: 'Angry',     icon: '😠' },
      { id: 'tired-face',  name: 'Tired',     icon: '😴' },
      { id: 'think-face',  name: 'Thinking',  icon: '🤔' },
      { id: 'shocked',     name: 'Shocked',   icon: '😱' },
      { id: 'party-face',  name: 'Party',     icon: '🥳' },
    ],
  },

  // Bundled PNG packs use project-authored assets recorded in assets/ASSET_REGISTER.md.
  {
    id: 'cat-img',
    name: 'Cat',
    icon: '🐱',
    accessTier: 'premium',
    stickers: [
      { id: 'cat_sleepy', name: 'Sleepy Cat', source: STICKER_IMAGES.cat_sleepy },
      { id: 'cat_curious', name: 'Curious Cat', source: STICKER_IMAGES.cat_curious },
      { id: 'cat_cozy', name: 'Cozy Cat', source: STICKER_IMAGES.cat_cozy },
    ],
  },
  {
    id: 'school-img',
    name: 'School',
    icon: '📚',
    accessTier: 'premium',
    stickers: [
      { id: 'school_notebook', name: 'Notebook', source: STICKER_IMAGES.school_notebook },
      { id: 'school_pencil', name: 'Pencil', source: STICKER_IMAGES.school_pencil },
      { id: 'school_backpack', name: 'Backpack', source: STICKER_IMAGES.school_backpack },
    ],
  },
  {
    id: 'summer-img',
    name: 'Summer',
    icon: '☀️',
    accessTier: 'premium',
    stickers: [
      { id: 'summer_sun', name: 'Sun', source: STICKER_IMAGES.summer_sun },
      { id: 'summer_wave', name: 'Wave', source: STICKER_IMAGES.summer_wave },
      { id: 'summer_ice_cream', name: 'Ice Cream', source: STICKER_IMAGES.summer_ice_cream },
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
