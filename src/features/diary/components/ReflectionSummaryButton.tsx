import { StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@shared/components/Text';
import { useTheme } from '@/providers/ThemeProvider';

interface ReflectionSummaryButtonProps {
  readonly count: number;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  readonly iconSize?: number;
  readonly height?: number;
  readonly minWidth?: number;
  readonly variant?: 'filled' | 'elevated' | 'plain';
  readonly showZeroCount?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function ReflectionSummaryButton({
  count,
  onPress,
  accessibilityLabel,
  iconSize = 14,
  height = 28,
  minWidth = 44,
  variant = 'filled',
  showZeroCount = true,
  style,
  testID,
}: ReflectionSummaryButtonProps): React.JSX.Element {
  const theme = useTheme();
  const shouldShowCount = showZeroCount || count > 0;
  const isPlain = variant === 'plain';
  const isElevated = variant === 'elevated';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={[
        styles.button,
        {
          minWidth,
          height,
          borderRadius: height / 2,
          backgroundColor: isPlain ? 'transparent' : theme.colors.tint + (isElevated ? '26' : '12'),
          borderWidth: isElevated ? StyleSheet.hairlineWidth : 0,
          borderColor: isElevated ? theme.colors.tint + '38' : 'transparent',
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Ionicons name="chatbubble-ellipses-outline" size={iconSize} color={theme.colors.tint} />
      {shouldShowCount ? (
        <Text preset="caption" color="tint" style={styles.count}>
          {count}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  count: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
});
