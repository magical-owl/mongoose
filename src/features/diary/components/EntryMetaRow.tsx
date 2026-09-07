import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import type { ManualMood } from '@/features/diary/domain/DiaryEntry';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';
import { MoodBadgeList } from './MoodBadgeList';
import { TagBadgeList } from './TagBadgeList';
import { MemoryReactionButton } from './MemoryReactionButton';
import { ReflectionSummaryButton } from './ReflectionSummaryButton';

type EntryMetaRowVariant = 'card' | 'feed' | 'timeline' | 'viewFooter';

interface EntryMetaRowProps {
  readonly variant: EntryMetaRowVariant;
  readonly moods: readonly ManualMood[];
  readonly tags: readonly string[];
  readonly memoryReactions?: readonly MemoryReaction[];
  readonly isMemoryReactionPickerVisible?: boolean;
  readonly onOpenMemoryReactionPicker?: () => void;
  readonly onDismissMemoryReactionPicker?: () => void;
  readonly onToggleMemoryReaction?: (reaction: MemoryReaction) => void | Promise<void>;
  readonly reflectionCount?: number;
  readonly onReflectionPress?: () => void;
  readonly reflectionAccessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
  readonly memoryReactionTestID?: string;
  readonly moodTestID?: string;
  readonly tagTestID?: string;
  readonly reflectionTestID?: string;
}

export function EntryMetaRow({
  variant,
  moods,
  tags,
  memoryReactions = [],
  isMemoryReactionPickerVisible = false,
  onOpenMemoryReactionPicker,
  onDismissMemoryReactionPicker,
  onToggleMemoryReaction,
  reflectionCount,
  onReflectionPress,
  reflectionAccessibilityLabel,
  style,
  testID,
  memoryReactionTestID,
  moodTestID,
  tagTestID,
  reflectionTestID,
}: EntryMetaRowProps): React.JSX.Element | null {
  const theme = useTheme();
  const showMemoryReaction = Boolean(onToggleMemoryReaction && onOpenMemoryReactionPicker && onDismissMemoryReactionPicker);
  const showReflection = typeof reflectionCount === 'number' && Boolean(onReflectionPress && reflectionAccessibilityLabel);
  const hasMood = moods.length > 0;
  const hasTags = tags.length > 0;

  if (!showMemoryReaction && !hasMood && !hasTags && !showReflection) return null;

  const isCompact = variant === 'card' || variant === 'timeline';

  return (
    <View
      style={[
        styles.row,
        variant === 'feed' && [
          styles.feedRow,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ],
        variant === 'timeline' && styles.timelineRow,
        variant === 'card' && styles.cardRow,
        variant === 'viewFooter' && styles.viewFooterRow,
        style,
      ]}
      testID={testID}
    >
      {showMemoryReaction ? (
        <MemoryReactionButton
          reactions={memoryReactions}
          visible={isMemoryReactionPickerVisible}
          onOpen={onOpenMemoryReactionPicker!}
          onDismiss={onDismissMemoryReactionPicker!}
          onToggleReaction={onToggleMemoryReaction!}
          compact={variant !== 'feed'}
          style={[
            styles.reactionButton,
            variant === 'viewFooter' && styles.viewFooterReactionButton,
          ]}
          testID={memoryReactionTestID}
        />
      ) : null}
      {hasMood ? (
        <MoodBadgeList
          moods={moods}
          maxVisible={1}
          compact={isCompact}
          overflowPopup
          style={[
            variant === 'card' && styles.cardMoodBadges,
            variant === 'timeline' && styles.timelineMoodBadges,
            variant === 'feed' && styles.feedMoodBadges,
            variant === 'viewFooter' && styles.viewFooterMoodBadges,
          ]}
          testID={moodTestID}
        />
      ) : null}
      {hasTags ? (
        <TagBadgeList
          tags={tags}
          maxVisible={1}
          compact={isCompact}
          overflowPopup
          style={[
            variant === 'card' && styles.cardTagBadges,
            variant === 'timeline' && styles.timelineTagBadges,
            variant === 'feed' && styles.feedTagBadges,
            variant === 'viewFooter' && styles.viewFooterTagBadges,
          ]}
          testID={tagTestID}
        />
      ) : null}
      {showReflection ? (
        <ReflectionSummaryButton
          count={reflectionCount!}
          onPress={onReflectionPress!}
          accessibilityLabel={reflectionAccessibilityLabel!}
          iconSize={variant === 'viewFooter' ? 21 : undefined}
          height={variant === 'viewFooter' ? 38 : undefined}
          minWidth={variant === 'viewFooter' ? 62 : undefined}
          style={variant === 'viewFooter' && styles.viewFooterButton}
          testID={reflectionTestID}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardRow: {
    marginTop: 8,
  },
  feedRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  timelineRow: {
    gap: 10,
    marginBottom: 8,
  },
  viewFooterRow: {
    flex: 1,
    minWidth: 0,
  },
  reactionButton: {
    flexShrink: 0,
  },
  cardMoodBadges: {
    maxWidth: 140,
  },
  cardTagBadges: {
    flex: 1,
    maxWidth: '100%',
  },
  feedMoodBadges: {
    maxWidth: '100%',
  },
  feedTagBadges: {
    flex: 1,
    maxWidth: '100%',
  },
  timelineMoodBadges: {
    maxWidth: 140,
  },
  timelineTagBadges: {
    flex: 1,
    maxWidth: '100%',
  },
  viewFooterReactionButton: {
    flexShrink: 0,
  },
  viewFooterMoodBadges: {
    maxWidth: 116,
  },
  viewFooterTagBadges: {
    flex: 1,
    maxWidth: '100%',
  },
  viewFooterButton: {
    flexShrink: 0,
    gap: 8,
  },
});
