import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import type { ManualMood } from '@/features/diary/domain/DiaryEntry';
import { manualMoodLabel, useTranslation } from '@/localization/i18n';

interface MoodBadgeListProps {
  readonly moods: readonly ManualMood[];
  readonly maxVisible?: number;
  readonly onCover?: boolean;
  readonly compact?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function MoodBadgeList({
  moods,
  maxVisible,
  onCover = false,
  compact = false,
  style,
  testID,
}: MoodBadgeListProps): React.JSX.Element | null {
  const theme = useTheme();
  const t = useTranslation();
  const visibleMoods = maxVisible ? moods.slice(0, maxVisible) : moods;
  const hiddenMoods = maxVisible ? moods.slice(maxVisible) : [];

  if (moods.length === 0) return null;

  return (
    <View style={[styles.row, compact && styles.compactRow, style]} testID={testID}>
      {visibleMoods.map((mood) => {
        const color = getManualMoodColor(mood, theme.colors);
        return (
          <View
            key={mood}
            style={[
              styles.badge,
              compact && styles.compactBadge,
              {
                backgroundColor: color + (onCover ? '80' : '18'),
                borderColor: color + (onCover ? 'CC' : ''),
              },
            ]}
            accessibilityLabel={manualMoodLabel(mood, t)}
            testID={testID ? `${testID}-${mood}` : undefined}
          >
            <Text
              preset="caption"
              numberOfLines={1}
              style={[
                styles.badgeText,
                compact && styles.compactText,
                { color: onCover ? theme.colors.stickerControlText : color },
              ]}
            >
              {manualMoodLabel(mood, t)}
            </Text>
          </View>
        );
      })}
      {hiddenMoods.length > 0 ? (
        <View
          style={[
            styles.badge,
            compact && styles.compactBadge,
            { backgroundColor: theme.colors.surface + (onCover ? '99' : ''), borderColor: theme.colors.border },
          ]}
          accessibilityLabel={hiddenMoods.map((mood) => manualMoodLabel(mood, t)).join(', ')}
          testID={testID ? `${testID}-overflow` : undefined}
        >
          <Text
            preset="caption"
            numberOfLines={1}
            style={[
              styles.badgeText,
              compact && styles.compactText,
              { color: onCover ? theme.colors.stickerControlText : theme.colors.textSecondary },
            ]}
          >
            +{hiddenMoods.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  compactRow: { gap: 4 },
  badge: { minHeight: 26, maxWidth: 118, borderWidth: 1, borderRadius: 13, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  compactBadge: { minHeight: 22, maxWidth: 86, borderRadius: 11, paddingHorizontal: 7 },
  badgeText: { fontWeight: '700' },
  compactText: { fontSize: 11, lineHeight: 14 },
});
