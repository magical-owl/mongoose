import { useState } from 'react';
import { Image, ImageBackground, Keyboard, StyleSheet, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { Text } from '@shared/components/Text';
import { MarkdownText } from '@shared/components/MarkdownText';
import { stripHtml } from '@shared/utils/html';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import type { Profile } from '@/features/profile/domain/Profile';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import { findStickerItem, type PlacedSticker } from '@/features/diary/domain/Sticker';
import { diaryEntryListTitle } from './diaryEntryTypography';
import { formatFriendlyTimestamp } from '@shared/utils/timeFormat';
import { useAppStore } from '@/stores/useAppStore';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import { manualMoodLabel, reflectionCountLabel, useTranslation } from '@/localization/i18n';
import { resolveImportedDiaryPhotoUri } from '@/features/diary/services/DiaryPhotoService';
import {
  DIARY_PHOTO_STICKER_BASE_WIDTH,
  DIARY_PHOTO_STICKER_MAX_HEIGHT,
  DIARY_STICKER_BASE_SIZE,
  getStickerBodyPreviewBottom,
  mapStickerToBodyPreview,
} from '@/features/diary/domain/StickerLayout';

export type DiaryEntryViewMode = 'detailed' | 'timeline' | 'feed';

interface DiaryEntryViewProps {
  readonly entry: DiaryEntry;
  readonly mode: DiaryEntryViewMode;
  readonly profile?: Pick<Profile, 'displayName' | 'avatarUri'> | null;
  readonly onPress: () => void | Promise<void>;
  readonly onAddReflection?: (entryId: string, text: string) => Promise<boolean>;
  readonly onReflectionSummaryPress?: (entryId: string) => void;
  readonly onReflectionInputFocus?: (entryId: string) => void;
}

function CoverPhotoPreview({ entry, style }: { readonly entry: DiaryEntry; readonly style: object }): React.JSX.Element | null {
  if (!entry.coverPhoto) return null;
  return (
    <Image
      source={{ uri: resolveImportedDiaryPhotoUri(entry.coverPhoto.uri) }}
      style={[styles.coverPhoto, style]}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  );
}

function FeedStickerPreview({ sticker, coordinateScale }: { readonly sticker: PlacedSticker; readonly coordinateScale: number }) {
  const isTextSticker = sticker.text !== undefined;
  const stickerItem = sticker.imageUri || isTextSticker ? undefined : findStickerItem(sticker.stickerId);
  if (!isTextSticker && !sticker.imageUri && !stickerItem) return null;
  const photoAspectRatio = sticker.imageWidth && sticker.imageHeight ? sticker.imageWidth / sticker.imageHeight : 1;
  const layout = mapStickerToBodyPreview(sticker, coordinateScale);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.feedSticker,
        {
          left: layout.left,
          top: layout.top,
          zIndex: sticker.behindText ? 1 : sticker.zIndex + 3,
          transform: [{ scale: layout.scale }, { rotate: `${sticker.rotation}deg` }],
        },
      ]}
    >
      {isTextSticker ? (
        <Text
          style={[
            styles.feedTextSticker,
            {
              backgroundColor: sticker.textBackgroundColor ?? '#E5E7EB',
              color: sticker.textColor ?? '#DC2626',
              opacity: sticker.opacity ?? 1,
            },
          ]}
        >
          {sticker.text}
        </Text>
      ) : sticker.imageUri ? (
        <Image source={{ uri: resolveImportedDiaryPhotoUri(sticker.imageUri) }} style={[styles.feedPhotoStickerImage, { aspectRatio: photoAspectRatio }]} resizeMode="cover" />
      ) : stickerItem?.source != null ? (
        <Image source={stickerItem.source} style={styles.feedStickerImage} resizeMode="contain" />
      ) : (
        <Text style={styles.feedStickerEmoji}>{stickerItem?.icon ?? '⭐'}</Text>
      )}
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

function MoodDot({ color }: { readonly color: string }): React.JSX.Element {
  return <View style={[styles.moodDot, { backgroundColor: color }]} />;
}

