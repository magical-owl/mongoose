/**
 * Theme Typography Definitions
 *
 * Use these font sizes and weights for consistent text styling.
 * Supports Dynamic Type on iOS for accessibility.
 */

import { TextStyle } from 'react-native';

/**
 * Font size scale.
 */
export const fontSizes = {
  /** 12px */
  xs: 12,
  /** 14px */
  sm: 14,
  /** 16px */
  base: 16,
  /** 18px */
  lg: 18,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 30px */
  xxxl: 30,
  /** 36px */
  huge: 36,
  /** 48px */
  massive: 48,
} as const;

export type FontSizeToken = keyof typeof fontSizes;

/**
 * Font weight constants.
 */
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Line height multipliers for accessibility.
 */
export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

/**
 * Typography presets for common text styles.
 */
export const typography: Record<string, TextStyle> = {
  h1: {
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes.xxxl * lineHeights.tight,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes.xxl * lineHeights.tight,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xl * lineHeights.tight,
  },
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xs * lineHeights.relaxed,
  },
  button: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
};

/**
 * Dynamic Type scaling for iOS accessibility.
 * Maps iOS text styles to our font sizes.
 */
export const dynamicType: Record<string, number> = {
  'largeTitle': fontSizes.huge,
  'title1': fontSizes.xxxl,
  'title2': fontSizes.xxl,
  'title3': fontSizes.xl,
  'headline': fontSizes.lg,
  'body': fontSizes.base,
  'callout': fontSizes.sm,
  'subheadline': fontSizes.sm,
  'footnote': fontSizes.xs,
  'caption1': fontSizes.xs,
  'caption2': fontSizes.xs - 1,
};
