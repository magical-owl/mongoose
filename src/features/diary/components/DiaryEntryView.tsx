import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { MarkdownText } from '@shared/components/MarkdownText';
import { stripHtml } from '@shared/utils/html';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { findStickerItem, type PlacedSticker } from '@/features/diary/domain/Sticker';
import { diaryEntryListTitle } from './diaryEntryTypography';

export type DiaryEntryViewMode = 'detailed' | 'timeline' | 'feed';

interface DiaryEntryViewProps {
  readonly entry: DiaryEntry;
  readonly mode: DiaryEntryViewMode;
  readonly onPress: () => void | Promise<void>;
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

export function DiaryEntryView({ entry, mode, onPress }: DiaryEntryViewProps): React.JSX.Element {
  const theme = useTheme();
  const hasMood = Boolean(entry.manualMood);

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
            <View style={styles.feedMetaRow}>
              {entry.tags.map((tag) => <Text key={tag} preset="caption" color="textSecondary">#{tag}</Text>)}
            </View>
            <MarkdownText style={[styles.feedContent, { color: theme.colors.textSecondary }]}>{entry.content}</MarkdownText>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (mode === 'timeline') {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.timelineEntry}>
        <View style={[styles.timelineRail, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.timelineDot, { backgroundColor: theme.colors.tint }]} />
        </View>
        <View style={styles.timelineBody}>
          <Text style={[styles.timelineTitle, { color: theme.colors.text }]} numberOfLines={1}>{entry.title}</Text>
          <Text style={[styles.timelineContent, { color: theme.colors.textSecondary }]} numberOfLines={3}>{stripHtml(entry.content)}</Text>
          {entry.tags.length > 0 && <Text preset="caption" color="textSecondary" numberOfLines={1}>{entry.tags.map((tag) => `#${tag}`).join('  ')}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderLeftWidth: hasMood ? 4 : 1, borderLeftColor: hasMood ? theme.colors.tint : theme.colors.border }]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {entry.title.substring(0, 30)}{entry.title.length > 30 ? '...' : ''}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
      </View>
      <Text style={[styles.content, { color: theme.colors.textSecondary }]} numberOfLines={2}>{stripHtml(entry.content)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 4, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { flex: 1, ...diaryEntryListTitle, marginRight: 10 },
  content: { fontSize: 14, lineHeight: 20 },
  feedCard: { padding: 16, marginBottom: 14 },
  feedCanvas: { position: 'relative', minHeight: 220, overflow: 'visible' },
  feedTextLayer: { position: 'relative', zIndex: 2 },
  feedSticker: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  feedStickerImage: { width: 80, height: 80 },
  feedStickerEmoji: { fontSize: 48, lineHeight: 60, includeFontPadding: true, textAlign: 'center' },
  feedTitle: { fontWeight: '700', marginBottom: 10 },
  feedContent: { fontSize: 16, lineHeight: 24 },
  feedMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  timelineEntry: { flexDirection: 'row', alignItems: 'stretch', minHeight: 76, marginBottom: 12 },
  timelineRail: { width: 2, marginHorizontal: 10, position: 'relative' },
  timelineDot: { position: 'absolute', top: 10, left: -4, width: 10, height: 10, borderRadius: 5 },
  timelineBody: { flex: 1, paddingVertical: 4, paddingRight: 10 },
  timelineTitle: { ...diaryEntryListTitle, marginBottom: 5 },
  timelineContent: { fontSize: 14, lineHeight: 20, marginBottom: 5 },
});
