import { StyleSheet, TouchableOpacity, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface AccentPillButtonProps {
  readonly label: string;
  readonly onPress?: (event: GestureResponderEvent) => void;
  readonly accessibilityLabel?: string;
  readonly leadingIcon?: MaterialIconName;
  readonly trailingIcon?: MaterialIconName;
  readonly iconSize?: number;
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function AccentPillButton({
  label,
  onPress,
  accessibilityLabel,
  leadingIcon,
  trailingIcon,
  iconSize = 18,
  disabled = false,
  style,
  testID,
}: AccentPillButtonProps): React.JSX.Element {
  const theme = useTheme();
  const foregroundColor = disabled ? theme.colors.disabledText : theme.colors.background;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      testID={testID}
      style={[
        styles.button,
        { backgroundColor: disabled ? theme.colors.disabled : theme.colors.tint },
        style,
      ]}
    >
      {leadingIcon ? <MaterialCommunityIcons name={leadingIcon} size={iconSize} color={foregroundColor} /> : null}
      <Text preset="button" style={[styles.label, { color: foregroundColor }]}>
        {label}
      </Text>
      {trailingIcon ? <MaterialCommunityIcons name={trailingIcon} size={iconSize} color={foregroundColor} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 84,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '700',
  },
});
