import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
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
import { useTheme } from '@providers/ThemeProvider';
import { Avatar } from './Avatar';
import { IconCircleButton } from './IconCircleButton';
import { Text } from './Text';

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
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const progressValue = useRef(visible ? 1 : 0);
  const dragStart = useRef(visible ? 1 : 0);

  useEffect(() => {
    const listenerId = progress.addListener(({ value }) => {
      progressValue.current = value;
    });
    return () => {
      progress.removeListener(listenerId);
    };
  }, [progress]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (visible) {
      timer = setTimeout(() => setMounted(true), 0);
    }
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [progress, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          mounted &&
          Math.abs(gesture.dx) > 8 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderGrant: () => {
          progress.stopAnimation((value) => {
            dragStart.current = value;
          });
        },
        onPanResponderMove: (_, gesture) => {
          const nextProgress = Math.max(0, Math.min(1, dragStart.current + gesture.dx / drawerWidth));
          progress.setValue(nextProgress);
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldRemainOpen =
            gesture.vx > 0.35 ||
            (gesture.vx >= -0.35 && progressValue.current > 0.5);
          if (!shouldRemainOpen) onClose();
          else Animated.spring(progress, { toValue: 1, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => {
          if (progressValue.current <= 0.5) onClose();
          else Animated.spring(progress, { toValue: 1, useNativeDriver: true }).start();
        },
      }),
    [drawerWidth, mounted, onClose, progress],
  );

  if (!mounted) return null;

  return (
    <Modal visible={mounted} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.overlay,
          { backgroundColor: theme.colors.overlay },
          overlayStyle,
          {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={accessibilityCloseLabel} />
        <Animated.View
          testID={testID}
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-drawerWidth, 0],
                  }),
                },
              ],
            },
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
                style={styles.profileButton}
                testID={testID ? `${testID}-profile` : undefined}
              >
                <Avatar
                  source={profile.avatarUri ? { uri: profile.avatarUri } : null}
                  name={profile.displayName}
                  size="sm"
                  accessibilityLabel={profileAccessibilityLabel ?? profile.displayName}
                  testID={testID ? `${testID}-profile-avatar` : undefined}
                />
                <Text preset="label" color="text" numberOfLines={1} style={styles.profileName}>
                  {profile.displayName}
                </Text>
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
        </Animated.View>
      </Animated.View>
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
  profileName: {
    flex: 1,
    fontWeight: '800',
  },
});
