import { z } from 'zod';
import { STICKER_IMAGES } from './StickerImages';

export const PlacedStickerSchema = z.object({
  id: z.string().uuid(),
  stickerId: z.string(),       // e.g. "cat-boba", "catburnese1"
  category: z.string().default('everyday'),
  x: z.number().default(0),
  y: z.number().default(0),
  scale: z.number().default(1),
  rotation: z.number().default(0),
  zIndex: z.number().default(1),
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

export interface StickerCategory {
  readonly id: string;
  readonly name: string;
  readonly icon: string; // always an emoji, used for the category tab
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

  // ── PNG image packs ───────────────────────────────────────────────────────
  {
    id: 'cats-img',
    name: 'Cats 🖼',
    icon: '🐱',
    stickers: [
      { id: 'catburnese1', name: 'Burnese 1', source: STICKER_IMAGES.catburnese1 },
      { id: 'catburnese2', name: 'Burnese 2', source: STICKER_IMAGES.catburnese2 },
      { id: 'catburnese3', name: 'Burnese 3', source: STICKER_IMAGES.catburnese3 },
      { id: 'catburnese4', name: 'Burnese 4', source: STICKER_IMAGES.catburnese4 },
      { id: 'catragdoll1', name: 'Ragdoll 1', source: STICKER_IMAGES.catragdoll1 },
      { id: 'catragdoll2', name: 'Ragdoll 2', source: STICKER_IMAGES.catragdoll2 },
      { id: 'catragdoll5', name: 'Ragdoll 5', source: STICKER_IMAGES.catragdoll5 },
      { id: 'catragdoll6', name: 'Ragdoll 6', source: STICKER_IMAGES.catragdoll6 },
      { id: 'catbombay1',  name: 'Bombay 1',  source: STICKER_IMAGES.catbombay1 },
      { id: 'catbombay2',  name: 'Bombay 2',  source: STICKER_IMAGES.catbombay2 },
      { id: 'catbombay3',  name: 'Bombay 3',  source: STICKER_IMAGES.catbombay3 },
      { id: 'catbombay5',  name: 'Bombay 5',  source: STICKER_IMAGES.catbombay5 },
    ],
  },
  {
    id: 'cute-img',
    name: 'Cute 🖼',
    icon: '🌈',
    stickers: [
      { id: 'cute_cloud',     name: 'Cloud',     source: STICKER_IMAGES.cute_cloud },
      { id: 'cute_heart1',    name: 'Heart 1',   source: STICKER_IMAGES.cute_heart1 },
      { id: 'cute_heart2',    name: 'Heart 2',   source: STICKER_IMAGES.cute_heart2 },
      { id: 'cute_heart3',    name: 'Heart 3',   source: STICKER_IMAGES.cute_heart3 },
      { id: 'cute_icecream',  name: 'Ice Cream', source: STICKER_IMAGES.cute_icecream },
      { id: 'cute_kuma',      name: 'Kuma',      source: STICKER_IMAGES.cute_kuma },
      { id: 'cute_rabbit',    name: 'Rabbit',    source: STICKER_IMAGES.cute_rabbit },
      { id: 'cute_rainbow',   name: 'Rainbow',   source: STICKER_IMAGES.cute_rainbow },
      { id: 'cute_star1',     name: 'Star 1',    source: STICKER_IMAGES.cute_star1 },
      { id: 'cute_star2',     name: 'Star 2',    source: STICKER_IMAGES.cute_star2 },
      { id: 'cute_sunflower', name: 'Sunflower', source: STICKER_IMAGES.cute_sunflower },
    ],
  },
  {
    id: 'food-img',
    name: 'Food 🖼',
    icon: '🍰',
    stickers: [
      { id: 'food_cupcake1',  name: 'Cupcake 1',  source: STICKER_IMAGES.food_cupcake1 },
      { id: 'food_cupcake2',  name: 'Cupcake 2',  source: STICKER_IMAGES.food_cupcake2 },
      { id: 'food_cupcake3',  name: 'Cupcake 3',  source: STICKER_IMAGES.food_cupcake3 },
      { id: 'food_cupcake4',  name: 'Cupcake 4',  source: STICKER_IMAGES.food_cupcake4 },
      { id: 'food_glass1',    name: 'Drink 1',    source: STICKER_IMAGES.food_glass1 },
      { id: 'food_glass2',    name: 'Drink 2',    source: STICKER_IMAGES.food_glass2 },
      { id: 'food_icecream1', name: 'Ice Cream 1',source: STICKER_IMAGES.food_icecream1 },
      { id: 'food_icecream2', name: 'Ice Cream 2',source: STICKER_IMAGES.food_icecream2 },
      { id: 'food_icecream3', name: 'Ice Cream 3',source: STICKER_IMAGES.food_icecream3 },
      { id: 'cake1',          name: 'Cake 1',     source: STICKER_IMAGES.cake1 },
      { id: 'cake2',          name: 'Cake 2',     source: STICKER_IMAGES.cake2 },
      { id: 'cake3',          name: 'Cake 3',     source: STICKER_IMAGES.cake3 },
      { id: 'cake4',          name: 'Cake 4',     source: STICKER_IMAGES.cake4 },
    ],
  },
  {
    id: 'bears-img',
    name: 'Bears 🖼',
    icon: '🐻',
    stickers: [
      { id: 'bear1', name: 'Bear 1', source: STICKER_IMAGES.bear1 },
      { id: 'bear2', name: 'Bear 2', source: STICKER_IMAGES.bear2 },
      { id: 'bear3', name: 'Bear 3', source: STICKER_IMAGES.bear3 },
      { id: 'bear4', name: 'Bear 4', source: STICKER_IMAGES.bear4 },
      { id: 'bear5', name: 'Bear 5', source: STICKER_IMAGES.bear5 },
      { id: 'bear6', name: 'Bear 6', source: STICKER_IMAGES.bear6 },
    ],
  },
  {
    id: 'emotions-img',
    name: 'Emotions 🖼',
    icon: '😄',
    stickers: [
      { id: 'emotion1', name: 'Emotion 1', source: STICKER_IMAGES.emotion1 },
      { id: 'emotion2', name: 'Emotion 2', source: STICKER_IMAGES.emotion2 },
      { id: 'emotion3', name: 'Emotion 3', source: STICKER_IMAGES.emotion3 },
      { id: 'emotion4', name: 'Emotion 4', source: STICKER_IMAGES.emotion4 },
      { id: 'emotion5', name: 'Emotion 5', source: STICKER_IMAGES.emotion5 },
      { id: 'emotion6', name: 'Emotion 6', source: STICKER_IMAGES.emotion6 },
      { id: 'emotion7', name: 'Emotion 7', source: STICKER_IMAGES.emotion7 },
      { id: 'emotion8', name: 'Emotion 8', source: STICKER_IMAGES.emotion8 },
      { id: 'emotion9', name: 'Emotion 9', source: STICKER_IMAGES.emotion9 },
    ],
  },
  {
    id: 'gamer-img',
    name: 'Gamer 🖼',
    icon: '🎮',
    stickers: [
      { id: 'gamer1', name: 'Gamer 1', source: STICKER_IMAGES.gamer1 },
      { id: 'gamer2', name: 'Gamer 2', source: STICKER_IMAGES.gamer2 },
      { id: 'gamer3', name: 'Gamer 3', source: STICKER_IMAGES.gamer3 },
      { id: 'gamer4', name: 'Gamer 4', source: STICKER_IMAGES.gamer4 },
      { id: 'gamer5', name: 'Gamer 5', source: STICKER_IMAGES.gamer5 },
      { id: 'gamer6', name: 'Gamer 6', source: STICKER_IMAGES.gamer6 },
      { id: 'gamer7', name: 'Gamer 7', source: STICKER_IMAGES.gamer7 },
      { id: 'gamer8', name: 'Gamer 8', source: STICKER_IMAGES.gamer8 },
      { id: 'gamer9', name: 'Gamer 9', source: STICKER_IMAGES.gamer9 },
    ],
  },
  {
    id: 'pets-img',
    name: 'Pets 🖼',
    icon: '🐾',
    stickers: [
      { id: 'pet1', name: 'Pet 1', source: STICKER_IMAGES.pet1 },
      { id: 'pet2', name: 'Pet 2', source: STICKER_IMAGES.pet2 },
      { id: 'pet3', name: 'Pet 3', source: STICKER_IMAGES.pet3 },
      { id: 'pet4', name: 'Pet 4', source: STICKER_IMAGES.pet4 },
      { id: 'pet5', name: 'Pet 5', source: STICKER_IMAGES.pet5 },
      { id: 'pet6', name: 'Pet 6', source: STICKER_IMAGES.pet6 },
    ],
  },
  {
    id: 'cars-img',
    name: 'Cars 🖼',
    icon: '🚗',
    stickers: [
      { id: 'car1', name: 'Car 1', source: STICKER_IMAGES.car1 },
      { id: 'car2', name: 'Car 2', source: STICKER_IMAGES.car2 },
      { id: 'car3', name: 'Car 3', source: STICKER_IMAGES.car3 },
      { id: 'car4', name: 'Car 4', source: STICKER_IMAGES.car4 },
      { id: 'car5', name: 'Car 5', source: STICKER_IMAGES.car5 },
    ],
  },
];

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
