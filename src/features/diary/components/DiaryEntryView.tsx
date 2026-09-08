import { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, TouchableOpacity, useWindowDimensions, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { stripHtml } from '@shared/utils/html';
import { getEntryManualMoods, getPrimaryManualMood, type DiaryEntry, type DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';
import type { Profile } from '@/features/profile/domain/Profile';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import { diaryEntryListTitle } from './diaryEntryTypography';
import { EntryViewCountBadge } from './EntryViewCountBadge';
import { DiaryPaperCanvas } from './DiaryPaperCanvas';
import { formatFriendlyTimestamp } from '@shared/utils/timeFormat';
import { useAppStore } from '@/stores/useAppStore';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import { reflectionCountLabel, useTranslation } from '@/localization/i18n';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import {
  getStickerBodyPreviewBottom,
} from '@/features/diary/domain/StickerLayout';
import { DiaryEntryBodyPreview } from './DiaryEntryBodyPreview';
import { EntryMetaRow } from './EntryMetaRow';
import { EntryCoverSummary } from './EntryCoverSummary';
import { EntryReflectionSection } from './EntryReflectionSection';

export type DiaryEntryViewMode = 'detailed' | 'timeline' | 'feed';

interface DiaryEntryViewProps {
  readonly entry: DiaryEntry;
  readonly mode: DiaryEntryViewMode;
  readonly profile?: Pick<Profile, 'displayName' | 'avatarUri'> | null;
  readonly onPress: () => void | Promise<void>;
  readonly onAddReflection?: (entryId: string, text: string, photo?: DiaryPhoto) => Promise<boolean>;
  readonly onReflectionSummaryPress?: (entryId: string) => void;
  readonly onReflectionInputFocus?: (entryId: string) => void;
  readonly onToggleMemoryReaction?: (entryId: string, reaction: MemoryReaction) => Promise<boolean>;
  readonly showDateColumn?: boolean;
}

function CoverPhotoPreview({
  children,
  entry,
  style,
  testID,
}: {
  readonly children?: ReactNode;
  readonly entry: DiaryEntry;
  readonly style: StyleProp<ImageStyle>;
  readonly testID?: string;
}): React.JSX.Element | null {
  const theme = useTheme();
  if (!entry.coverPhoto) return null;
  const source = getDiaryPhotoImageSource(entry.coverPhoto.uri);
  if (!source) return null;
  const flattenedStyle = StyleSheet.flatten(style) ?? {};
  const frameStyle = flattenedStyle as ViewStyle;
  const imageStyle = flattenedStyle as ImageStyle;
  return (
    <View style={[styles.coverPhotoFrame, frameStyle]} testID={testID}>
      <Image
        source={source}
        style={[styles.coverPhoto, imageStyle]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        testID={testID ? `${testID}-image` : undefined}
      />
      <View
        pointerEvents="none"
        style={[styles.coverPhotoScrim, frameStyle, { backgroundColor: theme.colors.overlay }]}
        testID={testID ? `${testID}-scrim` : undefined}
      />
      {children}
    </View>
  );
}

function formatCardDay(value: string): { weekday: string; day: string } {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { weekday: '', day: value };
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
    day: String(date.getDate()).padStart(2, '0'),
  };
}

export function DiaryEntryView({
  entry,
  mode,
  profile,
  onPress,
  onAddReflection,
  onReflectionSummaryPress,
  onReflectionInputFocus,
  onToggleMemoryReaction,
  showDateColumn = true,
}: DiaryEntryViewProps): React.JSX.Element {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const timeFormat = useAppStore((state) => state.timeFormat);
  const t = useTranslation();
  const [isMemoryReactionPickerVisible, setIsMemoryReactionPickerVisible] = useState(false);
  const [feedCanvasWidth, setFeedCanvasWidth] = useState(0);
  const entryMoods = getEntryManualMoods(entry);
  const primaryMood = getPrimaryManualMood(entryMoods);
  const hasMood = entryMoods.length > 0;
  const moodTone = getManualMoodColor(primaryMood, theme.colors);
  const friendlyTimestampLabels = {
    today: t('timeToday'),
    yesterday: t('timeYesterday'),
    todayAt: t('timeTodayAt'),
    yesterdayAt: t('timeYesterdayAt'),
    justNow: t('timeJustNow'),
    minutesAgo: t('timeMinutesAgoShort'),
    hoursAgo: t('timeHoursAgoShort'),
  };
  const entryTime = formatFriendlyTimestamp(entry.createdAt, timeFormat, friendlyTimestampLabels);
  const feedEntryDateTime = entryTime;
  const viewCount = entry.viewCount ?? 0;
  const viewCountA11y = t('entryViewCountA11y').replace('{count}', String(viewCount));
  const showReflectionSummaryAction = mode !== 'timeline' && Boolean(onReflectionSummaryPress);
  const showMemoryReactionControl = Boolean(onToggleMemoryReaction);
  const reflectionSummaryLabel = entry.reflections.length > 0 ? reflectionCountLabel(entry.reflections.length, t) : t('reflectOnThis');
  const editorCanvasWidth = Math.max(1, windowWidth - theme.spacing.lg * 2);
  const measuredFeedCanvasWidth = feedCanvasWidth > 0 ? feedCanvasWidth : editorCanvasWidth;
  const feedCoordinateScale = Math.min(1, measuredFeedCanvasWidth / editorCanvasWidth);
  const fullWidthEntryFrame = {
    width: windowWidth,
    marginHorizontal: -theme.spacing.xl,
  };

  const handleOpenEntry = () => {
    if (isMemoryReactionPickerVisible) {
      setIsMemoryReactionPickerVisible(false);
      return;
    }
    void onPress();
  };

  const feedStickerCanvasHeight = entry.stickers.length > 0
    ? Math.max(
        0,
        ...entry.stickers.map((sticker) => (
          getStickerBodyPreviewBottom(sticker, feedCoordinateScale)
        )),
      )
    : 0;
  const memoryReactionRowProps = onToggleMemoryReaction ? {
    memoryReactions: entry.memoryReactions,
    isMemoryReactionPickerVisible,
    onOpenMemoryReactionPicker: () => setIsMemoryReactionPickerVisible(true),
    onDismissMemoryReactionPicker: () => setIsMemoryReactionPickerVisible(false),
    onToggleMemoryReaction: async (reaction: MemoryReaction) => {
      await onToggleMemoryReaction(entry.id, reaction);
    },
  } : {};
  const renderViewCountBadge = (testID: string, style?: StyleProp<ViewStyle>) => (
    <EntryViewCountBadge
      count={viewCount}
      accessibilityLabel={viewCountA11y}
      height={26}
      minWidth={44}
      iconSize={15}
      style={style}
      testID={testID}
    />
  );
  const renderCoverMetaOverlay = (prefix: 'card' | 'timeline') => (
    <View style={styles.coverMetaOverlay}>
      <EntryMetaRow
        variant="cover"
        moods={entryMoods}
        tags={entry.tags}
        style={styles.coverMetaBadges}
        testID={`entry-${prefix}-cover-meta-row`}
        moodTestID={`entry-${prefix}-cover-mood`}
        tagTestID={`entry-${prefix}-cover-tags`}
      />
      {renderViewCountBadge(`entry-${prefix}-view-count`, styles.coverViewCountBadge)}
    </View>
  );

  const renderInlineReflectionSection = (variant: 'feed' | 'timeline') => (
    <EntryReflectionSection
      entryId={entry.id}
      reflections={entry.reflections}
      variant={variant}
      profile={profile}
      onAddReflection={onAddReflection}
      onReflectionInputFocus={onReflectionInputFocus}
    />
  );

  if (mode === 'feed') {
    const feedTimestamp = feedEntryDateTime;
    const feedHasCoverPhoto = Boolean(entry.coverPhoto);
    const feedFooterMeta = (
      <EntryMetaRow
        variant="feed"
        moods={feedHasCoverPhoto ? [] : entryMoods}
        tags={feedHasCoverPhoto ? [] : entry.tags}
        {...memoryReactionRowProps}
        reflectionCount={showReflectionSummaryAction ? entry.reflections.length : undefined}
        onReflectionPress={showReflectionSummaryAction ? () => onReflectionSummaryPress?.(entry.id) : undefined}
        reflectionAccessibilityLabel={showReflectionSummaryAction ? reflectionSummaryLabel : undefined}
        testID="entry-feed-footer-meta"
        memoryReactionTestID="entry-feed-memory-reaction"
        moodTestID="entry-feed-mood"
        tagTestID="entry-feed-tags"
        reflectionTestID="entry-feed-reflection-button"
      />
    );
    return (
      <View style={[styles.feedCard, fullWidthEntryFrame]} testID="entry-feed-card">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenEntry}
          onLongPress={showMemoryReactionControl ? () => setIsMemoryReactionPickerVisible(true) : undefined}
          testID="entry-feed-surface"
          style={[
            styles.feedEntrySurface,
            {
              backgroundColor: entry.coverPhoto ? theme.colors.card : 'transparent',
              borderColor: entry.coverPhoto ? theme.colors.border : 'transparent',
            },
          ]}
        >
          {entry.coverPhoto ? (
            <EntryCoverSummary
              variant="feed"
              title={entry.title}
              timestamp={feedTimestamp}
              imageSource={getDiaryPhotoImageSource(entry.coverPhoto.uri)}
              viewCount={viewCount}
              viewCountAccessibilityLabel={viewCountA11y}
              moods={entryMoods}
              tags={entry.tags}
              viewCountTestID="entry-feed-view-count"
              timestampTestID="entry-feed-cover-timestamp"
              moodTestID="entry-feed-cover-mood"
              tagTestID="entry-feed-cover-tags"
            />
          ) : null}
          <DiaryPaperCanvas
            paperBackgroundId={entry.paperBackgroundId}
            onLayout={(event) => setFeedCanvasWidth(event.nativeEvent.layout.width)}
            style={[
              styles.feedCanvas,
              feedStickerCanvasHeight > 0 && { minHeight: feedStickerCanvasHeight },
            ]}
            testID="entry-feed-paper-canvas"
          >
            <View style={styles.feedTextLayer}>
              {entry.coverPhoto ? null : (
                <View style={styles.feedCoverContent}>
                  <Text
                    style={[
                      styles.feedTitle,
                      styles.feedCoverTitle,
                      {
                        color: theme.colors.text,
                        fontSize: theme.fontSizes.xxxl,
                        lineHeight: theme.fontSizes.xxxl * 1.25,
                      },
                    ]}
                    numberOfLines={3}
                  >
                    {entry.title}
                  </Text>
                  {feedTimestamp ? (
                    <Text
                      preset="caption"
                      style={[styles.feedDateTime, { color: theme.colors.text }]}
                      numberOfLines={1}
                      testID="entry-feed-timestamp"
                    >
                      {feedTimestamp}
                    </Text>
                  ) : null}
                </View>
              )}
              <View
                style={[
                  styles.feedContentPanel,
                  entry.coverPhoto && styles.feedContentPanelMerged,
                  {
                    backgroundColor: entry.coverPhoto ? 'transparent' : theme.colors.card,
                    borderColor: entry.coverPhoto ? 'transparent' : theme.colors.border,
                  },
                ]}
                testID="entry-feed-content-panel"
              >
                <DiaryEntryBodyPreview
                  entry={entry}
                  bodyCanvasHeight={feedStickerCanvasHeight}
                  bodyFontSize={16}
                  bodyLineHeight={24}
                  stickers={entry.stickers}
                  onBodyLayout={(layout) => setFeedCanvasWidth(layout.width)}
                />
              </View>
            </View>
          </DiaryPaperCanvas>
        </TouchableOpacity>
        {feedFooterMeta}
        {renderInlineReflectionSection('feed')}
      </View>
    );
  }

  if (mode === 'timeline') {
    return (
      <View style={[styles.timelineEntry, fullWidthEntryFrame]} testID="entry-timeline">
        <View style={[styles.timelineSpine, { backgroundColor: theme.colors.border, left: theme.spacing.xl + 6 }]} testID="entry-timeline-spine" />
        <View style={[styles.timelineDot, { backgroundColor: hasMood ? moodTone : theme.colors.tint, borderColor: theme.colors.background, left: theme.spacing.xl + 1 }]} testID="entry-timeline-dot" />
        <View style={styles.timelineBody}>
          <Pressable
            onPress={handleOpenEntry}
            onLongPress={showMemoryReactionControl ? () => setIsMemoryReactionPickerVisible(true) : undefined}
            style={styles.timelinePressArea}
            testID="entry-timeline-press-area"
          >
            <View style={styles.timelineHeader}>
              <View style={styles.timelineTitleGroup}>
                <ProfileAvatar profile={profile} size={22} accessibilityLabel={t('profileAvatarA11y')} testID="entry-timeline-avatar" />
                <Text style={[styles.timelineTitle, { color: theme.colors.text }]} numberOfLines={1}>{entry.title}</Text>
              </View>
              <View style={styles.timelineActions}>
                {entryTime ? <Text preset="caption" color="textTertiary" numberOfLines={1} style={styles.timelineTime}>{entryTime}</Text> : null}
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </View>
            </View>
            {entry.coverPhoto ? (
              <CoverPhotoPreview entry={entry} style={styles.timelineHeroCoverPhoto} testID="entry-timeline-cover-photo">
                {renderCoverMetaOverlay('timeline')}
              </CoverPhotoPreview>
            ) : null}
            <View style={styles.timelinePreviewRow}>
              <View style={styles.timelineTextPreview}>
                <Text style={[styles.timelineContent, { color: theme.colors.textSecondary }]} numberOfLines={entry.coverPhoto ? 2 : 3}>{stripHtml(entry.content)}</Text>
                <EntryMetaRow
                  variant="timeline"
                  moods={entry.coverPhoto ? [] : entryMoods}
                  tags={entry.coverPhoto ? [] : entry.tags}
                  {...memoryReactionRowProps}
                  testID="entry-timeline-meta-row"
                  memoryReactionTestID="entry-timeline-memory-reaction"
                  moodTestID="entry-timeline-mood"
                  tagTestID="entry-timeline-tags"
                />
              </View>
            </View>
          </Pressable>
          {renderInlineReflectionSection('timeline')}
        </View>
      </View>
    );
  }

  const cardDate = formatCardDay(entry.date);
  const cardHasCoverPhoto = Boolean(entry.coverPhoto);
  const cardFooterContent = (
      <EntryMetaRow
        variant="card"
        moods={cardHasCoverPhoto ? [] : entryMoods}
        tags={cardHasCoverPhoto ? [] : entry.tags}
      {...memoryReactionRowProps}
      reflectionCount={showReflectionSummaryAction ? entry.reflections.length : undefined}
      onReflectionPress={showReflectionSummaryAction ? () => onReflectionSummaryPress?.(entry.id) : undefined}
      reflectionAccessibilityLabel={showReflectionSummaryAction ? reflectionSummaryLabel : undefined}
      testID="entry-card-footer"
      memoryReactionTestID="entry-card-memory-reaction"
      moodTestID="entry-card-mood"
      tagTestID="entry-card-tags"
      reflectionTestID="entry-card-reflection-button"
    />
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleOpenEntry}
      onLongPress={showMemoryReactionControl ? () => setIsMemoryReactionPickerVisible(true) : undefined}
      style={[styles.card, fullWidthEntryFrame, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      testID="entry-card"
    >
      {entry.coverPhoto ? (
        <CoverPhotoPreview entry={entry} style={styles.cardHeroCoverPhoto} testID="entry-card-cover-photo">
          {renderCoverMetaOverlay('card')}
        </CoverPhotoPreview>
      ) : null}
      <View style={styles.cardInner}>
        <View style={[styles.cardRail, { backgroundColor: hasMood ? moodTone : theme.colors.tint }]} />
        {showDateColumn ? (
          <View style={styles.cardDateColumn} testID="entry-card-date-column">
            <Text preset="caption" color="textSecondary" style={styles.cardWeekday}>{cardDate.weekday}</Text>
            <Text style={[styles.cardDay, { color: theme.colors.text }]}>{cardDate.day}</Text>
          </View>
        ) : null}
        <View style={styles.cardContentColumn}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <ProfileAvatar profile={profile} size={22} accessibilityLabel={t('profileAvatarA11y')} testID="entry-card-avatar" />
              <Text preset="h3" color="text" style={styles.title} numberOfLines={1}>{entry.title}</Text>
            </View>
            {entryTime ? <Text preset="caption" color="textTertiary" numberOfLines={1} style={styles.cardTime}>{entryTime}</Text> : null}
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </View>
          <View style={styles.cardPreviewRow}>
            <View style={styles.cardTextPreview}>
              <Text style={[styles.content, { color: theme.colors.textSecondary }]} numberOfLines={entry.coverPhoto ? 2 : 3}>{stripHtml(entry.content)}</Text>
              {cardFooterContent}
            </View>
            {!entry.coverPhoto ? <CoverPhotoPreview entry={entry} style={styles.cardCoverPhoto} /> : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 0, marginBottom: 0 },
  cardInner: { flexDirection: 'row' },
  cardRail: { width: 4 },
  cardDateColumn: { width: 66, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  cardWeekday: { fontWeight: '600' },
  cardDay: { fontSize: 34, lineHeight: 40, fontWeight: '300', marginTop: 2 },
  cardTime: { flexShrink: 0, fontSize: 11, lineHeight: 14 },
  cardContentColumn: { flex: 1, paddingLeft: 0, paddingRight: 14, paddingVertical: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  cardTitleRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7 },
  entryMoodMeta: { maxWidth: 190 },
  title: { flex: 1 },
  content: { fontSize: 16, lineHeight: 22 },
  coverPhotoFrame: { position: 'relative', overflow: 'hidden' },
  coverPhoto: { backgroundColor: '#000' },
  coverPhotoScrim: { position: 'absolute', top: 0, left: 0, opacity: 0.28 },
  coverViewCountBadge: { flexShrink: 0 },
  coverMetaOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coverMetaBadges: {
    flex: 1,
    minWidth: 0,
  },
  cardPreviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTextPreview: { flex: 1, minWidth: 0 },
  cardCoverPhoto: { width: 58, height: 58, borderRadius: 6 },
  cardHeroCoverPhoto: { width: '100%', height: 138, borderRadius: 0 },
  feedCard: { paddingVertical: 0, marginBottom: 0 },
  feedEntrySurface: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  feedCanvas: { position: 'relative', overflow: 'visible' },
  feedTextLayer: { position: 'relative', zIndex: 2 },
  feedTitle: { flex: 1, fontWeight: '700' },
  feedCoverContent: { paddingLeft: 20, paddingRight: 78, paddingTop: 42, paddingBottom: 12 },
  feedCoverTitle: { marginBottom: 2 },
  feedContentPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 0, paddingHorizontal: 12, paddingVertical: 12 },
  feedContentPanelMerged: { borderWidth: 0, borderRadius: 0, paddingTop: 10, paddingBottom: 10, paddingHorizontal: 20 },
  feedDateTime: { flexShrink: 0, fontWeight: '700', marginTop: 2 },
  timelineEntry: { position: 'relative', minHeight: 82, marginBottom: 18, paddingLeft: 42, paddingRight: 20 },
  timelineSpine: { position: 'absolute', top: 0, bottom: -18, left: 6, width: 1 },
  timelineDot: { position: 'absolute', top: 13, left: 1, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  timelineBody: { flex: 1, paddingVertical: 5 },
  timelinePressArea: { marginBottom: 0 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  timelineTitleGroup: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7 },
  timelineTitle: { ...diaryEntryListTitle, flex: 1 },
  timelineTime: { flexShrink: 0, fontSize: 11, lineHeight: 14 },
  timelineActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timelinePreviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timelineTextPreview: { flex: 1, minWidth: 0 },
  timelineCoverPhoto: { width: 62, height: 48, borderRadius: 6 },
  timelineHeroCoverPhoto: { width: '100%', height: 138, borderRadius: 0, marginBottom: 10 },
  timelineContent: { fontSize: 14, lineHeight: 20, marginBottom: 5 },
});
