export const PATTERN_BACKGROUND_VARIANTS = [
  'spring',
  'summer',
  'autumn',
  'winter',
] as const;

export type PatternBackgroundVariant = typeof PATTERN_BACKGROUND_VARIANTS[number];

export const DEFAULT_PATTERN_BACKGROUND_VARIANT: PatternBackgroundVariant = 'spring';

export function isPatternBackgroundVariant(value: string): value is PatternBackgroundVariant {
  return PATTERN_BACKGROUND_VARIANTS.includes(value as PatternBackgroundVariant);
}
