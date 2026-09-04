import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import type { ManualMood } from '@/features/diary/domain/DiaryEntry';
import { manualMoodLabel, useTranslation } from '@/localization/i18n';

interface MoodBadgeListProps {
  readonly moods: readonly ManualMood[];
  readonly maxVisible?: number;
  readonly onCover?: boolean;
  readonly compact?: boolean;
  readonly overflowPopup?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function MoodBadgeList({
  moods,
  maxVisible,
  onCover = false,
  compact = false,
  overflowPopup = false,
  style,
  testID,
}: MoodBadgeListProps): React.JSX.Element | null {
  const theme = useTheme();
  const t = useTranslation();
  const [showOverflow, setShowOverflow] = useState(false);
  const visibleMoods = maxVisible ? moods.slice(0, maxVisible) : moods;
  const hiddenMoods = maxVisible ? moods.slice(maxVisible) : [];

  if (moods.length === 0) return null;

  const renderMoodBadge = (mood: ManualMood, popup = false, overflowCount = 0) => {
    const color = getManualMoodColor(mood, theme.colors);
    return (
      <TouchableOpacity
        key={mood}
        style={[
          styles.badge,
          compact && !popup && styles.compactBadge,
          popup && styles.popupBadge,
          {
            backgroundColor: color + (onCover && !popup ? '80' : '18'),
            borderColor: color + (onCover && !popup ? 'CC' : ''),
          },
        ]}
        accessibilityLabel={manualMoodLabel(mood, t)}
        accessibilityRole={overflowPopup && overflowCount > 0 && !popup ? 'button' : undefined}
        activeOpacity={overflowPopup && overflowCount > 0 && !popup ? 0.7 : 1}
        disabled={!overflowPopup || overflowCount === 0 || popup}
        onPress={() => setShowOverflow(true)}
        testID={testID && !popup ? `${testID}-${mood}` : undefined}
      >
        <Text
          preset="caption"
          numberOfLines={1}
          style={[
            styles.badgeText,
            compact && !popup && styles.compactText,
            { color: onCover && !popup ? theme.colors.stickerControlText : color },
          ]}
        >
          {overflowCount > 0 ? `${manualMoodLabel(mood, t)} +${overflowCount}` : manualMoodLabel(mood, t)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.row, compact && styles.compactRow, style]} testID={testID}>
      {visibleMoods.map((mood, index) => renderMoodBadge(
        mood,
        false,
        index === visibleMoods.length - 1 ? hiddenMoods.length : 0,
      ))}
      {overflowPopup && showOverflow ? (
        <Modal
          visible={showOverflow}
          onDismiss={() => setShowOverflow(false)}
          title={t('entryMoodSection')}
          accessibilityLabel={t('entryMoodSection')}
        >
          <View style={styles.popupRow}>
            {moods.map((mood) => renderMoodBadge(mood, true))}
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  compactRow: { gap: 4 },
  badge: { minHeight: 26, maxWidth: 118, borderWidth: 1, borderRadius: 13, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  compactBadge: { minHeight: 22, maxWidth: 104, borderRadius: 11, paddingHorizontal: 7 },
  popupBadge: { maxWidth: 160 },
  badgeText: { fontWeight: '700' },
  compactText: { fontSize: 11, lineHeight: 14 },
  popupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 },
});
