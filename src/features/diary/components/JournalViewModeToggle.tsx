import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@shared/components/Text';
import { useTheme } from '@/providers/ThemeProvider';
import type { HomeViewMode } from '@/stores/useAppStore';
import { homeViewModeLabel, type TranslationKey } from '@/localization/i18n';

interface JournalViewModeToggleProps {
  readonly modes: readonly HomeViewMode[];
  readonly selectedIndex: number;
  readonly hasJournalCover: boolean;
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly onSelect: (index: number, mode: HomeViewMode) => void;
  readonly t: (key: TranslationKey) => string;
}

export function JournalViewModeToggle({
  modes,
  selectedIndex,
  hasJournalCover,
  backgroundColor,
  borderColor,
  onSelect,
  t,
}: JournalViewModeToggleProps): React.JSX.Element | null {
  const theme = useTheme();
  const selectedMode = modes[selectedIndex] ?? modes[0];
  if (!selectedMode) return null;

  const nextIndex = modes.length > 0 ? (selectedIndex + 1) % modes.length : 0;
  const nextMode = modes[nextIndex] ?? selectedMode;
  const selectedLabel = homeViewModeLabel(selectedMode, t);
  const nextLabel = homeViewModeLabel(nextMode, t);

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityLabel={`Diary entry view mode, ${selectedLabel}. Tap to switch to ${nextLabel}.`}
      onPress={() => onSelect(nextIndex, nextMode)}
      style={[
        styles.toggle,
        {
          backgroundColor,
          borderColor,
        },
      ]}
      testID="journal-entry-view-mode-toggle"
    >
      <Text
        preset="label"
        numberOfLines={1}
        style={[styles.label, { color: hasJournalCover ? theme.colors.stickerControlText : theme.colors.text }]}
      >
        {selectedLabel}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    minWidth: 84,
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
});
