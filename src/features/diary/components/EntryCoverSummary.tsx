import { Image, StyleSheet, TouchableOpacity, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@shared/components/Text';
import { useTheme } from '@providers/ThemeProvider';
import type { ManualMood } from '@/features/diary/domain/DiaryEntry';
import { MoodBadgeList } from './MoodBadgeList';
import { TagBadgeList } from './TagBadgeList';
import { EntryViewCountBadge } from './EntryViewCountBadge';

type EntryCoverSummaryVariant = 'feed' | 'memory' | 'memoryFeatured';

interface EntryCoverSummaryProps {
  readonly variant: EntryCoverSummaryVariant;
  readonly title: string;
  readonly timestamp?: string;
  readonly imageSource?: ImageSourcePropType;
  readonly isFavorite?: boolean;
  readonly viewCount?: number;
  readonly viewCountAccessibilityLabel?: string;
  readonly moods?: readonly ManualMood[];
  readonly tags?: readonly string[];
  readonly onShuffle?: () => void;
  readonly shuffleAccessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
  readonly imageTestID?: string;
  readonly viewCountTestID?: string;
  readonly timestampTestID?: string;
}

export function EntryCoverSummary({
  variant,
  title,
  timestamp,
  imageSource,
  isFavorite = false,
  viewCount,
  viewCountAccessibilityLabel,
  moods = [],
  tags = [],
  onShuffle,
  shuffleAccessibilityLabel,
  style,
  testID,
  imageTestID,
  viewCountTestID,
  timestampTestID,
}: EntryCoverSummaryProps): React.JSX.Element {
  const theme = useTheme();
  const isFeed = variant === 'feed';
  const isFeatured = variant === 'memoryFeatured';
  const showBadges = moods.length > 0 || tags.length > 0;
  const showViewCount = typeof viewCount === 'number' && Boolean(viewCountAccessibilityLabel);

  return (
    <View
      style={[
        styles.frame,
        isFeed ? styles.feedFrame : styles.memoryFrame,
        isFeatured && styles.featuredMemoryFrame,
        !imageSource && { backgroundColor: theme.colors.tint + '18' },
        style,
      ]}
      testID={testID}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          testID={imageTestID}
        />
      ) : (
        <Ionicons name="book-outline" size={isFeatured ? 36 : 26} color={theme.colors.tint} />
      )}
      <View pointerEvents="none" style={[styles.scrim, { backgroundColor: theme.colors.overlay }]} />
      {onShuffle ? (
        <TouchableOpacity
          onPress={(event) => {
            event.stopPropagation();
            onShuffle();
          }}
          style={styles.shuffleButton}
          accessibilityRole="button"
          accessibilityLabel={shuffleAccessibilityLabel}
        >
          <Ionicons name="shuffle" size={21} color={theme.colors.stickerControlText} />
        </TouchableOpacity>
      ) : null}
      {showViewCount ? (
        <EntryViewCountBadge
          count={viewCount}
          accessibilityLabel={viewCountAccessibilityLabel!}
          height={26}
          minWidth={44}
          iconSize={15}
          style={styles.viewCountBadge}
          testID={viewCountTestID}
        />
      ) : null}
      <View style={[styles.copy, isFeed && styles.feedCopy]}>
        <Text
          preset={isFeatured ? 'h2' : isFeed ? undefined : 'label'}
          style={[
            styles.title,
            isFeed && {
              fontSize: theme.fontSizes.xxxl,
              lineHeight: theme.fontSizes.xxxl * 1.25,
            },
            { color: theme.colors.stickerControlText },
          ]}
          numberOfLines={isFeed ? 3 : 1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {timestamp ? (
          <View style={styles.metaRow}>
            <Text
              preset="caption"
              numberOfLines={1}
              style={[styles.timestamp, { color: theme.colors.stickerControlText }]}
              testID={timestampTestID}
            >
              {timestamp}
            </Text>
            {isFavorite ? <Ionicons name="star" size={13} color={theme.colors.warning} /> : null}
          </View>
        ) : null}
        {showBadges ? (
          <View style={styles.badgeRow}>
            <MoodBadgeList
              moods={moods}
              maxVisible={1}
              compact
              overflowPopup
              style={styles.moodBadges}
            />
            <TagBadgeList
              tags={tags}
              maxVisible={1}
              compact
              overflowPopup
              style={styles.tagBadges}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  feedFrame: {
    minHeight: 168,
  },
  memoryFrame: {
    height: 116,
  },
  featuredMemoryFrame: {
    height: 190,
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    opacity: 0.28,
  },
  shuffleButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  viewCountBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
  copy: {
    position: 'absolute',
    left: 12,
    right: 64,
    bottom: 10,
    gap: 5,
  },
  feedCopy: {
    left: 20,
    right: 78,
    bottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  timestamp: {
    flex: 1,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  title: {
    flex: 1,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.76)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  moodBadges: {
    maxWidth: 140,
  },
  tagBadges: {
    flex: 1,
    maxWidth: '100%',
  },
});
