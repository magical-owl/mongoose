import { act, fireEvent, waitFor } from '@testing-library/react-native';
import type React from 'react';
import { EntryReflectionsModal } from '@/features/diary/components/EntryReflectionsModal';
import { renderWithProviders } from '@tests/helpers';
import { buildDiaryEntry, buildDiaryPhoto, buildDiaryReflection } from '@tests/fixtures/domain';

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

const entry = buildDiaryEntry({
  title: 'Morning notes',
  content: '<p>A short entry for today.</p>',
  paperBackgroundId: 'vintage-parchment',
  tags: ['daily'],
  createdAt: '2026-08-29T01:58:00.000Z',
  updatedAt: '2026-08-29T01:58:00.000Z',
  manualMood: 'calm',
  manualMoods: ['calm'],
  reflections: [
    buildDiaryReflection({
      id: '22222222-2222-4222-8222-222222222222',
      text: 'A follow-up reflection.',
      createdAt: '2026-08-29T02:12:00.000Z',
      updatedAt: '2026-08-29T02:12:00.000Z',
    }),
  ],
});

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
      expect(onAddReflection).toHaveBeenCalledWith(entry.id, 'One more note', undefined);
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

  it('opens attached photos in a centered preview', async () => {
    const { getByLabelText, getByTestId, queryByTestId } = await renderWithProviders(
      <EntryReflectionsModal
        visible
        entry={{
          ...entry,
          reflections: [
            {
              ...entry.reflections[0]!,
              photo: buildDiaryPhoto({
                id: '33333333-3333-4333-8333-333333333333',
                uri: 'file:///document/diary-photos/reflection.jpg',
                createdAt: '2026-08-29T02:13:00.000Z',
              }),
            },
          ],
        }}
        timeFormat="24-hour"
        onDismiss={jest.fn()}
        onAddReflection={jest.fn().mockResolvedValue(true)}
        onDeleteReflection={jest.fn()}
      />,
    );

    expect(getByTestId('entry-reflection-photo').props.source).toEqual({
      uri: 'file:///document/diary-photos/reflection.jpg',
    });

    fireEvent.press(getByLabelText('Open reflection photo'));

    await waitFor(() => {
      expect(getByTestId('entry-reflection-photo-viewer-image').props.source).toEqual({
        uri: 'file:///document/diary-photos/reflection.jpg',
      });
    });

    fireEvent.press(getByLabelText('Close reflection photo'));

    await waitFor(() => {
      expect(queryByTestId('entry-reflection-photo-viewer')).toBeNull();
    });
  });
});
