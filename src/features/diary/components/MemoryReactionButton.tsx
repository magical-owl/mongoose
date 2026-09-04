import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import {
  MEMORY_REACTION_OPTIONS,
  type MemoryReaction,
} from '@/features/diary/domain/MemoryReaction';
import { memoryReactionLabel, useTranslation } from '@/localization/i18n';
import { MemoryReactionIcon } from './MemoryReactionIcon';

interface MemoryReactionButtonProps {
  readonly reactions: readonly MemoryReaction[];
  readonly visible: boolean;
  readonly onOpen: () => void;
  readonly onDismiss: () => void;
  readonly onToggleReaction: (reaction: MemoryReaction) => void | Promise<void>;
  readonly compact?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function MemoryReactionButton({
  reactions,
  visible,
  onOpen,
  onDismiss,
  onToggleReaction,
  compact = false,
  style,
  testID,
}: MemoryReactionButtonProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const { width } = useWindowDimensions();
  const trayProgress = useRef(new Animated.Value(0)).current;
  const firstReaction = reactions[0];
  const hasReaction = Boolean(firstReaction);
  const label = firstReaction ? memoryReactionLabel(firstReaction, t) : t('memoryReactionButton');
  const trayWidth = Math.min(Math.max(width - 80, 300), 380);

  useEffect(() => {
    if (!visible) {
      trayProgress.setValue(0);
      return;
    }

    Animated.spring(trayProgress, {
      toValue: 1,
      useNativeDriver: true,
      tension: 170,
      friction: 16,
    }).start();
  }, [trayProgress, visible]);

  const trayAnimatedStyle = {
    opacity: trayProgress,
    transform: [
      {
        translateY: trayProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
      {
        scale: trayProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.94, 1],
        }),
      },
    ],
  };

  const stopPressPropagation = (event: GestureResponderEvent) => {
    event.stopPropagation();
  };

  return (
    <View style={[styles.wrapper, style]}>
      {visible ? (
        <Animated.View
          style={[
            styles.tray,
            trayAnimatedStyle,
            {
              width: trayWidth,
              backgroundColor: theme.colors.surface + 'F2',
              borderColor: theme.colors.border,
              shadowColor: '#000000',
            },
          ]}
          accessibilityLabel={t('memoryReactionPickerTitle')}
          testID={testID ? `${testID}-tray` : undefined}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.reactionRow, { minWidth: trayWidth - 16 }]}
          >
            {MEMORY_REACTION_OPTIONS.map((reaction) => {
              const active = reactions.includes(reaction);
              return (
                <Pressable
                  key={reaction}
                  onPress={(event) => {
                    stopPressPropagation(event);
                    void onToggleReaction(reaction);
                    onDismiss();
                  }}
                  style={[
                    styles.option,
                    {
                      backgroundColor: active ? theme.colors.tint : theme.colors.card,
                      borderColor: active ? theme.colors.tint : theme.colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={memoryReactionLabel(reaction, t)}
                  testID={testID ? `${testID}-${reaction}` : undefined}
                >
                  <MemoryReactionIcon
                    reaction={reaction}
                    size={42}
                    testID={testID ? `${testID}-${reaction}-icon` : undefined}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      ) : null}

      <Pressable
        onPress={(event) => {
          stopPressPropagation(event);
          if (visible) onDismiss();
          else onOpen();
        }}
        style={[
          styles.button,
          compact && styles.compactButton,
          {
            backgroundColor: hasReaction ? theme.colors.tint + '22' : theme.colors.surface,
            borderColor: hasReaction ? theme.colors.tint : theme.colors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('memoryReactionPickerTitle')}
        testID={testID}
      >
        <MemoryReactionIcon
          reaction={firstReaction ?? 'cherish'}
          size={compact ? 24 : 26}
          testID={testID ? `${testID}-icon` : undefined}
        />
        <Text
          preset="caption"
          numberOfLines={1}
          style={[
            styles.label,
            compact && styles.compactLabel,
            { color: hasReaction ? theme.colors.tint : theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
    zIndex: 20,
  },
  button: {
    minHeight: 30,
    maxWidth: 136,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  compactButton: {
    minHeight: 28,
    maxWidth: 112,
    borderRadius: 14,
    paddingHorizontal: 8,
  },
  label: {
    flexShrink: 1,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  tray: {
    position: 'absolute',
    left: 0,
    bottom: '100%',
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  reactionRow: {
    gap: 10,
    alignItems: 'center',
  },
  option: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
