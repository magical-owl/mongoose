import { useState } from 'react';
import { Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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

export type DiaryEntryViewMode = 'detailed' | 'timeline' | 'feed';

interface DiaryEntryViewProps {
  readonly entry: DiaryEntry;
  readonly mode: DiaryEntryViewMode;
  readonly onPress: () => void | Promise<void>;
  readonly onAddReflection?: (entryId: string, text: string) => Promise<boolean>;
  readonly onReflectionSummaryPress?: (entryId: string) => void;
}

const FEED_STICKER_ORIGIN_X = 36;
const FEED_STICKER_ORIGIN_Y = 90;

function FeedStickerPreview({ sticker }: { readonly sticker: PlacedSticker }) {
  const stickerItem = findStickerItem(sticker.stickerId);
  if (!stickerItem) return null;

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
      {stickerItem.source != null ? (
        <Image source={stickerItem.source} style={styles.feedStickerImage} resizeMode="contain" />
      ) : (
        <Text style={styles.feedStickerEmoji}>{stickerItem.icon ?? '⭐'}</Text>
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

export function DiaryEntryView({ entry, mode, onPress, onAddReflection, onReflectionSummaryPress }: DiaryEntryViewProps): React.JSX.Element {
  const theme = useTheme();
  const timeFormat = useAppStore((state) => state.timeFormat);
  const t = useTranslation();
  const [reflectionText, setReflectionText] = useState('');
  const [isAddingReflection, setIsAddingReflection] = useState(false);
  const hasMood = Boolean(entry.manualMood);
  const moodTone = getManualMoodColor(entry.manualMood, theme.colors);

  const handleAddTimelineReflection = async () => {
    const trimmed = reflectionText.trim();
    if (!trimmed || !onAddReflection) return;
    setIsAddingReflection(true);
    const saved = await onAddReflection(entry.id, trimmed);
    if (saved) setReflectionText('');
    setIsAddingReflection(false);
  };

  if (mode === 'feed') {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.feedCard}>
        <View
          style={[
            styles.feedCanvas,
            { minHeight: Math.max(220, ...entry.stickers.map((sticker) => sticker.y - FEED_STICKER_ORIGIN_Y + 80 * sticker.scale)) },
          ]}
        >
          {entry.stickers.map((sticker) => <FeedStickerPreview key={sticker.id} sticker={sticker} />)}
          <View style={styles.feedTextLayer}>
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
            <View style={styles.feedMetaRow}>
              {hasMood && entry.manualMood ? (
                <View style={[styles.feedMoodBadge, { backgroundColor: moodTone + '18', borderColor: moodTone }]}>
                  <Text preset="caption" style={[styles.feedMoodBadgeText, { color: moodTone }]} numberOfLines={1}>
                    {manualMoodLabel(entry.manualMood, t)}
                  </Text>
                </View>
              ) : null}
              {entry.tags.map((tag) => <Text key={tag} preset="caption" color="textSecondary">#{tag}</Text>)}
              {entry.reflections.length > 0 ? (
                <Text
                  preset="caption"
                  color="tint"
                  style={styles.reflectionSummary}
                  onPress={() => onReflectionSummaryPress?.(entry.id)}
                >
                  {reflectionCountLabel(entry.reflections.length, t)}
                </Text>
              ) : null}
            </View>
            <MarkdownText style={[styles.feedContent, { color: theme.colors.textSecondary }]}>{entry.content}</MarkdownText>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (mode === 'timeline') {
    return (
      <View style={styles.timelineEntry}>
        <View style={[styles.timelineRail, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.timelineDot, { backgroundColor: hasMood ? moodTone : theme.colors.tint }]} />
        </View>
        <View style={styles.timelineBody}>
          <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.timelinePressArea}>
            <View style={styles.timelineHeader}>
              <Text style={[styles.timelineTitle, { color: theme.colors.text }]} numberOfLines={1}>{entry.title}</Text>
              <Text preset="caption" color="textTertiary" numberOfLines={1} style={styles.timelineTime}>{formatDisplayTime(entry.createdAt, timeFormat)}</Text>
              <View style={styles.timelineActions}>
                {hasMood && entry.manualMood ? (
                  <View style={[styles.compactMoodBadge, { backgroundColor: moodTone + '18', borderColor: moodTone }]}>
                    <Text preset="caption" style={[styles.compactMoodBadgeText, { color: moodTone }]} numberOfLines={1}>{manualMoodLabel(entry.manualMood, t)}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </View>
            </View>
            <Text style={[styles.timelineContent, { color: theme.colors.textSecondary }]} numberOfLines={3}>{stripHtml(entry.content)}</Text>
            {entry.tags.length > 0 && (
              <View style={styles.timelineMetaRow}>
                <Text preset="caption" color="textSecondary" numberOfLines={1} style={styles.timelineTags}>{entry.tags.map((tag) => `#${tag}`).join('  ')}</Text>
              </View>
            )}
          </TouchableOpacity>
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
                onSubmitEditing={() => { void handleAddTimelineReflection(); }}
                accessibilityLabel={t('reflectionAddA11y')}
              />
              <TouchableOpacity
                onPress={() => { void handleAddTimelineReflection(); }}
                disabled={!reflectionText.trim() || isAddingReflection}
                style={[styles.timelineReflectionButton, { backgroundColor: reflectionText.trim() && !isAddingReflection ? theme.colors.tint : 'transparent' }]}
                accessibilityRole="button"
                accessibilityLabel={t('reflectionSaveA11y')}
              >
                <Ionicons name="add" size={18} color={reflectionText.trim() && !isAddingReflection ? '#fff' : theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  const cardDate = formatCardDay(entry.date);
  const cardTime = formatDisplayTime(entry.createdAt, timeFormat);

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
          {cardTime ? <Text preset="caption" color="textTertiary" numberOfLines={1} style={styles.cardTime}>{cardTime}</Text> : null}
          {hasMood && entry.manualMood ? (
            <View style={[styles.compactMoodBadge, { backgroundColor: moodTone + '18', borderColor: moodTone }]}>
              <Text preset="caption" style={[styles.compactMoodBadgeText, { color: moodTone }]} numberOfLines={1}>{manualMoodLabel(entry.manualMood, t)}</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </View>
        <Text style={[styles.content, { color: theme.colors.textSecondary }]} numberOfLines={3}>{stripHtml(entry.content)}</Text>
        {entry.tags.length > 0 ? (
          <View style={styles.cardFooter}>
            <Text preset="caption" color="textSecondary" numberOfLines={1}>#{entry.tags.join(' #')}</Text>
            {entry.reflections.length > 0 ? (
              <Text
                preset="caption"
                color="tint"
                style={styles.reflectionSummary}
                onPress={() => onReflectionSummaryPress?.(entry.id)}
              >
                {reflectionCountLabel(entry.reflections.length, t)}
              </Text>
            ) : null}
          </View>
        ) : entry.reflections.length > 0 ? (
          <View style={styles.cardFooter}>
            <Text
              preset="caption"
              color="tint"
              style={styles.reflectionSummary}
              onPress={() => onReflectionSummaryPress?.(entry.id)}
            >
              {reflectionCountLabel(entry.reflections.length, t)}
            </Text>
          </View>
        ) : null}
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
  cardTime: { flexShrink: 0, minWidth: 48, textAlign: 'right', fontSize: 11, lineHeight: 14 },
  cardContentColumn: { flex: 1, paddingLeft: 0, paddingRight: 14, paddingVertical: 7 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  title: { flex: 1 },
  compactMoodBadge: { maxWidth: 86, minHeight: 24, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  compactMoodBadgeText: { fontWeight: '700' },
  content: { fontSize: 16, lineHeight: 22 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  reflectionSummary: { flexShrink: 0, fontWeight: '700' },
  feedCard: { padding: 16, marginBottom: 14 },
  feedCanvas: { position: 'relative', minHeight: 220, overflow: 'visible' },
  feedTextLayer: { position: 'relative', zIndex: 2 },
  feedSticker: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  feedStickerImage: { width: 80, height: 80 },
  feedStickerEmoji: { fontSize: 48, lineHeight: 60, includeFontPadding: true, textAlign: 'center' },
  feedTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10 },
  feedTitle: { flex: 1, fontWeight: '700' },
  feedMoodBadge: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  feedMoodBadgeText: { fontWeight: '700' },
  feedContent: { fontSize: 16, lineHeight: 24 },
  feedMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  timelineEntry: { flexDirection: 'row', alignItems: 'stretch', minHeight: 76, marginBottom: 12 },
  timelineRail: { width: 2, marginHorizontal: 10, position: 'relative' },
  timelineDot: { position: 'absolute', top: 10, left: -4, width: 10, height: 10, borderRadius: 5 },
  timelineBody: { flex: 1, paddingVertical: 4 },
  timelinePressArea: { marginBottom: 2 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  timelineTitle: { ...diaryEntryListTitle, flex: 1 },
  timelineTime: { flexShrink: 0 },
  timelineActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
