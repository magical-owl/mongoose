import { type ReactNode, useMemo } from 'react';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  useWindowDimensions,
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

const PATTERN_TILE_SIZE = 512;
const PATTERN_PREVIEW_TILE_SIZE = 112;

const PATTERN_IMAGE_SOURCES: Record<PatternBackgroundVariant, ImageSourcePropType> = {
  spring: require('../../../assets/patterns/pattern-spring.png'),
  summer: require('../../../assets/patterns/pattern-summer.png'),
  autumn: require('../../../assets/patterns/pattern-autumn.png'),
  winter: require('../../../assets/patterns/pattern-winter.png'),
};

interface PatternTile {
  readonly column: number;
  readonly row: number;
}

function patternOpacity(isDark: boolean): number {
  return isDark ? 0.16 : 0.1;
}

function createTiles(width: number, height: number, tileSize: number): PatternTile[] {
  const columnCount = Math.ceil(width / tileSize) + 2;
  const rowCount = Math.ceil(height / tileSize) + 2;

  return Array.from({ length: columnCount * rowCount }, (_, index) => ({
    column: index % columnCount,
    row: Math.floor(index / columnCount),
  }));
}

export function PatternBackground({
  children,
  variant = DEFAULT_PATTERN_BACKGROUND_VARIANT,
  style,
  contentStyle,
  testID,
}: PatternBackgroundProps): React.JSX.Element {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const imageSource = PATTERN_IMAGE_SOURCES[variant];
  const tiles = useMemo(() => createTiles(width, height, PATTERN_TILE_SIZE), [height, width]);

  return (
    <View testID={testID} style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
        testID={testID ? `${testID}-pattern` : undefined}
      >
        {tiles.map((tile) => (
          <Image
            key={`${tile.column}-${tile.row}`}
            accessibilityIgnoresInvertColors
            fadeDuration={0}
            resizeMode="cover"
            source={imageSource}
            style={[
              styles.tile,
              {
                height: PATTERN_TILE_SIZE,
                left: tile.column * PATTERN_TILE_SIZE - PATTERN_TILE_SIZE / 2,
                opacity: patternOpacity(theme.isDark),
                top: tile.row * PATTERN_TILE_SIZE - PATTERN_TILE_SIZE / 2,
                width: PATTERN_TILE_SIZE,
              },
            ]}
          />
        ))}
      </View>
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
  const imageSource = PATTERN_IMAGE_SOURCES[variant];

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
      <Image
        accessibilityIgnoresInvertColors
        fadeDuration={0}
        resizeMode="cover"
        source={imageSource}
        style={[
          styles.previewTile,
          {
            opacity: patternOpacity(theme.isDark),
          },
        ]}
      />
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
  tile: {
    position: 'absolute',
  },
  preview: {
    width: 96,
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewTile: {
    height: PATTERN_PREVIEW_TILE_SIZE,
    left: -8,
    position: 'absolute',
    top: -28,
    width: PATTERN_PREVIEW_TILE_SIZE,
  },
});
