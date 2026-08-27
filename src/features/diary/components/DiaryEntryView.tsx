import { useState } from 'react';
import { Image, ImageBackground, Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { MarkdownText } from '@shared/components/MarkdownText';
import { stripHtml } from '@shared/utils/html';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { findStickerItem, type PlacedSticker } from '@/features/diary/domain/Sticker';
import { diaryEntryListTitle } from './diaryEntryTypography';
import { formatDisplayMonthDayTime, formatDisplayTime } from '@shared/utils/timeFormat';
import { useAppStore } from '@/stores/useAppStore';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import { manualMoodLabel, reflectionCountLabel, useTranslation } from '@/localization/i18n';
import { resolveImportedDiaryPhotoUri } from '@/features/diary/services/DiaryPhotoService';

export type DiaryEntryViewMode = 'detailed' | 'timeline' | 'feed';

interface DiaryEntryViewProps {
  readonly entry: DiaryEntry;
  readonly mode: DiaryEntryViewMode;
  readonly onPress: () => void | Promise<void>;
  readonly onAddReflection?: (entryId: string, text: string) => Promise<boolean>;
  readonly onReflectionSummaryPress?: (entryId: string) => void;
  readonly onReflectionInputFocus?: (entryId: string) => void;
}

const FEED_STICKER_ORIGIN_X = 36;
const FEED_STICKER_ORIGIN_Y = 170;
const FEED_STICKER_SIZE = 80;
const FEED_PHOTO_WIDTH = 148;
const FEED_PHOTO_MAX_HEIGHT = 190;

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

function getFeedStickerHeight(sticker: PlacedSticker): number {
  if (sticker.text !== undefined) return 54;
  if (!sticker.imageUri) return FEED_STICKER_SIZE;
  const aspectRatio = sticker.imageWidth && sticker.imageHeight ? sticker.imageWidth / sticker.imageHeight : 1;
  return Math.min(FEED_PHOTO_MAX_HEIGHT, FEED_PHOTO_WIDTH / aspectRatio);
}

function FeedStickerPreview({ sticker }: { readonly sticker: PlacedSticker }) {
  const isTextSticker = sticker.text !== undefined;
  const stickerItem = sticker.imageUri || isTextSticker ? undefined : findStickerItem(sticker.stickerId);
  if (!isTextSticker && !sticker.imageUri && !stickerItem) return null;
  const photoAspectRatio = sticker.imageWidth && sticker.imageHeight ? sticker.imageWidth / sticker.imageHeight : 1;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.feedSticker,
        {
          left: sticker.x - FEED_STICKER_ORIGIN_X,
          top: sticker.y - FEED_STICKER_ORIGIN_Y,
          zIndex: sticker.behindText ? 1 : sticker.zIndex + 3,
          transform: [{ scale: sticker.scale }, { rotate: `${sticker.rotation}deg` }],
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

export function DiaryEntryView({ entry, mode, onPress, onAddReflection, onReflectionSummaryPress, onReflectionInputFocus }: DiaryEntryViewProps): React.JSX.Element {
  const theme = useTheme();
  const timeFormat = useAppStore((state) => state.timeFormat);
  const t = useTranslation();
  const [reflectionText, setReflectionText] = useState('');
  const [isAddingReflection, setIsAddingReflection] = useState(false);
  const [isReflectionFocused, setIsReflectionFocused] = useState(false);
  const hasMood = Boolean(entry.manualMood);
  const moodTone = getManualMoodColor(entry.manualMood, theme.colors);
  const entryTime = formatDisplayTime(entry.createdAt, timeFormat);
  const feedEntryDateTime = formatDisplayMonthDayTime(entry.createdAt, timeFormat);
  const showReflectionSummaryAction = mode !== 'timeline' && Boolean(onReflectionSummaryPress);
  const reflectionSummaryLabel = entry.reflections.length > 0 ? reflectionCountLabel(entry.reflections.length, t) : t('reflectOnThis');

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
          sticker.y - FEED_STICKER_ORIGIN_Y + getFeedStickerHeight(sticker) * sticker.scale
        )),
      )
    : 0;

  const inlineReflectionSection = (
    <>
      {entry.reflections.length > 0 ? (
        <View style={styles.timelineReflections}>
          {entry.reflections.map((reflection) => (
            <View key={reflection.id} style={styles.timelineReflectionItem}>
              <Text preset="caption" color="textTertiary" numberOfLines={1}>
                {formatDisplayMonthDayTime(reflection.createdAt, timeFormat)}
              </Text>
              <Text preset="bodySmall" color="text" style={styles.timelineReflectionText}>{reflection.text}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {onAddReflection ? (
        <View style={[styles.timelineReflectionInputBox, { minHeight: Math.max(38, theme.fontSizes.sm * 2.7), borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
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
            <TouchableOpacity
              onPress={Keyboard.dismiss}
              style={styles.timelineReflectionButton}
              accessibilityRole="button"
              accessibilityLabel={t('entryDismissKeyboardA11y')}
            >
              <Ionicons name="chevron-down" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => { void handleAddInlineReflection(); }}
            disabled={!reflectionText.trim() || isAddingReflection}
            style={[styles.timelineReflectionButton, { backgroundColor: reflectionText.trim() && !isAddingReflection ? theme.colors.tint : 'transparent' }]}
            accessibilityRole="button"
            accessibilityLabel={t('reflectionSaveA11y')}
          >
            <Ionicons name="add" size={18} color={reflectionText.trim() && !isAddingReflection ? '#fff' : theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );

  if (mode === 'feed') {
    const feedMetaContent = (
      <View style={entry.coverPhoto ? styles.feedCoverMetaRow : styles.feedMetaRow}>
        <View style={styles.feedMetaLeft}>
          {hasMood && entry.manualMood ? (
            <View style={[styles.feedMoodBadge, entry.coverPhoto && styles.feedCoverMoodBadge, { backgroundColor: entry.coverPhoto ? moodTone + '80' : moodTone + '18', borderColor: entry.coverPhoto ? moodTone + 'CC' : moodTone }]}>
              <Text preset="caption" style={[styles.feedMoodBadgeText, { color: entry.coverPhoto ? '#fff' : moodTone }]} numberOfLines={1}>
                {manualMoodLabel(entry.manualMood, t)}
              </Text>
            </View>
          ) : null}
          {entry.tags.map((tag) => (
            <Text key={tag} preset="caption" color={entry.coverPhoto ? undefined : 'textSecondary'} style={entry.coverPhoto ? styles.feedCoverMetaText : undefined}>
              #{tag}
            </Text>
          ))}
          {showReflectionSummaryAction ? (
            <Text
              preset="caption"
              color={entry.coverPhoto ? undefined : 'tint'}
              style={[styles.reflectionSummary, entry.coverPhoto && styles.feedCoverMetaText]}
              onPress={() => onReflectionSummaryPress?.(entry.id)}
            >
              {reflectionSummaryLabel}
            </Text>
          ) : null}
        </View>
        {feedEntryDateTime ? <Text preset="caption" color={entry.coverPhoto ? undefined : 'textTertiary'} numberOfLines={1} style={[styles.feedTime, entry.coverPhoto && styles.feedCoverMetaText]}>{feedEntryDateTime}</Text> : null}
      </View>
    );

    return (
      <View style={styles.feedCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={[
            styles.feedCanvas,
            feedStickerCanvasHeight > 0 && { minHeight: feedStickerCanvasHeight },
          ]}
        >
          {entry.stickers.map((sticker) => <FeedStickerPreview key={sticker.id} sticker={sticker} />)}
          <View style={styles.feedTextLayer}>
            {entry.coverPhoto ? (
              <ImageBackground
                source={{ uri: resolveImportedDiaryPhotoUri(entry.coverPhoto.uri) }}
                style={styles.feedCoverHeader}
                imageStyle={styles.feedCoverHeaderImage}
                resizeMode="cover"
              >
                <View style={styles.feedCoverScrim} />
                <View style={styles.feedCoverContent}>
                  <Text
                    style={[
                      styles.feedTitle,
                      styles.feedCoverTitle,
                      {
                        fontSize: theme.fontSizes.xxxl,
                        lineHeight: theme.fontSizes.xxxl * 1.25,
                      },
                    ]}
                    numberOfLines={3}
                  >
                    {entry.title}
                  </Text>
                  {feedMetaContent}
                </View>
              </ImageBackground>
            ) : (
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
              </>
            )}
            <MarkdownText style={[styles.feedContent, { color: theme.colors.textSecondary }]}>{entry.content}</MarkdownText>
          </View>
        </TouchableOpacity>
        {inlineReflectionSection}
      </View>
    );
  }

  if (mode === 'timeline') {
    return (
      <View style={styles.timelineEntry}>
        <View style={styles.timelineBody}>
          <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.timelinePressArea}>
            <View style={styles.timelineHeader}>
              <Text style={[styles.timelineTitle, { color: theme.colors.text }]} numberOfLines={1}>{entry.title}</Text>
              <View style={styles.timelineActions}>
                {hasMood && entry.manualMood ? (
                  <View style={[styles.compactMoodBadge, { backgroundColor: moodTone + '18', borderColor: moodTone }]}>
                    <Text preset="caption" style={[styles.compactMoodBadgeText, { color: moodTone }]} numberOfLines={1}>{manualMoodLabel(entry.manualMood, t)}</Text>
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

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={[styles.cardRail, { backgroundColor: hasMood ? moodTone : theme.colors.tint }]} />
      <View style={styles.cardDateColumn}>
        <Text preset="caption" color="textSecondary" style={styles.cardWeekday}>{cardDate.weekday}</Text>
        <Text style={[styles.cardDay, { color: theme.colors.text }]}>{cardDate.day}</Text>
      </View>
      <View style={styles.cardContentColumn}>
        <View style={styles.cardHeader}>
          <Text preset="h3" color="text" style={styles.title} numberOfLines={1}>{entry.title}</Text>
          {hasMood && entry.manualMood ? (
            <View style={[styles.compactMoodBadge, { backgroundColor: moodTone + '18', borderColor: moodTone }]}>
              <Text preset="caption" style={[styles.compactMoodBadgeText, { color: moodTone }]} numberOfLines={1}>{manualMoodLabel(entry.manualMood, t)}</Text>
            </View>
          ) : null}
          {entryTime ? <Text preset="caption" color="textTertiary" numberOfLines={1} style={styles.cardTime}>{entryTime}</Text> : null}
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.cardPreviewRow}>
          <View style={styles.cardTextPreview}>
            <Text style={[styles.content, { color: theme.colors.textSecondary }]} numberOfLines={entry.coverPhoto ? 2 : 3}>{stripHtml(entry.content)}</Text>
            {entry.tags.length > 0 || showReflectionSummaryAction ? (
              <View style={styles.cardFooter}>
                {entry.tags.length > 0 ? (
                  <Text preset="caption" color="textSecondary" numberOfLines={1}>#{entry.tags.join(' #')}</Text>
                ) : null}
                {showReflectionSummaryAction ? (
                  <Text
                    preset="caption"
                    color="tint"
                    style={styles.reflectionSummary}
                    numberOfLines={1}
                    onPress={() => onReflectionSummaryPress?.(entry.id)}
                  >
                    {reflectionSummaryLabel}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
          <CoverPhotoPreview entry={entry} style={styles.cardCoverPhoto} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderWidth: 1, borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  cardRail: { width: 4 },
  cardDateColumn: { width: 66, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  cardWeekday: { fontWeight: '600' },
  cardDay: { fontSize: 34, lineHeight: 40, fontWeight: '300', marginTop: 2 },
  cardTime: { flexShrink: 0, fontSize: 11, lineHeight: 14 },
  cardContentColumn: { flex: 1, paddingLeft: 0, paddingRight: 14, paddingVertical: 7 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  title: { flex: 1 },
  compactMoodBadge: { maxWidth: 86, minHeight: 16, borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  compactMoodBadgeText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
  content: { fontSize: 16, lineHeight: 22 },
  coverPhoto: { backgroundColor: '#000' },
  cardPreviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTextPreview: { flex: 1, minWidth: 0 },
  cardCoverPhoto: { width: 58, height: 58, borderRadius: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  reflectionSummary: { flexShrink: 0, fontWeight: '700' },
  feedCard: { padding: 16, marginBottom: 14 },
  feedCanvas: { position: 'relative', overflow: 'visible' },
  feedTextLayer: { position: 'relative', zIndex: 2 },
  feedSticker: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  feedStickerImage: { width: 80, height: 80 },
  feedPhotoStickerImage: { width: 148, maxHeight: 190, borderRadius: 8 },
  feedTextSticker: { minWidth: 120, maxWidth: 220, color: '#111827', fontSize: 24, lineHeight: 30, fontWeight: '700', textAlign: 'center' },
  feedStickerEmoji: { fontSize: 48, lineHeight: 60, includeFontPadding: true, textAlign: 'center' },
  feedTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10 },
  feedTitle: { flex: 1, fontWeight: '700' },
  feedCoverHeader: { minHeight: 168, justifyContent: 'flex-end', marginBottom: 12, overflow: 'hidden' },
  feedCoverHeaderImage: { borderRadius: 8 },
  feedCoverScrim: { ...StyleSheet.absoluteFill, borderRadius: 8, backgroundColor: 'rgba(0, 0, 0, 0.34)' },
  feedCoverContent: { paddingHorizontal: 14, paddingTop: 42, paddingBottom: 12 },
  feedCoverTitle: { color: '#fff', marginBottom: 10 },
  feedCoverMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  feedCoverMetaText: { color: '#fff', fontWeight: '700' },
  feedMoodBadge: { maxWidth: 86, minHeight: 16, borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  feedCoverMoodBadge: { backgroundColor: 'rgba(0, 0, 0, 0.42)' },
  feedMoodBadgeText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
  feedTime: { flexShrink: 0, fontSize: 11, lineHeight: 14 },
  feedContent: { fontSize: 16, lineHeight: 24 },
  feedMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  feedMetaLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  timelineEntry: { minHeight: 76, marginBottom: 12 },
  timelineBody: { flex: 1, paddingVertical: 4 },
  timelinePressArea: { marginBottom: 2 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  timelineTitle: { ...diaryEntryListTitle, flex: 1 },
  timelineTime: { flexShrink: 0, fontSize: 11, lineHeight: 14 },
  timelineActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timelinePreviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timelineTextPreview: { flex: 1, minWidth: 0 },
  timelineCoverPhoto: { width: 62, height: 48, borderRadius: 6 },
  timelineContent: { fontSize: 14, lineHeight: 20, marginBottom: 5 },
  timelineMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineTags: { flex: 1 },
  timelineReflections: { gap: 6, marginTop: 4 },
  timelineReflectionItem: { paddingVertical: 1 },
  timelineReflectionText: { lineHeight: 20, marginTop: 2 },
  timelineReflectionInputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, marginTop: 10, paddingLeft: 10, paddingRight: 4 },
  timelineReflectionInput: { flex: 1, paddingVertical: 0, paddingTop: 0, paddingBottom: 0, includeFontPadding: false, textAlignVertical: 'center' },
  timelineReflectionButton: { width: 30, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});
