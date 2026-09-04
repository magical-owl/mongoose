import { ScrollView, StyleSheet } from 'react-native';
import { AccentPillButton } from '@shared/components/AccentPillButton';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { ManualMoodPicker } from '@/features/diary/components/ManualMoodPicker';
import { DiaryJournalSelector } from '@/features/diary/components/DiaryJournalSelector';
import { DiaryTagSelector } from '@/features/diary/components/DiaryTagSelector';
import type { ManualMood } from '@/features/diary/domain/DiaryEntry';
import type { Journal } from '@/features/journal/domain/Journal';
import { useTranslation } from '@/localization/i18n';

interface EntryMetadataModalProps {
  readonly visible: boolean;
  readonly onDismiss: () => void;
  readonly moods: readonly ManualMood[];
  readonly onChangeMoods: (moods: ManualMood[]) => void;
  readonly selectedJournalIds: readonly string[];
  readonly journals: readonly Journal[];
  readonly onChangeJournalIds: (journalIds: string[]) => void;
  readonly selectedTags: readonly string[];
  readonly availableTags: readonly string[];
  readonly onChangeTags: (tags: string[]) => void;
  readonly prompt?: string;
  readonly confirmLabel?: string;
  readonly confirmDisabled?: boolean;
  readonly onConfirm?: () => void;
}

export function EntryMetadataModal({
  visible,
  onDismiss,
  moods,
  onChangeMoods,
  selectedJournalIds,
  journals,
  onChangeJournalIds,
  selectedTags,
  availableTags,
  onChangeTags,
  prompt,
  confirmLabel,
  confirmDisabled = false,
  onConfirm,
}: EntryMetadataModalProps): React.JSX.Element {
  const t = useTranslation();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      title={t('entryDetailsTitle')}
      accessibilityLabel={t('entryDetailsTitle')}
      scrollable={false}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {prompt ? (
          <Text preset="body" style={styles.prompt}>
            {prompt}
          </Text>
        ) : null}
        <ManualMoodPicker values={moods} onChangeValues={onChangeMoods} multiple />
        <DiaryJournalSelector
          selectedJournalIds={selectedJournalIds}
          journals={journals}
          onChange={onChangeJournalIds}
        />
        <DiaryTagSelector
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={onChangeTags}
        />
        {confirmLabel && onConfirm ? (
          <AccentPillButton
            label={confirmLabel}
            onPress={onConfirm}
            disabled={confirmDisabled}
            style={styles.confirmButton}
          />
        ) : null}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 360,
  },
  content: {
    paddingBottom: 8,
  },
  prompt: {
    marginBottom: 14,
    lineHeight: 22,
  },
  confirmButton: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
});
