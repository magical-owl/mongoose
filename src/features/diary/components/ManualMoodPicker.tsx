import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { MANUAL_MOOD_OPTIONS, type ManualMood } from '@/features/diary/domain/DiaryEntry';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import { manualMoodLabel, useTranslation } from '@/localization/i18n';

interface ManualMoodPickerProps {
  readonly value: ManualMood;
  readonly onChange: (mood: ManualMood) => void;
}

export function ManualMoodPicker({ value, onChange }: ManualMoodPickerProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.row}>
      {MANUAL_MOOD_OPTIONS.map((mood) => {
        const selected = value === mood;
        const color = getManualMoodColor(mood, theme.colors);
        return (
          <TouchableOpacity
            key={mood}
            onPress={() => onChange(mood)}
            style={[styles.option, { borderColor: selected ? color : theme.colors.border, backgroundColor: selected ? color + '20' : 'transparent' }]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${manualMoodLabel(mood, t)} ${t('moodEmotionA11y')}${selected ? `, ${t('moodSelectedA11y')}` : ''}`}
          >
            <Text preset="caption" style={[styles.optionText, { color }]}>{manualMoodLabel(mood, t)}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { height: 36, maxHeight: 36, marginTop: 4, marginBottom: 4, flexGrow: 0, flexShrink: 0 },
  row: { minHeight: 36, alignItems: 'center', gap: 5, paddingRight: 4 },
  option: { alignSelf: 'center', minHeight: 28, borderWidth: 1, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 0, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: 14, lineHeight: 18, fontWeight: '700' },
});
