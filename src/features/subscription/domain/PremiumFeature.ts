export const PREMIUM_FEATURES = [
  'unlimited-daily-entries',
  'unlimited-daily-stickers',
  'premium-sticker-packs',
  'premium-diary-style-presets',
  'premium-diary-paper-backgrounds',
  'premium-journal-backgrounds',
  'premium-app-background-themes',
  'advanced-rediscover',
  'advanced-insights',
] as const;

export type PremiumFeature = typeof PREMIUM_FEATURES[number];
