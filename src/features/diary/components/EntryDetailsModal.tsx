import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { Modal } from '@shared/components/Modal';
import type { ManualMoodWeather, SensoryDetails, WritingMode } from '@/features/diary/domain/DiaryEntry';

export interface EntryDetailsValues {
  manualMoodWeather: ManualMoodWeather;
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

const weather: ManualMoodWeather[] = ['sunny', 'cloudy', 'stormy', 'foggy', 'windy', 'calm'];
const modes: [WritingMode, string][] = [['free-write', 'Free write'], ['one-line', 'One line'], ['five-minute', '5 minutes'], ['gratitude', 'Gratitude'], ['travel', 'Travel'], ['dream', 'Dream'], ['evening-review', 'Evening review']];

export function EntryDetailsModal({ visible, onDismiss, values, onChange }: Props) {
  const theme = useTheme();

  return (
    <>
      <Modal visible={visible} onDismiss={onDismiss} title="Entry details" accessibilityLabel="Entry details">
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.labelRow}>
            <Text preset="caption" color="textSecondary" style={styles.label}>MOOD WEATHER</Text>
            <TouchableOpacity onPress={() => Alert.alert('Mood weather', 'Choose the weather that best matches how the day felt.')} accessibilityLabel="What is mood weather?">
              <Ionicons name="information-circle-outline" size={17} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {weather.map((item) => <TouchableOpacity key={item} onPress={() => onChange({ manualMoodWeather: item })} style={[styles.choice, { borderColor: values.manualMoodWeather === item ? theme.colors.tint : theme.colors.border, backgroundColor: values.manualMoodWeather === item ? theme.colors.tint + '20' : 'transparent' }]}><Text preset="caption" color="text">{item}</Text></TouchableOpacity>)}
          </ScrollView>

          <Text preset="caption" color="textSecondary" style={styles.label}>WRITING MODE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {modes.map(([value, label]) => <TouchableOpacity key={value} onPress={() => onChange({ writingMode: value })} style={[styles.choice, { borderColor: values.writingMode === value ? theme.colors.tint : theme.colors.border, backgroundColor: values.writingMode === value ? theme.colors.tint + '20' : 'transparent' }]}><Text preset="caption" color="text">{label}</Text></TouchableOpacity>)}
          </ScrollView>

          <TouchableOpacity onPress={() => onChange({ isLockbox: !values.isLockbox })} style={styles.lockbox}><Text style={{ fontSize: 20 }}>{values.isLockbox ? '🔐' : '🔓'}</Text><Text preset="caption" color="text">{values.isLockbox ? 'Offline lockbox entry enabled' : 'Keep this entry in the normal diary'}</Text></TouchableOpacity>
        </ScrollView>
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({ scroll: { maxHeight: 470 }, label: { marginTop: 12, marginBottom: 7, fontWeight: '700' }, labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, row: { gap: 8, paddingBottom: 4 }, choice: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }, lockbox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 } });
