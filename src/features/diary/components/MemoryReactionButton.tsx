import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import {
  MEMORY_REACTION_OPTIONS,
  type MemoryReaction,
} from '@/features/diary/domain/MemoryReaction';
import { memoryReactionLabel, useTranslation } from '@/localization/i18n';

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

function reactionIcon(reaction: MemoryReaction): keyof typeof Ionicons.glyphMap {
  if (reaction === 'treasure') return 'diamond-outline';
  if (reaction === 'smile') return 'happy-outline';
  if (reaction === 'heavy') return 'rainy-outline';
  if (reaction === 'tender') return 'sad-outline';
  if (reaction === 'stormy') return 'flame-outline';
  if (reaction === 'wonder') return 'sparkles-outline';
  return 'heart-outline';
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
  const firstReaction = reactions[0];
  const extraCount = Math.max(0, reactions.length - 1);
  const hasReaction = Boolean(firstReaction);
  const label = firstReaction ? memoryReactionLabel(firstReaction, t) : t('memoryReactionButton');
  const trayWidth = Math.min(Math.max(width - 80, 300), 380);

  return (
    <View style={[styles.wrapper, style]}>
      {visible ? (
        <View
          style={[
            styles.tray,
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
                  onPress={() => {
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
                  <Ionicons
                    name={reactionIcon(reaction)}
                    size={22}
                    color={active ? theme.colors.background : theme.colors.textSecondary}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <Pressable
        onPress={visible ? onDismiss : onOpen}
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
        <Ionicons
          name={firstReaction ? reactionIcon(firstReaction) : 'heart-outline'}
          size={compact ? 13 : 15}
          color={hasReaction ? theme.colors.tint : theme.colors.textSecondary}
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
        {extraCount > 0 ? (
          <Text
            preset="caption"
            style={[
              styles.count,
              compact && styles.compactLabel,
              { color: theme.colors.tint },
            ]}
          >
            +{extraCount}
          </Text>
        ) : null}
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
    minHeight: 26,
    maxWidth: 128,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  compactButton: {
    minHeight: 22,
    maxWidth: 104,
    borderRadius: 11,
    paddingHorizontal: 7,
  },
  label: {
    flexShrink: 1,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  count: {
    fontWeight: '800',
  },
  tray: {
    position: 'absolute',
    left: 0,
    bottom: '100%',
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 7,
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
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
