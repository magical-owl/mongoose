import { useState, type ReactNode } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, TouchableOpacity, useWindowDimensions, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { stripHtml } from '@shared/utils/html';
import { getEntryManualMoods, getPrimaryManualMood, type DiaryEntry, type DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';
import type { Profile } from '@/features/profile/domain/Profile';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import { diaryEntryListTitle } from './diaryEntryTypography';
import { MoodBadgeList } from './MoodBadgeList';
import { TagBadgeList } from './TagBadgeList';
import { ReflectionSummaryButton } from './ReflectionSummaryButton';
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
import { MemoryReactionButton } from './MemoryReactionButton';
import { ReflectionComposer } from './ReflectionComposer';
import { ReflectionPhotoPreview } from './ReflectionPhotoPreview';

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
  const isFeedMode = mode === 'feed';
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
  const renderMemoryReactionButton = (testID: string, style: StyleProp<ViewStyle>, compact = true) => (
    <MemoryReactionButton
      reactions={entry.memoryReactions}
      visible={isMemoryReactionPickerVisible}
      onOpen={() => setIsMemoryReactionPickerVisible(true)}
      onDismiss={() => setIsMemoryReactionPickerVisible(false)}
      onToggleReaction={async (reaction) => {
        await onToggleMemoryReaction?.(entry.id, reaction);
      }}
      compact={compact}
      style={style}
      testID={testID}
    />
  );
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

  const hasInlineReflectionContent = entry.reflections.length > 0 || Boolean(onAddReflection);
  const inlineReflectionSection = hasInlineReflectionContent ? (
    <View
      style={[
        !isFeedMode && styles.timelineReflectionSection,
        isFeedMode && styles.feedReflectionPanel,
        isFeedMode && { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
      testID={isFeedMode ? 'entry-feed-reflection-panel' : 'entry-timeline-reflection-section'}
    >
      {entry.reflections.length > 0 ? (
        <View
          style={[
            styles.timelineReflections,
            isFeedMode && styles.feedInlineReflections,
            { borderLeftColor: theme.colors.tint + '88' },
          ]}
          testID="entry-timeline-reflections"
        >
          {entry.reflections.map((reflection) => (
            <View key={reflection.id} style={styles.timelineReflectionRow}>
              <ProfileAvatar
                profile={profile}
                size={24}
                accessibilityLabel={t('profileAvatarA11y')}
                testID="entry-reflection-avatar"
              />
              <View style={[styles.timelineReflectionItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} testID="entry-timeline-reflection-item">
                <Text preset="caption" color="textTertiary" numberOfLines={1}>
                  {formatFriendlyTimestamp(reflection.createdAt, timeFormat, friendlyTimestampLabels)}
                </Text>
                <Text preset="bodySmall" color="text" style={styles.timelineReflectionText}>{reflection.text}</Text>
                {reflection.photo ? (
                  <ReflectionPhotoPreview
                    photo={reflection.photo}
                    style={styles.timelineReflectionPhoto}
                    testID="entry-inline-reflection-photo"
                  />
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {onAddReflection ? (
        <ReflectionComposer
          onSubmit={(text, photo) => onAddReflection(entry.id, text, photo)}
          onFocus={() => onReflectionInputFocus?.(entry.id)}
          inputBoxStyle={[
            styles.timelineReflectionInputBox,
            isFeedMode && styles.feedReflectionInputBox,
            entry.reflections.length > 0 && styles.timelineReflectionInputAfterContent,
          ]}
          photoPreviewStyle={[
            styles.inlineReflectionPhotoPreview,
            isFeedMode && styles.feedInlineReflectionPhotoPreview,
          ]}
          inputBoxTestID={isFeedMode ? 'entry-feed-reflection-input' : 'entry-timeline-reflection-input'}
          photoPreviewTestID={isFeedMode ? 'entry-feed-reflection-photo-preview' : 'entry-timeline-reflection-photo-preview'}
          selectedPhotoTestID={isFeedMode ? 'entry-feed-selected-reflection-photo' : 'entry-timeline-selected-reflection-photo'}
          showKeyboardDismissButton
          submitSurface="subtle"
          minHeight={Math.max(42, theme.fontSizes.sm * 2.9)}
          backgroundColor={isFeedMode ? theme.colors.surface : theme.colors.card}
        />
      ) : null}
    </View>
  ) : null;

  if (mode === 'feed') {
    const feedTimestamp = feedEntryDateTime ? (
      <Text
        preset="caption"
        color={entry.coverPhoto ? undefined : 'textTertiary'}
        style={[
          styles.feedDateTime,
          entry.coverPhoto && { color: theme.colors.stickerControlText },
        ]}
        numberOfLines={1}
        testID={entry.coverPhoto ? 'entry-feed-cover-timestamp' : 'entry-feed-timestamp'}
      >
        {feedEntryDateTime}
      </Text>
    ) : null;
    const feedFooterMeta = showMemoryReactionControl || hasMood || entry.tags.length > 0 || showReflectionSummaryAction ? (
      <View
        style={[
          styles.feedFooterMetaRow,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
        testID="entry-feed-footer-meta"
      >
        {showMemoryReactionControl ? renderMemoryReactionButton('entry-feed-memory-reaction', styles.feedReactionButton, false) : null}
        {hasMood ? (
          <MoodBadgeList
            moods={entryMoods}
            maxVisible={1}
            overflowPopup
            style={styles.feedMoodBadges}
            testID="entry-feed-mood"
          />
        ) : null}
        <TagBadgeList
          tags={entry.tags}
          maxVisible={1}
          overflowPopup
          style={styles.feedTagBadges}
          testID="entry-feed-tags"
        />
        {showReflectionSummaryAction ? (
          <ReflectionSummaryButton
            count={entry.reflections.length}
            onPress={() => onReflectionSummaryPress?.(entry.id)}
            accessibilityLabel={reflectionSummaryLabel}
            testID="entry-feed-reflection-button"
          />
        ) : null}
      </View>
    ) : null;
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
            <ImageBackground
              source={getDiaryPhotoImageSource(entry.coverPhoto.uri)}
              style={styles.feedCoverHeader}
              imageStyle={styles.feedCoverHeaderImage}
              resizeMode="cover"
            >
              <View style={[styles.feedCoverScrim, { backgroundColor: theme.colors.overlay }]} />
              <View style={styles.feedCoverContent}>
                <Text
                  style={[
                    styles.feedTitle,
                    styles.feedCoverTitle,
                    {
                      fontSize: theme.fontSizes.xxxl,
                      lineHeight: theme.fontSizes.xxxl * 1.25,
                      color: theme.colors.stickerControlText,
                    },
                  ]}
                  numberOfLines={3}
                >
                  {entry.title}
                </Text>
                {feedTimestamp}
              </View>
              {renderViewCountBadge('entry-feed-view-count', styles.coverViewCountBadge)}
            </ImageBackground>
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
                <View style={styles.feedInlineHeader}>
                  <View style={styles.feedTitleRow}>
                    <Text
                      style={[
                        styles.feedTitle,
                        {
                          color: theme.colors.text,
                          fontSize: theme.fontSizes.xxxl,
                          lineHeight: theme.fontSizes.xxxl * 1.25,
                        },
                      ]}
                    >
                      {entry.title}
                    </Text>
                  </View>
                  {feedTimestamp}
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
        {inlineReflectionSection}
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
                {renderViewCountBadge('entry-timeline-view-count', styles.coverViewCountBadge)}
              </CoverPhotoPreview>
            ) : null}
            <View style={styles.timelinePreviewRow}>
              <View style={styles.timelineTextPreview}>
                <Text style={[styles.timelineContent, { color: theme.colors.textSecondary }]} numberOfLines={entry.coverPhoto ? 2 : 3}>{stripHtml(entry.content)}</Text>
                {(showMemoryReactionControl || hasMood || entry.tags.length > 0) && (
                  <View style={styles.timelineMetaRow} testID="entry-timeline-meta-row">
                    {showMemoryReactionControl ? renderMemoryReactionButton('entry-timeline-memory-reaction', styles.timelineReactionButton) : null}
                    {hasMood ? (
                      <MoodBadgeList
                        moods={entryMoods}
                        maxVisible={1}
                        compact
                        overflowPopup
                        style={styles.timelineMoodBadges}
                        testID="entry-timeline-mood"
                      />
                    ) : null}
                    {entry.tags.length > 0 ? (
                      <TagBadgeList
                        tags={entry.tags}
                        maxVisible={1}
                        compact
                        overflowPopup
                        style={styles.timelineTagBadges}
                        testID="entry-timeline-tags"
                      />
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          </Pressable>
          {inlineReflectionSection}
        </View>
      </View>
    );
  }

  const cardDate = formatCardDay(entry.date);
  const cardFooterContent = showMemoryReactionControl || hasMood || entry.tags.length > 0 || showReflectionSummaryAction ? (
    <View style={styles.cardFooter} testID="entry-card-footer">
      {showMemoryReactionControl ? renderMemoryReactionButton('entry-card-memory-reaction', styles.cardFooterReactionButton) : null}
      {hasMood ? (
        <MoodBadgeList
          moods={entryMoods}
          maxVisible={1}
          compact
          overflowPopup
          style={styles.cardFooterMoodBadges}
          testID="entry-card-mood"
        />
      ) : null}
      {entry.tags.length > 0 ? (
        <TagBadgeList
          tags={entry.tags}
          maxVisible={1}
          compact
          overflowPopup
          style={styles.cardFooterTagBadges}
          testID="entry-card-tags"
        />
      ) : null}
      {showReflectionSummaryAction ? (
        <ReflectionSummaryButton
          count={entry.reflections.length}
          onPress={() => onReflectionSummaryPress?.(entry.id)}
          accessibilityLabel={reflectionSummaryLabel}
          testID="entry-card-reflection-button"
        />
      ) : null}
    </View>
  ) : null;

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
          {renderViewCountBadge('entry-card-view-count', styles.coverViewCountBadge)}
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
  coverViewCountBadge: { position: 'absolute', right: 10, bottom: 10 },
  cardPreviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTextPreview: { flex: 1, minWidth: 0 },
  cardCoverPhoto: { width: 58, height: 58, borderRadius: 6 },
  cardHeroCoverPhoto: { width: '100%', height: 138, borderRadius: 0 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  cardFooterReactionButton: { flexShrink: 0 },
  cardFooterMoodBadges: { maxWidth: 140 },
  cardFooterTagBadges: { flex: 1, maxWidth: '100%' },
  feedCard: { paddingVertical: 0, marginBottom: 0 },
  feedEntrySurface: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  feedCanvas: { position: 'relative', overflow: 'visible' },
  feedTextLayer: { position: 'relative', zIndex: 2 },
  feedTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10 },
  feedTitle: { flex: 1, fontWeight: '700' },
  feedCoverHeader: { minHeight: 168, justifyContent: 'flex-end', overflow: 'hidden' },
  feedCoverHeaderImage: { borderRadius: 0 },
  feedCoverScrim: { ...StyleSheet.absoluteFill, opacity: 0.28 },
  feedCoverContent: { paddingLeft: 20, paddingRight: 78, paddingTop: 42, paddingBottom: 12 },
  feedCoverTitle: { marginBottom: 2 },
  feedContentPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 0, paddingHorizontal: 12, paddingVertical: 12 },
  feedContentPanelMerged: { borderWidth: 0, borderRadius: 0, paddingTop: 10, paddingBottom: 10, paddingHorizontal: 20 },
  feedInlineHeader: { paddingHorizontal: 20 },
  feedFooterMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingVertical: 10 },
  feedReactionButton: { flexShrink: 0 },
  feedMoodBadges: { maxWidth: '100%' },
  feedTagBadges: { flex: 1, maxWidth: '100%' },
  feedDateTime: { flexShrink: 0, fontWeight: '700', marginTop: 2 },
  feedReflectionPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 0, marginTop: 0, marginHorizontal: 0, padding: 12 },
  feedInlineReflections: { marginTop: 0, marginLeft: 0, paddingLeft: 0, borderLeftWidth: 0 },
  feedReflectionInputBox: { marginLeft: 0 },
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
  timelineMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  timelineReactionButton: { flexShrink: 0 },
  timelineMoodBadges: { maxWidth: 140 },
  timelineTagBadges: { flex: 1, maxWidth: '100%' },
  timelineReflectionSection: { marginRight: 0 },
  timelineReflections: { gap: 7, marginTop: 0, marginLeft: 8, paddingLeft: 10, borderLeftWidth: 1 },
  timelineReflectionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  timelineReflectionItem: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  timelineReflectionText: { lineHeight: 20, marginTop: 2 },
  timelineReflectionPhoto: { width: '100%', height: 118, borderRadius: 8, marginTop: 8 },
  timelineReflectionInputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, marginTop: 0, marginLeft: 8, paddingLeft: 12, paddingRight: 4 },
  timelineReflectionInputAfterContent: { marginTop: 10 },
  inlineReflectionPhotoPreview: { marginTop: 8, marginLeft: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, overflow: 'hidden' },
  feedInlineReflectionPhotoPreview: { marginLeft: 0 },
});
