import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { SectionLabel } from '@shared/components/SectionLabel';
import { MANUAL_MOOD_OPTIONS, normalizeManualMoods, toggleManualMoodSelection, type ManualMood } from '@/features/diary/domain/DiaryEntry';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import { manualMoodLabel, useTranslation } from '@/localization/i18n';

interface ManualMoodPickerProps {
  readonly value?: ManualMood;
  readonly values?: readonly ManualMood[];
  readonly multiple?: boolean;
  readonly onChange?: (mood: ManualMood) => void;
  readonly onChangeValues?: (moods: ManualMood[]) => void;
}

export function ManualMoodPicker({
  value,
  values,
  multiple = false,
  onChange,
  onChangeValues,
}: ManualMoodPickerProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const selectedMoods = normalizeManualMoods(values, value);

  const handleSelectMood = (mood: ManualMood) => {
    if (multiple) {
      onChangeValues?.(toggleManualMoodSelection(selectedMoods, mood));
      return;
    }
    onChange?.(mood);
  };

  return (
    <View style={styles.section}>
      <SectionLabel>{t('homeFilterMood')}</SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.row}>
        {MANUAL_MOOD_OPTIONS.map((mood) => {
          const selected = selectedMoods.includes(mood);
          const color = getManualMoodColor(mood, theme.colors);
          return (
            <TouchableOpacity
              key={mood}
              onPress={() => handleSelectMood(mood)}
              style={[
                styles.option,
                {
                  borderColor: selected ? color : theme.colors.border,
                  backgroundColor: selected ? color + '20' : theme.colors.surface,
                },
              ]}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={multiple ? { checked: selected } : { selected }}
              accessibilityLabel={`${manualMoodLabel(mood, t)} ${t('moodEmotionA11y')}${selected ? `, ${t('moodSelectedA11y')}` : ''}`}
            >
              <Text preset="caption" style={[styles.optionText, { color }]}>{manualMoodLabel(mood, t)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 4, marginBottom: 8 },
  scroll: { height: 42, maxHeight: 42, flexGrow: 0, flexShrink: 0 },
  row: { minHeight: 42, alignItems: 'center', gap: 8, paddingRight: 4 },
  option: { alignSelf: 'center', minHeight: 34, borderWidth: 1, borderRadius: 17, paddingHorizontal: 14, paddingVertical: 0, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: 15, lineHeight: 19, fontWeight: '800' },
});
