export const PATTERN_BACKGROUND_OPTIONS = [
  { variant: 'none', accessTier: 'free' },
  { variant: 'spring', accessTier: 'free' },
  { variant: 'summer', accessTier: 'premium' },
  { variant: 'autumn', accessTier: 'premium' },
  { variant: 'winter', accessTier: 'premium' },
  { variant: 'rain', accessTier: 'premium' },
] as const;

export const PATTERN_BACKGROUND_VARIANTS = PATTERN_BACKGROUND_OPTIONS.map((option) => option.variant);

export type PatternBackgroundVariant = typeof PATTERN_BACKGROUND_VARIANTS[number];

export type PatternBackgroundAccessTier = typeof PATTERN_BACKGROUND_OPTIONS[number]['accessTier'];

export const DEFAULT_PATTERN_BACKGROUND_VARIANT: PatternBackgroundVariant = 'spring';

export function isPatternBackgroundVariant(value: string): value is PatternBackgroundVariant {
  return PATTERN_BACKGROUND_VARIANTS.includes(value as PatternBackgroundVariant);
}

export function getPatternBackgroundAccessTier(variant: PatternBackgroundVariant): PatternBackgroundAccessTier {
  return PATTERN_BACKGROUND_OPTIONS.find((option) => option.variant === variant)?.accessTier ?? 'premium';
}
