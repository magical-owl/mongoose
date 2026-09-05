import { type ReactNode } from 'react';
import {
  ImageBackground,
  type ImageSourcePropType,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import {
  DEFAULT_PATTERN_BACKGROUND_VARIANT,
  PATTERN_BACKGROUND_VARIANTS,
  type PatternBackgroundVariant,
} from '@/theme/patternBackgrounds';

export { PATTERN_BACKGROUND_VARIANTS, type PatternBackgroundVariant };

interface PatternBackgroundProps {
  readonly children?: ReactNode;
  readonly variant?: PatternBackgroundVariant;
  readonly style?: StyleProp<ViewStyle>;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

interface PatternBackgroundPreviewProps {
  readonly variant: PatternBackgroundVariant;
  readonly selected?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

const PATTERN_PREVIEW_TILE_SIZE = 112;

type PatternImageVariant = Exclude<PatternBackgroundVariant, 'none'>;

const PATTERN_IMAGE_SOURCES: Record<PatternImageVariant, ImageSourcePropType> = {
  spring: require('../../../assets/patterns/pattern-spring.png'),
  summer: require('../../../assets/patterns/pattern-summer.png'),
  autumn: require('../../../assets/patterns/pattern-autumn.png'),
  winter: require('../../../assets/patterns/pattern-winter.png'),
  star: require('../../../assets/patterns/pattern-star.png'),
};

function patternOpacity(isDark: boolean): number {
  return isDark ? 0.16 : 0.1;
}

function patternImageSourceFor(variant: PatternBackgroundVariant): ImageSourcePropType | undefined {
  if (variant === 'none') return undefined;
  return PATTERN_IMAGE_SOURCES[variant];
}

export function PatternBackground({
  children,
  variant = DEFAULT_PATTERN_BACKGROUND_VARIANT,
  style,
  contentStyle,
  testID,
}: PatternBackgroundProps): React.JSX.Element {
  const theme = useTheme();
  const imageSource = patternImageSourceFor(variant);

  return (
    <View testID={testID} style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      {imageSource ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.pattern}
          testID={testID ? `${testID}-pattern` : undefined}
        >
          <ImageBackground
            accessibilityIgnoresInvertColors
            imageStyle={{ opacity: patternOpacity(theme.isDark) }}
            resizeMode="cover"
            source={imageSource}
            style={styles.patternImage}
          />
        </View>
      ) : null}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

export function PatternBackgroundPreview({
  variant,
  selected = false,
  style,
  testID,
}: PatternBackgroundPreviewProps): React.JSX.Element {
  const theme = useTheme();
  const imageSource = patternImageSourceFor(variant);

  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[
        styles.preview,
        {
          backgroundColor: theme.colors.background,
          borderColor: selected ? theme.colors.tint : theme.colors.border,
        },
        style,
      ]}
    >
      {imageSource ? (
        <ImageBackground
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={imageSource}
          style={[
            styles.previewTile,
            {
              opacity: patternOpacity(theme.isDark),
            },
          ]}
        />
      ) : (
        <View style={[styles.emptyPreviewMark, { backgroundColor: theme.colors.textSecondary }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  pattern: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  patternImage: {
    flex: 1,
  },
  preview: {
    alignItems: 'center',
    width: 96,
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewTile: {
    height: PATTERN_PREVIEW_TILE_SIZE,
    left: -8,
    position: 'absolute',
    top: -28,
    width: PATTERN_PREVIEW_TILE_SIZE,
  },
  emptyPreviewMark: {
    height: 2,
    opacity: 0.54,
    transform: [{ rotate: '-18deg' }],
    width: 44,
  },
});
