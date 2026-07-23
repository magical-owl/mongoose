/**
 * Theme Color Definitions
 *
 * All color values in the application must come from this file.
 * Never hardcode colors in components or features.
 */

export const palette = {
  // Primary brand colors
  primary50: '#E6F4FE',
  primary100: '#C0E1FA',
  primary200: '#96CBF5',
  primary300: '#6BB5F0',
  primary400: '#4DA4EC',
  primary500: '#2F93E8',
  primary600: '#2A85D5',
  primary700: '#2273BD',
  primary800: '#1C62A6',
  primary900: '#124380',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semantic colors
  success50: '#F0FDF4',
  success500: '#22C55E',
  success700: '#15803D',

  warning50: '#FFFBEB',
  warning500: '#F59E0B',
  warning700: '#B45309',

  error50: '#FEF2F2',
  error500: '#EF4444',
  error700: '#B91C1C',

  info50: '#EFF6FF',
  info500: '#3B82F6',
  info700: '#1D4ED8',
} as const;

export type PaletteColor = keyof typeof palette;