export function DiaryEntryView({ entry, mode, profile, onPress, onAddReflection, onReflectionSummaryPress, onReflectionInputFocus }: DiaryEntryViewProps): React.JSX.Element {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const timeFormat = useAppStore((state) => state.timeFormat);
  const t = useTranslation();
  const [reflectionText, setReflectionText] = useState('');
  const [isAddingReflection, setIsAddingReflection] = useState(false);
  const [isReflectionFocused, setIsReflectionFocused] = useState(false);
  const [feedCanvasWidth, setFeedCanvasWidth] = useState(0);
  const hasMood = Boolean(entry.manualMood);
  const moodTone = getManualMoodColor(entry.manualMood, theme.colors);
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
  const isFeedMode = mode === 'feed';
  const profileName = profile?.displayName.trim() || t('profileFallbackName');
  const showReflectionSummaryAction = mode !== 'timeline' && Boolean(onReflectionSummaryPress);
  const reflectionSummaryLabel = entry.reflections.length > 0 ? reflectionCountLabel(entry.reflections.length, t) : t('reflectOnThis');
  const editorCanvasWidth = Math.max(1, windowWidth - theme.spacing.lg * 2);
  const measuredFeedCanvasWidth = feedCanvasWidth > 0 ? feedCanvasWidth : editorCanvasWidth;
  const feedCoordinateScale = Math.min(1, measuredFeedCanvasWidth / editorCanvasWidth);

  const handleAddInlineReflection = async () => {
    const trimmed = reflectionText.trim();
    if (!trimmed || !onAddReflection) return;
    setIsAddingReflection(true);
    const saved = await onAddReflection(entry.id, trimmed);
    if (saved) setReflectionText('');
    setIsAddingReflection(false);
  };
  const feedStickerCanvasHeight = entry.stickers.length > 0
    ? Math.max(
        0,
        ...entry.stickers.map((sticker) => (
          getStickerBodyPreviewBottom(sticker, feedCoordinateScale)
        )),
      )
    : 0;

  const hasInlineReflectionContent = entry.reflections.length > 0 || Boolean(onAddReflection);
  const inlineReflectionSection = hasInlineReflectionContent ? (
    <View
      style={[
        isFeedMode && styles.feedReflectionPanel,
        isFeedMode && { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
      testID={isFeedMode ? 'entry-feed-reflection-panel' : undefined}
    >
      {isFeedMode ? (
        <Text preset="caption" color="textSecondary" style={styles.feedSectionLabel}>
          {t('reflections')}
        </Text>
      ) : null}
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
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {onAddReflection ? (
        <View
          style={[
            styles.timelineReflectionInputBox,
            isFeedMode && styles.feedReflectionInputBox,
            {
              minHeight: Math.max(42, theme.fontSizes.sm * 2.9),
              borderColor: isReflectionFocused ? theme.colors.tint : theme.colors.border,
              backgroundColor: isFeedMode ? theme.colors.surface : theme.colors.card,
            },
          ]}
          testID={isFeedMode ? 'entry-feed-reflection-input' : undefined}
        >
          <TextInput
            value={reflectionText}
            onChangeText={setReflectionText}
            placeholder={t('addReflectionPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.timelineReflectionInput,
              {
                height: Math.max(36, theme.fontSizes.sm * 2.5),
                color: theme.colors.text,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSizes.sm,
                lineHeight: theme.fontSizes.sm * 1.35,
              },
            ]}
            returnKeyType="send"
            onSubmitEditing={() => { void handleAddInlineReflection(); }}
            onFocus={() => {
              setIsReflectionFocused(true);
              onReflectionInputFocus?.(entry.id);
            }}
            onBlur={() => setIsReflectionFocused(false)}
            accessibilityLabel={t('reflectionAddA11y')}
          />
          {isReflectionFocused ? (
            <IconCircleButton
              icon="chevron-down"
              onPress={Keyboard.dismiss}
              accessibilityLabel={t('entryDismissKeyboardA11y')}
              size="sm"
              surface="transparent"
              iconSize={18}
              style={styles.timelineReflectionIconButton}
            />
          ) : null}
          <IconCircleButton
            icon="plus"
            onPress={() => { void handleAddInlineReflection(); }}
            disabled={!reflectionText.trim() || isAddingReflection}
            accessibilityLabel={t('reflectionSaveA11y')}
            active={Boolean(reflectionText.trim()) && !isAddingReflection}
            size="sm"
            surface={reflectionText.trim() && !isAddingReflection ? 'surface' : 'transparent'}
            iconSize={18}
            style={styles.timelineReflectionIconButton}
          />
        </View>
      ) : null}
    </View>
  ) : null;

  if (mode === 'feed') {
    const feedMetaContent = (
      <View style={entry.coverPhoto ? styles.feedCoverMetaRow : styles.feedMetaRow}>
        <View style={styles.feedMetaLeft}>
          {hasMood && entry.manualMood ? entry.coverPhoto ? (
            <View style={[styles.entryMoodMeta, styles.feedCoverMoodMeta]} testID="entry-feed-cover-mood">
              <MoodDot color={moodTone} />
              <Text preset="caption" style={[styles.entryMoodText, { color: theme.colors.stickerControlText }]} numberOfLines={1}>
                {manualMoodLabel(entry.manualMood, t)}
              </Text>
            </View>
          ) : (
            <View style={styles.entryMoodMeta} testID="entry-feed-mood">
              <MoodDot color={moodTone} />
              <Text preset="caption" style={[styles.entryMoodText, { color: moodTone }]} numberOfLines={1}>
                {manualMoodLabel(entry.manualMood, t)}
              </Text>
            </View>
          ) : null}
          {entry.tags.map((tag) => (
            <Text
              key={tag}
              preset="caption"
              color={entry.coverPhoto ? undefined : 'textSecondary'}
              style={entry.coverPhoto ? [styles.feedCoverMetaText, { color: theme.colors.stickerControlText }] : undefined}
            >
              #{tag}
            </Text>
          ))}
          {showReflectionSummaryAction ? (
            <Text
              preset="caption"
              color={entry.coverPhoto ? undefined : 'tint'}
              style={[
                styles.reflectionSummary,
                entry.coverPhoto && styles.feedCoverMetaText,
                entry.coverPhoto && { color: theme.colors.stickerControlText },
              ]}
              onPress={() => onReflectionSummaryPress?.(entry.id)}
            >
              {reflectionSummaryLabel}
            </Text>
          ) : null}
        </View>
      </View>
    );
    const feedAuthorRow = (
      <View style={[styles.feedAuthorRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]} testID="entry-feed-author-row">
        <ProfileAvatar
          profile={profile}
          size={32}
          accessibilityLabel={t('profileAvatarA11y')}
          testID="entry-feed-author-avatar"
        />
        <View style={styles.feedAuthorCopy}>
          <Text preset="bodySmall" color="text" style={styles.feedAuthorName} numberOfLines={1}>
            {profileName}
          </Text>
          {feedEntryDateTime ? (
            <Text preset="caption" color="textTertiary" numberOfLines={1}>
              {feedEntryDateTime}
            </Text>
          ) : null}
        </View>
      </View>
    );

    return (
      <View style={styles.feedCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
        >
          {entry.coverPhoto ? (
            <ImageBackground
              source={{ uri: resolveImportedDiaryPhotoUri(entry.coverPhoto.uri) }}
              style={styles.feedCoverHeader}
              imageStyle={styles.feedCoverHeaderImage}
              resizeMode="cover"
            >
              <View style={[styles.feedCoverScrim, { backgroundColor: theme.colors.overlay }]} />
              <View style={[styles.feedCoverBottomScrim, { backgroundColor: theme.colors.background }]} testID="entry-feed-cover-bottom-scrim" />
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
                {feedMetaContent}
              </View>
            </ImageBackground>
          ) : null}
          {entry.coverPhoto ? feedAuthorRow : null}
          <View
            onLayout={(event) => setFeedCanvasWidth(event.nativeEvent.layout.width)}
            style={[
              styles.feedCanvas,
              feedStickerCanvasHeight > 0 && { minHeight: feedStickerCanvasHeight },
            ]}
          >
            {entry.stickers.map((sticker) => (
              <FeedStickerPreview key={sticker.id} sticker={sticker} coordinateScale={feedCoordinateScale} />
            ))}
            <View style={styles.feedTextLayer}>
              {entry.coverPhoto ? null : (
                <>
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
                  {feedMetaContent}
                  {feedAuthorRow}
                </>
              )}
              <View style={[styles.feedContentPanel, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} testID="entry-feed-content-panel">
                <MarkdownText style={[styles.feedContent, { color: theme.colors.textSecondary }]}>{entry.content}</MarkdownText>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        {inlineReflectionSection}
      </View>
    );
  }

  if (mode === 'timeline') {
    return (
      <View style={styles.timelineEntry} testID="entry-timeline">
        <View style={[styles.timelineSpine, { backgroundColor: theme.colors.border }]} testID="entry-timeline-spine" />
        <View style={[styles.timelineDot, { backgroundColor: hasMood ? moodTone : theme.colors.tint, borderColor: theme.colors.background }]} testID="entry-timeline-dot" />
        <View style={styles.timelineBody}>
          <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.timelinePressArea}>
            <View style={styles.timelineHeader}>
              <View style={styles.timelineTitleGroup}>
                <ProfileAvatar profile={profile} size={22} accessibilityLabel={t('profileAvatarA11y')} testID="entry-timeline-avatar" />
                <Text style={[styles.timelineTitle, { color: theme.colors.text }]} numberOfLines={1}>{entry.title}</Text>
              </View>
              <View style={styles.timelineActions}>
                {hasMood && entry.manualMood ? (
                  <View style={styles.entryMoodMeta} testID="entry-timeline-mood">
                    <MoodDot color={moodTone} />
                    <Text preset="caption" style={[styles.entryMoodText, { color: moodTone }]} numberOfLines={1}>{manualMoodLabel(entry.manualMood, t)}</Text>
                  </View>
                ) : null}
                {entryTime ? <Text preset="caption" color="textTertiary" numberOfLines={1} style={styles.timelineTime}>{entryTime}</Text> : null}
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </View>
            </View>
            <View style={styles.timelinePreviewRow}>
              <View style={styles.timelineTextPreview}>
                <Text style={[styles.timelineContent, { color: theme.colors.textSecondary }]} numberOfLines={entry.coverPhoto ? 2 : 3}>{stripHtml(entry.content)}</Text>
                {entry.tags.length > 0 && (
                  <View style={styles.timelineMetaRow}>
                    <Text preset="caption" color="textSecondary" numberOfLines={1} style={styles.timelineTags}>{entry.tags.map((tag) => `#${tag}`).join('  ')}</Text>
                  </View>
                )}
              </View>
              <CoverPhotoPreview entry={entry} style={styles.timelineCoverPhoto} />
            </View>
          </TouchableOpacity>
          {inlineReflectionSection}
        </View>
      </View>
    );
  }

  const cardDate = formatCardDay(entry.date);
  const cardMeta = (
    <View style={styles.cardMetaRow}>
      {hasMood && entry.manualMood ? (
        <View style={styles.entryMoodMeta} testID="entry-card-mood">
          <MoodDot color={moodTone} />
          <Text preset="caption" style={[styles.entryMoodText, { color: moodTone }]} numberOfLines={1}>
            {manualMoodLabel(entry.manualMood, t)}
          </Text>
        </View>
      ) : null}
      {entryTime ? <Text preset="caption" color="textTertiary" numberOfLines={1} style={styles.cardTime}>{entryTime}</Text> : null}
    </View>
  );
  const cardFooterContent = entry.tags.length > 0 || showReflectionSummaryAction ? (
    <View style={styles.cardFooter}>
      {entry.tags.length > 0 ? (
        <Text preset="caption" color="textSecondary" numberOfLines={1} style={styles.cardTags}>#{entry.tags.join(' #')}</Text>
      ) : null}
      {showReflectionSummaryAction ? (
        <TouchableOpacity
          onPress={() => onReflectionSummaryPress?.(entry.id)}
          activeOpacity={0.65}
          style={[styles.reflectionSummaryButton, { backgroundColor: theme.colors.tint + '12' }]}
          accessibilityRole="button"
          accessibilityLabel={reflectionSummaryLabel}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.colors.tint} />
          <Text preset="caption" color="tint" style={styles.reflectionSummary} numberOfLines={1}>
            {reflectionSummaryLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  ) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      testID="entry-card"
    >
      {entry.coverPhoto ? <CoverPhotoPreview entry={entry} style={styles.cardHeroCoverPhoto} /> : null}
      <View style={styles.cardInner}>
        <View style={[styles.cardRail, { backgroundColor: hasMood ? moodTone : theme.colors.tint }]} />
        <View style={styles.cardDateColumn}>
          <Text preset="caption" color="textSecondary" style={styles.cardWeekday}>{cardDate.weekday}</Text>
          <Text style={[styles.cardDay, { color: theme.colors.text }]}>{cardDate.day}</Text>
        </View>
        <View style={styles.cardContentColumn}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleBlock}>
              <View style={styles.cardTitleRow}>
                <ProfileAvatar profile={profile} size={22} accessibilityLabel={t('profileAvatarA11y')} testID="entry-card-avatar" />
                <Text preset="h3" color="text" style={styles.title} numberOfLines={1}>{entry.title}</Text>
              </View>
              {cardMeta}
            </View>
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
  card: { borderWidth: 1, borderRadius: 8, marginBottom: 14, overflow: 'hidden' },
  cardInner: { flexDirection: 'row' },
  cardRail: { width: 4 },
  cardDateColumn: { width: 66, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  cardWeekday: { fontWeight: '600' },
  cardDay: { fontSize: 34, lineHeight: 40, fontWeight: '300', marginTop: 2 },
  cardTime: { flexShrink: 0, fontSize: 11, lineHeight: 14 },
  cardContentColumn: { flex: 1, paddingLeft: 0, paddingRight: 14, paddingVertical: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardMetaRow: { minHeight: 18, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  entryMoodMeta: { maxWidth: 112, flexDirection: 'row', alignItems: 'center', gap: 5 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  entryMoodText: { flexShrink: 1, fontSize: 11, lineHeight: 14, fontWeight: '700' },
  title: { flex: 1 },
  content: { fontSize: 16, lineHeight: 22 },
  coverPhoto: { backgroundColor: '#000' },
  cardPreviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTextPreview: { flex: 1, minWidth: 0 },
  cardCoverPhoto: { width: 58, height: 58, borderRadius: 6 },
  cardHeroCoverPhoto: { width: '100%', height: 138, borderRadius: 0 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  cardTags: { flex: 1 },
  reflectionSummaryButton: { minHeight: 28, maxWidth: 142, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, paddingHorizontal: 9 },
  reflectionSummary: { flexShrink: 0, fontWeight: '700' },
  feedCard: { padding: 16, marginBottom: 18 },
  feedCanvas: { position: 'relative', overflow: 'visible' },
  feedTextLayer: { position: 'relative', zIndex: 2 },
  feedSticker: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  feedStickerImage: { width: DIARY_STICKER_BASE_SIZE, height: DIARY_STICKER_BASE_SIZE },
  feedPhotoStickerImage: { width: DIARY_PHOTO_STICKER_BASE_WIDTH, maxHeight: DIARY_PHOTO_STICKER_MAX_HEIGHT, borderRadius: 8 },
  feedTextSticker: { minWidth: 120, maxWidth: 220, color: '#111827', fontSize: 24, lineHeight: 30, fontWeight: '700', textAlign: 'center' },
  feedStickerEmoji: { fontSize: 48, lineHeight: 60, includeFontPadding: true, textAlign: 'center' },
  feedTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10 },
  feedTitle: { flex: 1, fontWeight: '700' },
  feedCoverHeader: { minHeight: 168, justifyContent: 'flex-end', marginBottom: 12, overflow: 'hidden' },
  feedCoverHeaderImage: { borderRadius: 8 },
  feedCoverScrim: { ...StyleSheet.absoluteFill, borderRadius: 8, opacity: 0.46 },
  feedCoverBottomScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '72%', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, opacity: 0.56 },
  feedCoverContent: { paddingHorizontal: 14, paddingTop: 42, paddingBottom: 12 },
  feedCoverTitle: { marginBottom: 10 },
  feedCoverMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  feedCoverMetaText: { fontWeight: '700' },
  feedCoverMoodMeta: { maxWidth: 112 },
  feedAuthorRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 },
  feedAuthorCopy: { flex: 1, minWidth: 0 },
  feedAuthorName: { fontWeight: '800' },
  feedContent: { fontSize: 16, lineHeight: 24 },
  feedContentPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  feedMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  feedMetaLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  feedSectionLabel: { marginBottom: 8, fontWeight: '800', textTransform: 'uppercase' },
  feedReflectionPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, marginTop: 14, padding: 12 },
  feedInlineReflections: { marginTop: 0, marginLeft: 0, paddingLeft: 12 },
  feedReflectionInputBox: { marginLeft: 0 },
  timelineEntry: { position: 'relative', minHeight: 82, marginBottom: 18, paddingLeft: 22 },
  timelineSpine: { position: 'absolute', top: 0, bottom: -18, left: 6, width: 1 },
  timelineDot: { position: 'absolute', top: 13, left: 1, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  timelineBody: { flex: 1, paddingVertical: 5 },
  timelinePressArea: { marginBottom: 2 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  timelineTitleGroup: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7 },
  timelineTitle: { ...diaryEntryListTitle, flex: 1 },
  timelineTime: { flexShrink: 0, fontSize: 11, lineHeight: 14 },
  timelineActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timelinePreviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timelineTextPreview: { flex: 1, minWidth: 0 },
  timelineCoverPhoto: { width: 62, height: 48, borderRadius: 6 },
  timelineContent: { fontSize: 14, lineHeight: 20, marginBottom: 5 },
  timelineMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineTags: { flex: 1 },
  timelineReflections: { gap: 7, marginTop: 8, marginLeft: 8, paddingLeft: 10, borderLeftWidth: 1 },
  timelineReflectionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  timelineReflectionItem: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  timelineReflectionText: { lineHeight: 20, marginTop: 2 },
  timelineReflectionInputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, marginTop: 12, marginLeft: 8, paddingLeft: 12, paddingRight: 4 },
  timelineReflectionInput: { flex: 1, paddingVertical: 0, paddingTop: 0, paddingBottom: 0, includeFontPadding: false, textAlignVertical: 'center' },
  timelineReflectionIconButton: { width: 32, height: 32 },
});
