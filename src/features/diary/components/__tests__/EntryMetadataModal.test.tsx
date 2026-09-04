import { act, fireEvent } from '@testing-library/react-native';
import type React from 'react';
import { EntryMetadataModal } from '@/features/diary/components/EntryMetadataModal';
import type { Journal } from '@/features/journal/domain/Journal';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@shared/components/Modal', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  interface MockModalProps {
    readonly visible: boolean;
    readonly children: React.ReactNode;
    readonly accessibilityLabel?: string;
  }

  return {
    Modal: ({ visible, children, accessibilityLabel }: MockModalProps) => (
      visible ? <View accessibilityLabel={accessibilityLabel}>{children}</View> : null
    ),
  };
});

jest.mock('@/features/diary/components/ManualMoodPicker', () => {
  const { TouchableOpacity, Text } = jest.requireActual<typeof import('react-native')>('react-native');

  interface MockManualMoodPickerProps {
    readonly onChangeValues?: (moods: string[]) => void;
  }

  return {
    ManualMoodPicker: ({ onChangeValues }: MockManualMoodPickerProps) => (
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Pick mood" onPress={() => onChangeValues?.(['happy'])}>
        <Text>MOOD</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/features/diary/components/DiaryJournalSelector', () => {
  const { TouchableOpacity, Text } = jest.requireActual<typeof import('react-native')>('react-native');

  interface MockDiaryJournalSelectorProps {
    readonly onChange: (journalIds: string[]) => void;
  }

  return {
    DiaryJournalSelector: ({ onChange }: MockDiaryJournalSelectorProps) => (
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Pick journal" onPress={() => onChange(['11111111-1111-4111-8111-111111111111'])}>
        <Text>JOURNALS</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/features/diary/components/DiaryTagSelector', () => {
  const { TouchableOpacity, Text } = jest.requireActual<typeof import('react-native')>('react-native');

  interface MockDiaryTagSelectorProps {
    readonly onChange: (tags: string[]) => void;
  }

  return {
    DiaryTagSelector: ({ onChange }: MockDiaryTagSelectorProps) => (
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Pick tag" onPress={() => onChange(['reflection'])}>
        <Text>TAGS</Text>
      </TouchableOpacity>
    ),
  };
});

const journals: readonly Journal[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Everyday Notes',
    description: '',
    color: '#4ECDC4',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('EntryMetadataModal', () => {
  it('keeps mood, journal, and tag controls in one modal', async () => {
    const onChangeMoods = jest.fn();
    const onChangeJournalIds = jest.fn();
    const onChangeTags = jest.fn();

    const { getByLabelText, getByText } = await renderWithProviders(
      <EntryMetadataModal
        visible
        onDismiss={jest.fn()}
        moods={['neutral']}
        onChangeMoods={onChangeMoods}
        selectedJournalIds={[]}
        journals={journals}
        onChangeJournalIds={onChangeJournalIds}
        selectedTags={[]}
        availableTags={['reflection']}
        onChangeTags={onChangeTags}
      />,
    );

    expect(getByText('MOOD')).toBeTruthy();
    expect(getByText('JOURNALS')).toBeTruthy();
    expect(getByText('TAGS')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByLabelText('Pick mood'));
      fireEvent.press(getByLabelText('Pick journal'));
      fireEvent.press(getByLabelText('Pick tag'));
    });

    expect(onChangeMoods).toHaveBeenCalledWith(['happy']);
    expect(onChangeJournalIds).toHaveBeenCalledWith(['11111111-1111-4111-8111-111111111111']);
    expect(onChangeTags).toHaveBeenCalledWith(['reflection']);
  });

  it('can show a save confirmation prompt before creating an entry', async () => {
    const onConfirm = jest.fn();

    const { getByText } = await renderWithProviders(
      <EntryMetadataModal
        visible
        onDismiss={jest.fn()}
        moods={['neutral']}
        onChangeMoods={jest.fn()}
        selectedJournalIds={[]}
        journals={journals}
        onChangeJournalIds={jest.fn()}
        selectedTags={[]}
        availableTags={['reflection']}
        onChangeTags={jest.fn()}
        prompt="Add a mood, journal, or tags before saving."
        confirmLabel="Save entry"
        onConfirm={onConfirm}
      />,
    );

    expect(getByText('Add a mood, journal, or tags before saving.')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Save entry'));
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
