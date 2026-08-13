import { z } from 'zod';

export const PlacedStickerSchema = z.object({
  id: z.string().uuid(),
  stickerId: z.string(),       // e.g. "cat-boba", "star-gold", "coffee"
  category: z.string().default('everyday'), // "animals", "food", "celebrations", "everyday"
  x: z.number().default(0),    // Canvas X position
  y: z.number().default(0),    // Canvas Y position
  scale: z.number().default(1),// Pinch scale factor (0.5 to 3.0)
  rotation: z.number().default(0), // Angle in degrees (-180 to 180)
  zIndex: z.number().default(1),  // Layer ordering index
});

export type PlacedSticker = z.infer<typeof PlacedStickerSchema>;

export interface StickerCategory {
  id: string;
  name: string;
  icon: string;
  stickers: { id: string; name: string; icon: string }[];
}

export const STICKER_PACKS: StickerCategory[] = [
  {
    id: 'animals',
    name: 'Animals & Pets',
    icon: '🐱',
    stickers: [
      { id: 'cat-boba', name: 'Cat Boba', icon: '🐱' },
      { id: 'dog-happy', name: 'Happy Dog', icon: '🐶' },
      { id: 'bear-hug', name: 'Teddy Bear', icon: '🐻' },
      { id: 'bunny-cute', name: 'Cute Bunny', icon: '🐰' },
      { id: 'fox-leaf', name: 'Autumn Fox', icon: '🦊' },
      { id: 'panda-bamboo', name: 'Panda', icon: '🐼' },
    ],
  },
  {
    id: 'everyday',
    name: 'Everyday & Moods',
    icon: '😄',
    stickers: [
      { id: 'happy-star', name: 'Gold Star', icon: '⭐' },
      { id: 'coffee-cup', name: 'Hot Coffee', icon: '☕' },
      { id: 'music-notes', name: 'Headphones', icon: '🎧' },
      { id: 'heart-pink', name: 'Pink Heart', icon: '💖' },
      { id: 'sparkles', name: 'Sparkles', icon: '✨' },
      { id: 'rainbow', name: 'Rainbow', icon: '🌈' },
    ],
  },
  {
    id: 'celebration',
    name: 'Party & Birthday',
    icon: '🎉',
    stickers: [
      { id: 'cake-birthday', name: 'Birthday Cake', icon: '🎂' },
      { id: 'party-popper', name: 'Party Popper', icon: '🎉' },
      { id: 'balloon-red', name: 'Balloon', icon: '🎈' },
      { id: 'gift-box', name: 'Gift Box', icon: '🎁' },
    ],
  },
  {
    id: 'nature',
    name: 'Nature & Season',
    icon: '🌿',
    stickers: [
      { id: 'flower-sakura', name: 'Cherry Blossom', icon: '🌸' },
      { id: 'leaf-maple', name: 'Maple Leaf', icon: '🍁' },
      { id: 'sun-bright', name: 'Bright Sun', icon: '☀️' },
      { id: 'moon-crescent', name: 'Crescent Moon', icon: '🌙' },
      { id: 'pumpkin', name: 'Pumpkin', icon: '🎃' },
    ],
  },
];
