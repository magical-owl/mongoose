import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { SectionLabel } from '@shared/components/SectionLabel';
import { Text } from '@shared/components/Text';
import { Modal } from '@shared/components/Modal';
import { MANUAL_MOOD_OPTIONS, MANUAL_MOOD_WEATHER_OPTIONS, normalizeManualMoods, toggleManualMoodSelection, type ManualMood, type ManualMoodWeather, type SensoryDetails, type WritingMode } from '@/features/diary/domain/DiaryEntry';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import type { Journal } from '@/features/journal/domain/Journal';
import { manualMoodLabel, manualMoodWeatherLabel, useTranslation } from '@/localization/i18n';

export interface EntryDetailsValues {
  manualMoodWeather: ManualMoodWeather;
  manualMood?: ManualMood;
  manualMoods?: readonly ManualMood[];
  journalIds: readonly string[];
  writingMode: WritingMode;
  sensory: SensoryDetails;
  isLockbox: boolean;
  timeCapsuleUnlockAt?: string;
  expiresAt?: string;
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
  values: EntryDetailsValues;
  journals: readonly Journal[];
  onChange: (values: Partial<EntryDetailsValues>) => void;
}

const weather: readonly ManualMoodWeather[] = MANUAL_MOOD_WEATHER_OPTIONS;
const moods: readonly ManualMood[] = MANUAL_MOOD_OPTIONS;

export function EntryDetailsModal({ visible, onDismiss, values, journals, onChange }: Props) {
  const theme = useTheme();
  const t = useTranslation();
  const selectedMoods = normalizeManualMoods(values.manualMoods, values.manualMood);
  const toggleJournal = (journalId: string) => {
    onChange({
      journalIds: values.journalIds.includes(journalId)
        ? values.journalIds.filter((id) => id !== journalId)
        : [...values.journalIds, journalId],
    });
  };

  return (
    <>
      <Modal visible={visible} onDismiss={onDismiss} title={t('entryDetailsTitle')} accessibilityLabel={t('entryDetailsTitle')}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.labelRow}>
            <SectionLabel style={styles.label}>{t('entryMoodSection')}</SectionLabel>
            <IconCircleButton
              icon="information-outline"
              onPress={() => Alert.alert(t('entryMoodHelpTitle'), t('entryMoodHelpMessage'))}
              accessibilityLabel={t('entryMoodHelpA11y')}
              size="sm"
              surface="transparent"
              iconSize={17}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {moods.map((item) => {
              const selected = selectedMoods.includes(item);
              const color = getManualMoodColor(item, theme.colors);
              const label = manualMoodLabel(item, t);
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => onChange({ manualMoods: toggleManualMoodSelection(selectedMoods, item) })}
                  style={[styles.choice, { borderColor: selected ? color : theme.colors.border, backgroundColor: selected ? color + '20' : 'transparent' }]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${label} ${t('moodEmotionA11y')}${selected ? `, ${t('moodSelectedA11y')}` : ''}`}
                >
                  <Text preset="caption" style={{ color }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {journals.length > 0 ? (
            <>
              <SectionLabel style={styles.label}>{t('entryJournalSection')}</SectionLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                {journals.map((journal) => {
                  const selected = values.journalIds.includes(journal.id);
                  return (
                    <TouchableOpacity
                      key={journal.id}
                      onPress={() => toggleJournal(journal.id)}
                      style={[
                        styles.choice,
                        {
                          borderColor: selected ? theme.colors.tint : theme.colors.border,
                          backgroundColor: selected ? theme.colors.tint + '20' : 'transparent',
                        },
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <Text preset="caption" color={selected ? "tint" : "text"}>{journal.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : null}
          <View style={styles.labelRow}>
            <SectionLabel style={styles.label}>{t('entryMoodWeatherSection')}</SectionLabel>
            <IconCircleButton
              icon="information-outline"
              onPress={() => Alert.alert(t('entryMoodWeatherHelpTitle'), t('entryMoodWeatherHelpMessage'))}
              accessibilityLabel={t('entryMoodWeatherHelpA11y')}
              size="sm"
              surface="transparent"
              iconSize={17}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {weather.map((item) => {
              const selected = values.manualMoodWeather === item;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => onChange({ manualMoodWeather: item })}
                  style={[styles.choice, { borderColor: selected ? theme.colors.tint : theme.colors.border, backgroundColor: selected ? theme.colors.tint + '20' : 'transparent' }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={manualMoodWeatherLabel(item, t)}
                >
                  <Text preset="caption" color={selected ? "tint" : "text"}>{manualMoodWeatherLabel(item, t)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

        </ScrollView>
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({ scroll: { maxHeight: 470 }, label: { marginTop: 12, marginBottom: 7, fontWeight: '700' }, labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, row: { gap: 8, paddingBottom: 4 }, choice: { minHeight: 30, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' } });
