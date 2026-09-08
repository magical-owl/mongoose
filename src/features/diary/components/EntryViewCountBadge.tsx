import { Pressable, StyleSheet, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@shared/components/Text';
import { useTheme } from '@/providers/ThemeProvider';

interface EntryViewCountBadgeProps {
  readonly count: number;
  readonly accessibilityLabel: string;
  readonly iconSize?: number;
  readonly height?: number;
  readonly minWidth?: number;
  readonly onPress?: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function EntryViewCountBadge({
  count,
  accessibilityLabel,
  iconSize = 18,
  height = 38,
  minWidth = 58,
  onPress,
  style,
  testID,
}: EntryViewCountBadgeProps): React.JSX.Element {
  const theme = useTheme();
  const handlePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onPress?.();
  };

  return (
    <Pressable
      accessible
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel}
      disabled={!onPress}
      onPress={handlePress}
      testID={testID}
      style={[
        styles.badge,
        {
          minWidth,
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.surface + 'D9',
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <Ionicons name="eye-outline" size={iconSize} color={theme.colors.textSecondary} />
      <Text preset="caption" color="textSecondary" style={styles.count}>
        {count}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
  },
  count: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
});
