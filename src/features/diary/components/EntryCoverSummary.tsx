import { Image, StyleSheet, TouchableOpacity, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@shared/components/Text';
import { useTheme } from '@providers/ThemeProvider';
import type { ManualMood } from '@/features/diary/domain/DiaryEntry';
import { EntryViewCountBadge } from './EntryViewCountBadge';
import { EntryMetaRow } from './EntryMetaRow';

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
  readonly moodTestID?: string;
  readonly tagTestID?: string;
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
  moodTestID,
  tagTestID,
}: EntryCoverSummaryProps): React.JSX.Element {
  const theme = useTheme();
  const isFeed = variant === 'feed';
  const isFeatured = variant === 'memoryFeatured';
  const showBadges = moods.length > 0 || tags.length > 0;
  const showViewCount = typeof viewCount === 'number' && Boolean(viewCountAccessibilityLabel);
  const showBottomRow = showBadges || showViewCount;

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
          <Text
            preset="caption"
            numberOfLines={1}
            style={[styles.timestamp, { color: theme.colors.stickerControlText }]}
            testID={timestampTestID}
          >
            {timestamp}
          </Text>
        ) : null}
      </View>
      {isFavorite ? (
        <Ionicons name="star" size={15} color={theme.colors.warning} style={styles.favoriteIcon} />
      ) : null}
      {showBottomRow ? (
        <View style={[styles.bottomMetaRow, isFeed && styles.feedBottomMetaRow]}>
          <EntryMetaRow
            variant="cover"
            moods={moods}
            tags={tags}
            style={styles.badgeRow}
            testID={moodTestID || tagTestID ? `${testID ?? 'entry-cover-summary'}-meta-row` : undefined}
            moodTestID={moodTestID}
            tagTestID={tagTestID}
          />
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
        </View>
      ) : null}
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
    flexShrink: 0,
  },
  copy: {
    position: 'absolute',
    left: 12,
    right: 34,
    bottom: 44,
    gap: 5,
  },
  feedCopy: {
    left: 20,
    right: 20,
    bottom: 50,
  },
  timestamp: {
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
    flex: 1,
    minWidth: 0,
  },
  bottomMetaRow: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedBottomMetaRow: {
    left: 20,
    right: 20,
    bottom: 12,
  },
  favoriteIcon: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
});
