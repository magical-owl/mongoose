import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { Modal } from '@shared/components/Modal';
import { MANUAL_MOOD_OPTIONS, MANUAL_MOOD_WEATHER_OPTIONS, type ManualMood, type ManualMoodWeather, type SensoryDetails, type WritingMode } from '@/features/diary/domain/DiaryEntry';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';

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

  return (
    <>
      <Modal visible={visible} onDismiss={onDismiss} title="Entry details" accessibilityLabel="Entry details">
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.labelRow}>
            <Text preset="caption" color="textSecondary" style={styles.label}>MOOD</Text>
            <TouchableOpacity onPress={() => Alert.alert('Mood', 'Choose the feeling that best describes your entry.')} accessibilityLabel="What is mood?">
              <Ionicons name="information-circle-outline" size={17} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {moods.map((item) => { const color = getManualMoodColor(item, theme.colors); const moodLabel = item.charAt(0).toUpperCase() + item.slice(1); return <TouchableOpacity key={item} onPress={() => onChange({ manualMood: item })} style={[styles.choice, { borderColor: values.manualMood === item ? color : theme.colors.border, backgroundColor: values.manualMood === item ? color + '20' : 'transparent' }]}><Text preset="caption" style={{ color }}>{moodLabel}</Text></TouchableOpacity>; })}
          </ScrollView>
          <View style={styles.labelRow}>
            <Text preset="caption" color="textSecondary" style={styles.label}>MOOD WEATHER</Text>
            <TouchableOpacity onPress={() => Alert.alert('Mood weather', 'Choose the weather that best matches how the day felt.')} accessibilityLabel="What is mood weather?">
              <Ionicons name="information-circle-outline" size={17} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {weather.map((item) => { const weatherLabel = item.charAt(0).toUpperCase() + item.slice(1); return <TouchableOpacity key={item} onPress={() => onChange({ manualMoodWeather: item })} style={[styles.choice, { borderColor: values.manualMoodWeather === item ? theme.colors.tint : theme.colors.border, backgroundColor: values.manualMoodWeather === item ? theme.colors.tint + '20' : 'transparent' }]}><Text preset="caption" color="text">{weatherLabel}</Text></TouchableOpacity>; })}
          </ScrollView>

        </ScrollView>
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({ scroll: { maxHeight: 470 }, label: { marginTop: 12, marginBottom: 7, fontWeight: '700' }, labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, row: { gap: 8, paddingBottom: 4 }, choice: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 } });
