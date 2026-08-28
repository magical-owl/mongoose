import { Image, StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import type { Profile } from '@/features/profile/domain/Profile';
import { resolveImportedProfilePhotoUri } from '@/features/profile/services/ProfilePhotoService';

interface ProfileAvatarProps {
  readonly profile?: Pick<Profile, 'displayName' | 'avatarUri'> | null;
  readonly size: number;
  readonly onPress?: () => void;
  readonly accessibilityLabel: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function getProfileInitials(displayName?: string): string {
  const parts = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return '';
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return `${first}${second}`.toLocaleUpperCase();
}

export function ProfileAvatar({ profile, size, onPress, accessibilityLabel, style, testID }: ProfileAvatarProps): React.JSX.Element {
  const theme = useTheme();
  const initials = getProfileInitials(profile?.displayName);
  const radius = size / 2;
  const avatarStyle = [
    styles.avatar,
    {
      width: size,
      height: size,
      borderRadius: radius,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.tint + '18',
    },
    style,
  ];
  const content = profile?.avatarUri ? (
    <Image
      source={{ uri: resolveImportedProfilePhotoUri(profile.avatarUri) }}
      style={{ width: size, height: size, borderRadius: radius }}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  ) : initials ? (
    <Text
      preset="caption"
      style={[
        styles.initials,
        {
          color: theme.colors.tint,
          fontSize: Math.max(10, Math.floor(size * 0.34)),
          lineHeight: Math.max(12, Math.floor(size * 0.42)),
        },
      ]}
      numberOfLines={1}
      dynamicType={false}
    >
      {initials}
    </Text>
  ) : (
    <Ionicons name="person" size={Math.max(14, Math.floor(size * 0.54))} color={theme.colors.tint} />
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={avatarStyle}
        testID={testID}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={avatarStyle}
      testID={testID}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    flexShrink: 0,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
