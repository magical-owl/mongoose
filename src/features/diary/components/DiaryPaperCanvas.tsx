import { ImageBackground, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { getDiaryPaperBackgroundSource } from '@/features/diary/domain/DiaryPaperBackgrounds';

interface DiaryPaperCanvasProps {
  readonly paperBackgroundId: string;
  readonly children?: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly onLayout?: (event: LayoutChangeEvent) => void;
  readonly pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
  readonly testID?: string;
}

export function DiaryPaperCanvas({
  paperBackgroundId,
  children,
  style,
  onLayout,
  pointerEvents,
  testID,
}: DiaryPaperCanvasProps): React.JSX.Element {
  const theme = useTheme();
  const paperBackgroundSource = getDiaryPaperBackgroundSource(paperBackgroundId);

  return (
    <View
      style={[styles.canvas, { backgroundColor: theme.colors.card }, style]}
      onLayout={onLayout}
      pointerEvents={pointerEvents}
      testID={testID}
    >
      {paperBackgroundSource ? (
        <ImageBackground
          source={paperBackgroundSource}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
          imageStyle={styles.image}
          testID={testID ? `${testID}-image` : undefined}
        >
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.32)' : 'rgba(255, 255, 255, 0.12)' }]}
          />
        </ImageBackground>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    opacity: 0.82,
  },
});
