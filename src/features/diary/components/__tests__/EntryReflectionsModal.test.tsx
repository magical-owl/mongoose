import { act, fireEvent, waitFor } from '@testing-library/react-native';
import type React from 'react';
import { EntryReflectionsModal } from '@/features/diary/components/EntryReflectionsModal';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
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

const entry: DiaryEntry = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Morning notes',
  content: '<p>A short entry for today.</p>',
  date: '2026-08-29',
  paperBackgroundId: 'vintage-parchment',
  stickers: [],
  companion: 'cat',
  isFavorite: false,
  tags: ['daily'],
  createdAt: '2026-08-29T01:58:00.000Z',
  updatedAt: '2026-08-29T01:58:00.000Z',
  manualMoodWeather: 'neutral',
  manualMood: 'calm',
  manualMoods: ['calm'],
  writingMode: 'free-write',
  isLockbox: false,
  sensory: {
    locationLabel: '',
    sounds: '',
    smells: '',
    energyLevel: 5,
    bodyState: '',
  },
  collectionIds: [],
  journalIds: [],
  photos: [],
  reflections: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      text: 'A follow-up reflection.',
      createdAt: '2026-08-29T02:12:00.000Z',
      updatedAt: '2026-08-29T02:12:00.000Z',
    },
  ],
};

const profile = {
  displayName: 'Sarah Meadow',
  avatarUri: undefined,
};

describe('EntryReflectionsModal', () => {
  it('adds and deletes reflections for the active entry', async () => {
    const onDismiss = jest.fn();
    const onAddReflection = jest.fn().mockResolvedValue(true);
    const onDeleteReflection = jest.fn();

    const { getByLabelText, getByText } = await renderWithProviders(
      <EntryReflectionsModal
        visible
        entry={entry}
        profile={profile}
        timeFormat="24-hour"
        onDismiss={onDismiss}
        onAddReflection={onAddReflection}
        onDeleteReflection={onDeleteReflection}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByText('A follow-up reflection.')).toBeTruthy();

    let reflectionInput = getByLabelText('Reflection text');
    fireEvent.changeText(reflectionInput, 'One more note');
    await waitFor(() => {
      expect(getByLabelText('Reflection text').props.value).toBe('One more note');
    });
    reflectionInput = getByLabelText('Reflection text');
    await act(async () => {
      fireEvent(reflectionInput, 'submitEditing');
    });

    await waitFor(() => {
      expect(onAddReflection).toHaveBeenCalledWith(entry.id, 'One more note');
    });

    fireEvent.press(getByLabelText('Delete reflection'));

    expect(onDeleteReflection).toHaveBeenCalledWith(entry.id, '22222222-2222-4222-8222-222222222222');
  });

  it('shows an empty state when the entry has no reflections', async () => {
    const { getByText } = await renderWithProviders(
      <EntryReflectionsModal
        visible
        entry={{ ...entry, reflections: [] }}
        timeFormat="24-hour"
        onDismiss={jest.fn()}
        onAddReflection={jest.fn().mockResolvedValue(true)}
        onDeleteReflection={jest.fn()}
      />,
    );

    expect(getByText('No reflections yet.')).toBeTruthy();
  });
});
