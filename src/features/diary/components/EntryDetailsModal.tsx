import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { Modal } from '@shared/components/Modal';
import { MANUAL_MOOD_OPTIONS, MANUAL_MOOD_WEATHER_OPTIONS, type ManualMood, type ManualMoodWeather, type SensoryDetails, type WritingMode } from '@/features/diary/domain/DiaryEntry';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import { manualMoodLabel, manualMoodWeatherLabel, useTranslation } from '@/localization/i18n';

export interface EntryDetailsValues {
  manualMoodWeather: ManualMoodWeather;
  manualMood?: ManualMood;
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
  onChange: (values: Partial<EntryDetailsValues>) => void;
}

const weather: readonly ManualMoodWeather[] = MANUAL_MOOD_WEATHER_OPTIONS;
const moods: readonly ManualMood[] = MANUAL_MOOD_OPTIONS;

export function EntryDetailsModal({ visible, onDismiss, values, onChange }: Props) {
  const theme = useTheme();
  const t = useTranslation();

  return (
    <>
      <Modal visible={visible} onDismiss={onDismiss} title={t('entryDetailsTitle')} accessibilityLabel={t('entryDetailsTitle')}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.labelRow}>
            <Text preset="caption" color="textSecondary" style={styles.label}>{t('entryMoodSection')}</Text>
            <TouchableOpacity onPress={() => Alert.alert(t('entryMoodHelpTitle'), t('entryMoodHelpMessage'))} accessibilityLabel={t('entryMoodHelpA11y')}>
              <Ionicons name="information-circle-outline" size={17} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {moods.map((item) => { const color = getManualMoodColor(item, theme.colors); return <TouchableOpacity key={item} onPress={() => onChange({ manualMood: item })} style={[styles.choice, { borderColor: values.manualMood === item ? color : theme.colors.border, backgroundColor: values.manualMood === item ? color + '20' : 'transparent' }]}><Text preset="caption" style={{ color }}>{manualMoodLabel(item, t)}</Text></TouchableOpacity>; })}
          </ScrollView>
          <View style={styles.labelRow}>
            <Text preset="caption" color="textSecondary" style={styles.label}>{t('entryMoodWeatherSection')}</Text>
            <TouchableOpacity onPress={() => Alert.alert(t('entryMoodWeatherHelpTitle'), t('entryMoodWeatherHelpMessage'))} accessibilityLabel={t('entryMoodWeatherHelpA11y')}>
              <Ionicons name="information-circle-outline" size={17} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {weather.map((item) => <TouchableOpacity key={item} onPress={() => onChange({ manualMoodWeather: item })} style={[styles.choice, { borderColor: values.manualMoodWeather === item ? theme.colors.tint : theme.colors.border, backgroundColor: values.manualMoodWeather === item ? theme.colors.tint + '20' : 'transparent' }]}><Text preset="caption" color="text">{manualMoodWeatherLabel(item, t)}</Text></TouchableOpacity>)}
          </ScrollView>

        </ScrollView>
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({ scroll: { maxHeight: 470 }, label: { marginTop: 12, marginBottom: 7, fontWeight: '700' }, labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, row: { gap: 8, paddingBottom: 4 }, choice: { minHeight: 30, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' } });
