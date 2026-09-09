import { act, fireEvent, waitFor } from '@testing-library/react-native';
import type React from 'react';
import { StyleSheet } from 'react-native';
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
    await fireEvent.changeText(reflectionInput, 'One more note');
    await waitFor(() => {
      expect(getByLabelText('Reflection text').props.value).toBe('One more note');
    });
    reflectionInput = getByLabelText('Reflection text');
    await act(async () => {
      await fireEvent(reflectionInput, 'submitEditing');
    });

    await waitFor(() => {
      expect(onAddReflection).toHaveBeenCalledWith(entry.id, 'One more note', undefined);
    });

    await fireEvent.press(getByLabelText('Delete reflection'));

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

    await fireEvent.press(getByLabelText('Open reflection photo'));

    await waitFor(() => {
      expect(getByTestId('entry-reflection-photo-viewer-image').props.source).toEqual({
        uri: 'file:///document/diary-photos/reflection.jpg',
      });
    });

    await fireEvent.press(getByLabelText('Close reflection photo'));

    await waitFor(() => {
      expect(queryByTestId('entry-reflection-photo-viewer')).toBeNull();
    });
  });

  it('toggles reactions for a reflection in the modal', async () => {
    const onToggleReflectionMemoryReaction = jest.fn().mockResolvedValue(true);
    const { getByTestId } = await renderWithProviders(
      <EntryReflectionsModal
        visible
        entry={entry}
        profile={profile}
        timeFormat="24-hour"
        onDismiss={jest.fn()}
        onAddReflection={jest.fn().mockResolvedValue(true)}
        onDeleteReflection={jest.fn()}
        onToggleReflectionMemoryReaction={onToggleReflectionMemoryReaction}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('entry-modal-reflection-reaction-22222222-2222-4222-8222-222222222222-button'));
    await fireEvent.press(getByTestId('entry-modal-reflection-reaction-22222222-2222-4222-8222-222222222222-button-cherish'));

    expect(onToggleReflectionMemoryReaction).toHaveBeenCalledWith(
      entry.id,
      '22222222-2222-4222-8222-222222222222',
      'cherish',
    );
  });

  it('places text-only reflection reactions in a footer in the modal', async () => {
    const { getByTestId } = await renderWithProviders(
      <EntryReflectionsModal
        visible
        entry={entry}
        profile={profile}
        timeFormat="24-hour"
        onDismiss={jest.fn()}
        onAddReflection={jest.fn().mockResolvedValue(true)}
        onDeleteReflection={jest.fn()}
        onToggleReflectionMemoryReaction={jest.fn().mockResolvedValue(true)}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const footerStyle = StyleSheet.flatten(
      getByTestId('entry-modal-reflection-reaction-22222222-2222-4222-8222-222222222222').props.style,
    );

    expect(footerStyle.justifyContent).toBe('flex-start');
  });

  it('places image reflection reactions in the same footer in the modal', async () => {
    const { getByTestId } = await renderWithProviders(
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
        profile={profile}
        timeFormat="24-hour"
        onDismiss={jest.fn()}
        onAddReflection={jest.fn().mockResolvedValue(true)}
        onDeleteReflection={jest.fn()}
        onToggleReflectionMemoryReaction={jest.fn().mockResolvedValue(true)}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const footerStyle = StyleSheet.flatten(
      getByTestId('entry-modal-reflection-reaction-22222222-2222-4222-8222-222222222222').props.style,
    );

    expect(footerStyle.justifyContent).toBe('flex-start');
  });
});
