import { useCallback, useEffect, useId, useRef, useState } from 'react';
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
import {
  openMemoryReactionPanel,
  subscribeToMemoryReactionPanelOpen,
} from './MemoryReactionPanelRegistry';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TRAY_SCREEN_PADDING = 12;

interface ReactionTrayLayoutInput {
  readonly alignment: 'left' | 'center' | 'right';
  readonly anchorX: number | null;
  readonly anchorWidth: number;
  readonly screenWidth: number;
  readonly trayWidth: number;
}

export function getClampedReactionTrayLeft({
  alignment,
  anchorX,
  anchorWidth,
  screenWidth,
  trayWidth,
}: ReactionTrayLayoutInput): number {
  const desiredLeftByAlignment = {
    left: 0,
    center: -(trayWidth - anchorWidth) / 2,
    right: anchorWidth - trayWidth,
  };
  const desiredLeft = desiredLeftByAlignment[alignment];

  if (anchorX === null) return desiredLeft;

  const minLeft = TRAY_SCREEN_PADDING - anchorX;
  const maxLeft = screenWidth - TRAY_SCREEN_PADDING - trayWidth - anchorX;

  return Math.min(Math.max(desiredLeft, minLeft), maxLeft);
}

interface MemoryReactionButtonProps {
  readonly reactions: readonly MemoryReaction[];
  readonly visible: boolean;
  readonly onOpen: () => void;
  readonly onDismiss: () => void;
  readonly onToggleReaction: (reaction: MemoryReaction) => void | Promise<void>;
  readonly compact?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly buttonStyle?: StyleProp<ViewStyle>;
  readonly trayAlignment?: 'left' | 'center' | 'right';
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
  buttonStyle,
  trayAlignment = 'left',
  testID,
}: MemoryReactionButtonProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const { width } = useWindowDimensions();
  const panelId = useId();
  const trayProgress = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const onDismissRef = useRef(onDismiss);
  const wrapperRef = useRef<View>(null);
  const [anchorMetrics, setAnchorMetrics] = useState({
    x: null as number | null,
    width: compact ? 112 : 136,
  });
  const firstReaction = reactions[0];
  const previousReactionRef = useRef<MemoryReaction | undefined>(firstReaction);
  const hasReaction = Boolean(firstReaction);
  const label = firstReaction ? memoryReactionLabel(firstReaction, t) : t('memoryReactionButton');
  const trayWidth = Math.min(Math.max(width - 80, 300), 380);
  const trayLeft = getClampedReactionTrayLeft({
    alignment: trayAlignment,
    anchorX: anchorMetrics.x,
    anchorWidth: anchorMetrics.width,
    screenWidth: width,
    trayWidth,
  });

  const measureAnchor = useCallback(() => {
    wrapperRef.current?.measureInWindow((x, _y, measuredWidth) => {
      if (measuredWidth <= 0) return;
      setAnchorMetrics({ x, width: measuredWidth });
    });
  }, []);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

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
    measureAnchor();
  }, [measureAnchor, trayProgress, visible]);

  useEffect(() => (
    subscribeToMemoryReactionPanelOpen((activePanelId) => {
      if (activePanelId !== panelId) {
        onDismissRef.current();
      }
    })
  ), [panelId]);

  useEffect(() => {
    if (previousReactionRef.current === firstReaction) return;
    previousReactionRef.current = firstReaction;

    buttonScale.setValue(0.78);
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 260,
      friction: 7,
    }).start();
  }, [buttonScale, firstReaction]);

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
    <View ref={wrapperRef} onLayout={measureAnchor} style={[styles.wrapper, style]}>
      {visible ? (
        <Animated.View
          style={[
            styles.tray,
            { left: trayLeft },
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

      <AnimatedPressable
        onPress={(event) => {
          stopPressPropagation(event);
          measureAnchor();
          if (visible) onDismiss();
          else {
            openMemoryReactionPanel(panelId);
            onOpen();
          }
        }}
        style={[
          styles.button,
          compact && styles.compactButton,
          { transform: [{ scale: buttonScale }] },
          {
            backgroundColor: hasReaction ? theme.colors.tint + '22' : theme.colors.surface,
            borderColor: hasReaction ? theme.colors.tint : theme.colors.border,
          },
          buttonStyle,
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
      </AnimatedPressable>
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
