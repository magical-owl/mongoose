import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@providers/ThemeProvider';
import { Avatar } from './Avatar';
import { IconCircleButton } from './IconCircleButton';
import { Text } from './Text';

const DRAWER_OPEN_DURATION_MS = 220;
const DRAWER_CLOSE_DURATION_MS = 180;

interface SlidingDrawerProfile {
  readonly displayName: string;
  readonly avatarUri?: string | null;
}

interface SlidingDrawerProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly accessibilityCloseLabel: string;
  readonly profile?: SlidingDrawerProfile | null;
  readonly onProfilePress?: () => void;
  readonly profileAccessibilityLabel?: string;
  readonly width?: number;
  readonly drawerStyle?: StyleProp<ViewStyle>;
  readonly overlayStyle?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function SlidingDrawer({
  visible,
  onClose,
  children,
  accessibilityCloseLabel,
  profile,
  onProfilePress,
  profileAccessibilityLabel,
  width,
  drawerStyle,
  overlayStyle,
  testID,
}: SlidingDrawerProps): React.JSX.Element | null {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const drawerWidth = width ?? Math.min(windowWidth * 0.86, 380);
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const dragStart = useRef(0);

  useEffect(() => {
    cancelAnimation(progress);

    if (visible) {
      const frameId = requestAnimationFrame(() => {
        setMounted(true);
      });
      progress.set(0);
      progress.set(withTiming(1, { duration: DRAWER_OPEN_DURATION_MS }));
      return () => {
        cancelAnimationFrame(frameId);
      };
    }

    if (mounted) {
      progress.set(withTiming(0, { duration: DRAWER_CLOSE_DURATION_MS }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      }));
    }

    return undefined;
  }, [mounted, progress, visible]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
  }));

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -drawerWidth + drawerWidth * progress.get() }],
  }));

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          mounted &&
          Math.abs(gesture.dx) > 8 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderGrant: () => {
          cancelAnimation(progress);
          dragStart.current = progress.get();
        },
        onPanResponderMove: (_, gesture) => {
          const nextProgress = Math.max(0, Math.min(1, dragStart.current + gesture.dx / drawerWidth));
          progress.set(nextProgress);
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldRemainOpen =
            gesture.vx > 0.35 ||
            (gesture.vx >= -0.35 && progress.get() > 0.5);
          if (!shouldRemainOpen) onClose();
          else progress.set(withSpring(1));
        },
        onPanResponderTerminate: () => {
          if (progress.get() <= 0.5) onClose();
          else progress.set(withSpring(1));
        },
      }),
    [drawerWidth, mounted, onClose, progress],
  );

  const shouldRender = visible || mounted;

  if (!shouldRender) return null;

  return (
    <Modal visible={shouldRender} animationType="none" transparent onRequestClose={onClose}>
      <Reanimated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.overlay,
          { backgroundColor: theme.colors.overlay },
          overlayStyle,
          overlayAnimatedStyle,
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={accessibilityCloseLabel} />
        <Reanimated.View
          testID={testID}
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
            drawerAnimatedStyle,
            drawerStyle,
          ]}
        >
          {profile ? (
            <View style={[styles.profileRow, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity
                activeOpacity={onProfilePress ? 0.72 : 1}
                disabled={!onProfilePress}
                onPress={onProfilePress}
                accessibilityRole={onProfilePress ? 'button' : 'image'}
                accessibilityLabel={profileAccessibilityLabel ?? profile.displayName}
                style={[
                  styles.profileButton,
                  onProfilePress && [
                    styles.profileButtonInteractive,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ],
                ]}
                testID={testID ? `${testID}-profile` : undefined}
              >
                <Avatar
                  source={profile.avatarUri ? { uri: profile.avatarUri } : null}
                  name={profile.displayName}
                  size="sm"
                  accessibilityLabel={profileAccessibilityLabel ?? profile.displayName}
                  testID={testID ? `${testID}-profile-avatar` : undefined}
                />
                <Text
                  preset="label"
                  color={onProfilePress ? 'tint' : 'text'}
                  numberOfLines={1}
                  style={[styles.profileName, onProfilePress && styles.profileNameInteractive]}
                >
                  {profile.displayName}
                </Text>
                {onProfilePress ? (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.colors.tint}
                    testID={testID ? `${testID}-profile-chevron` : undefined}
                  />
                ) : null}
              </TouchableOpacity>
              <IconCircleButton
                icon="close"
                onPress={onClose}
                accessibilityLabel={accessibilityCloseLabel}
                size="sm"
                testID={testID ? `${testID}-close` : undefined}
              />
            </View>
          ) : null}
          {children}
        </Reanimated.View>
      </Reanimated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  drawer: {
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 18,
  },
  profileRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
  profileButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButtonInteractive: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 12,
  },
  profileName: {
    flex: 1,
    fontWeight: '800',
  },
  profileNameInteractive: {
    textDecorationLine: 'underline',
  },
});
