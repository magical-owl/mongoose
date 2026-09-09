import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '@shared/components/Text';
import { formatFriendlyTimestamp } from '@shared/utils/timeFormat';
import { useTheme } from '@providers/ThemeProvider';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/localization/i18n';
import type { DiaryPhoto, DiaryReflection } from '@/features/diary/domain/DiaryEntry';
import type { Profile } from '@/features/profile/domain/Profile';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import { ReflectionComposer } from './ReflectionComposer';
import { ReflectionPhotoPreview } from './ReflectionPhotoPreview';
import type { MemoryReaction } from '../domain/MemoryReaction';
import { ReflectionReactionFooter } from './ReflectionReactionFooter';

type EntryReflectionSectionVariant = 'feed' | 'timeline';

interface EntryReflectionSectionProps {
  readonly entryId: string;
  readonly reflections: readonly DiaryReflection[];
  readonly variant: EntryReflectionSectionVariant;
  readonly profile?: Pick<Profile, 'displayName' | 'avatarUri'> | null;
  readonly onAddReflection?: (entryId: string, text: string, photo?: DiaryPhoto) => Promise<boolean>;
  readonly onReflectionInputFocus?: (entryId: string) => void;
  readonly onToggleReflectionMemoryReaction?: (entryId: string, reflectionId: string, reaction: MemoryReaction) => Promise<boolean>;
}

export function EntryReflectionSection({
  entryId,
  reflections,
  variant,
  profile,
  onAddReflection,
  onReflectionInputFocus,
  onToggleReflectionMemoryReaction,
}: EntryReflectionSectionProps): React.JSX.Element | null {
  const theme = useTheme();
  const timeFormat = useAppStore((state) => state.timeFormat);
  const t = useTranslation();
  const isFeed = variant === 'feed';
  const hasContent = reflections.length > 0 || Boolean(onAddReflection);
  const revealProgress = useRef(new Animated.Value(0)).current;
  const [openReactionReflectionId, setOpenReactionReflectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasContent) return;

    revealProgress.setValue(0);
    Animated.timing(revealProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hasContent, revealProgress]);

  if (!hasContent) return null;

  const friendlyTimestampLabels = {
    today: t('timeToday'),
    yesterday: t('timeYesterday'),
    todayAt: t('timeTodayAt'),
    yesterdayAt: t('timeYesterdayAt'),
    justNow: t('timeJustNow'),
    minutesAgo: t('timeMinutesAgoShort'),
    hoursAgo: t('timeHoursAgoShort'),
  };

  return (
    <Animated.View
      style={[
        styles.animatedSection,
        {
          opacity: revealProgress,
          transform: [
            {
              translateY: revealProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
        !isFeed && styles.timelineReflectionSection,
        isFeed && styles.feedReflectionPanel,
        isFeed && { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
      testID={isFeed ? 'entry-feed-reflection-panel' : 'entry-timeline-reflection-section'}
    >
      {reflections.length > 0 ? (
        <View
          style={[
            styles.timelineReflections,
            isFeed && styles.feedInlineReflections,
            { borderLeftColor: theme.colors.tint + '88' },
          ]}
          testID="entry-timeline-reflections"
        >
          {reflections.map((reflection) => (
            <View key={reflection.id} style={styles.timelineReflectionRow}>
              <ProfileAvatar
                profile={profile}
                size={24}
                accessibilityLabel={t('profileAvatarA11y')}
                testID="entry-reflection-avatar"
              />
              <View
                style={[
                  styles.timelineReflectionItem,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                testID="entry-timeline-reflection-item"
              >
                <Text preset="caption" color="textTertiary" numberOfLines={1}>
                  {formatFriendlyTimestamp(reflection.createdAt, timeFormat, friendlyTimestampLabels)}
                </Text>
                <Text preset="bodySmall" color="text" style={styles.timelineReflectionText}>
                  {reflection.text}
                </Text>
                {reflection.photo ? (
                  <ReflectionPhotoPreview
                    photo={reflection.photo}
                    style={styles.timelineReflectionPhoto}
                    testID="entry-inline-reflection-photo"
                  />
                ) : null}
                {onToggleReflectionMemoryReaction ? (
                  <ReflectionReactionFooter
                    entryId={entryId}
                    reflectionId={reflection.id}
                    reactions={reflection.memoryReactions ?? []}
                    isPickerVisible={openReactionReflectionId === reflection.id}
                    onOpenPicker={() => setOpenReactionReflectionId(reflection.id)}
                    onDismissPicker={() => setOpenReactionReflectionId(null)}
                    onToggleReaction={(targetEntryId, targetReflectionId, reaction) => {
                      void onToggleReflectionMemoryReaction(targetEntryId, targetReflectionId, reaction);
                    }}
                    testID={`entry-reflection-reaction-${reflection.id}`}
                  />
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {onAddReflection ? (
        <ReflectionComposer
          onSubmit={(text, photo) => onAddReflection(entryId, text, photo)}
          onFocus={() => onReflectionInputFocus?.(entryId)}
          inputBoxStyle={[
            styles.timelineReflectionInputBox,
            isFeed && styles.feedReflectionInputBox,
            reflections.length > 0 && styles.timelineReflectionInputAfterContent,
          ]}
          photoPreviewStyle={[
            styles.inlineReflectionPhotoPreview,
            isFeed && styles.feedInlineReflectionPhotoPreview,
          ]}
          inputBoxTestID={isFeed ? 'entry-feed-reflection-input' : 'entry-timeline-reflection-input'}
          photoPreviewTestID={isFeed ? 'entry-feed-reflection-photo-preview' : 'entry-timeline-reflection-photo-preview'}
          selectedPhotoTestID={isFeed ? 'entry-feed-selected-reflection-photo' : 'entry-timeline-selected-reflection-photo'}
          showKeyboardDismissButton
          submitSurface="subtle"
          minHeight={Math.max(42, theme.fontSizes.sm * 2.9)}
          backgroundColor={isFeed ? theme.colors.surface : theme.colors.card}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedSection: {
    opacity: 1,
  },
  feedReflectionPanel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 0,
    marginTop: 0,
    marginHorizontal: 0,
    padding: 12,
  },
  feedInlineReflections: {
    marginTop: 0,
    marginLeft: 0,
    paddingLeft: 0,
    borderLeftWidth: 0,
  },
  feedReflectionInputBox: {
    marginLeft: 0,
  },
  feedInlineReflectionPhotoPreview: {
    marginLeft: 0,
  },
  timelineReflectionSection: {
    marginRight: 0,
  },
  timelineReflections: {
    gap: 7,
    marginTop: 0,
    marginLeft: 8,
    paddingLeft: 10,
    borderLeftWidth: 1,
  },
  timelineReflectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  timelineReflectionItem: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  timelineReflectionText: {
    lineHeight: 20,
    marginTop: 2,
  },
  timelineReflectionPhoto: {
    width: '100%',
    height: 118,
    borderRadius: 8,
    marginTop: 8,
  },
  timelineReflectionInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 0,
    marginLeft: 8,
    paddingLeft: 12,
    paddingRight: 4,
  },
  timelineReflectionInputAfterContent: {
    marginTop: 10,
  },
  inlineReflectionPhotoPreview: {
    marginTop: 8,
    marginLeft: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
