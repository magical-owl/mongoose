import { type ComponentProps, type ReactNode } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface IconCircleButtonProps {
  readonly icon?: MaterialIconName;
  readonly children?: ReactNode;
  readonly onPress?: (event: GestureResponderEvent) => void;
  readonly accessibilityLabel: string;
  readonly accessibilityRole?: ComponentProps<typeof TouchableOpacity>['accessibilityRole'];
  readonly accessibilityState?: ComponentProps<typeof TouchableOpacity>['accessibilityState'];
  readonly disabled?: boolean;
  readonly active?: boolean;
  readonly destructive?: boolean;
  readonly tone?: 'neutral' | 'warning';
  readonly surface?: 'surface' | 'transparent' | 'overlay';
  readonly size?: 'sm' | 'md';
  readonly iconSize?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function IconCircleButton({
  icon,
  children,
  onPress,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  disabled = false,
  active = false,
  destructive = false,
  tone = 'neutral',
  surface = 'surface',
  size = 'md',
  iconSize,
  style,
  testID,
}: IconCircleButtonProps): React.JSX.Element {
  const theme = useTheme();
  const dimension = size === 'sm' ? 36 : 44;
  const resolvedIconSize = iconSize ?? (size === 'sm' ? 21 : 24);
  const activeColor = tone === 'warning' ? theme.colors.warning : theme.colors.tint;
  const iconColor = disabled
    ? theme.colors.disabledText
    : destructive
      ? theme.colors.error
      : active
        ? activeColor
        : tone === 'warning'
          ? theme.colors.warning
          : surface === 'overlay'
            ? theme.colors.stickerControlText
          : theme.colors.textSecondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.65}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      testID={testID}
      style={[
        styles.button,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: active
            ? activeColor + '18'
            : surface === 'overlay'
              ? 'rgba(0, 0, 0, 0.42)'
              : surface === 'transparent'
                ? 'transparent'
                : theme.colors.surface,
        },
        style,
      ]}
    >
      {children ?? (icon ? <MaterialCommunityIcons name={icon} size={resolvedIconSize} color={iconColor} testID={testID ? `${testID}-icon` : undefined} /> : null)}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
