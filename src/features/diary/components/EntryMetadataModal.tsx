import { ScrollView, StyleSheet } from 'react-native';
import { Modal } from '@shared/components/Modal';
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
});
