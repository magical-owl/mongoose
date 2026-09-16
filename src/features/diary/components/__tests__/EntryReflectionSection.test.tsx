import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { EntryReflectionSection } from '@/features/diary/components/EntryReflectionSection';
import type { DiaryReflection } from '@/features/diary/domain/DiaryEntry';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@/features/diary/services/DiaryPhotoPickerService', () => ({
  chooseDiaryPhoto: jest.fn(),
}));

jest.mock('@/features/diary/services/DiaryPhotoService', () => ({
  diaryPhotoService: {
    importAsset: jest.fn(),
    deletePhoto: jest.fn(),
  },
  getDiaryPhotoImageSource: (uri: string) => ({ uri }),
}));

const reflections: readonly DiaryReflection[] = [
  {
    id: '22222222-2222-4222-8222-222222222222',
    text: 'A small visual note.',
    createdAt: '2026-08-29T02:12:00.000Z',
    updatedAt: '2026-08-29T02:12:00.000Z',
    memoryReactions: [],
    replies: [],
    photo: {
      id: '33333333-3333-4333-8333-333333333333',
      uri: 'file:///document/diary-photos/reflection.jpg',
      width: 1200,
      height: 800,
      createdAt: '2026-08-29T02:13:00.000Z',
    },
  },
];

describe('EntryReflectionSection', () => {
  it('renders reflection rows and opens attached photos', async () => {
    const { getByLabelText, getByTestId, getByText } = await renderWithProviders(
      <EntryReflectionSection
        entryId="11111111-1111-4111-8111-111111111111"
        reflections={reflections}
        variant="timeline"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const sectionStyle = StyleSheet.flatten(getByTestId('entry-timeline-reflection-section').props.style);
    const reflectionsStyle = StyleSheet.flatten(getByTestId('entry-timeline-reflections').props.style);

    expect(getByText('A small visual note.')).toBeTruthy();
    expect(sectionStyle.opacity).toBeDefined();
    expect(sectionStyle.transform).toBeTruthy();
    expect(sectionStyle.marginRight).toBe(0);
    expect(reflectionsStyle.borderLeftWidth).toBe(1);
    expect(getByTestId('entry-inline-reflection-photo').props.source).toEqual({
      uri: 'file:///document/diary-photos/reflection.jpg',
    });

    await fireEvent.press(getByLabelText('Open reflection photo'));

    await waitFor(() => {
      expect(getByTestId('entry-inline-reflection-photo-viewer-image').props.source).toEqual({
        uri: 'file:///document/diary-photos/reflection.jpg',
      });
    });
  });

  it('submits composer text for the owning entry', async () => {
    const onAddReflection = jest.fn().mockResolvedValue(true);
    const onReflectionInputFocus = jest.fn();
    const { getByLabelText } = await renderWithProviders(
      <EntryReflectionSection
        entryId="11111111-1111-4111-8111-111111111111"
        reflections={[]}
        variant="feed"
        onAddReflection={onAddReflection}
        onReflectionInputFocus={onReflectionInputFocus}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent(getByLabelText('Reflection text'), 'focus');
    await fireEvent.changeText(getByLabelText('Reflection text'), 'A quieter follow-up');

    await waitFor(() => {
      expect(getByLabelText('Reflection text').props.value).toBe('A quieter follow-up');
    });

    await act(async () => {
      await fireEvent.press(getByLabelText('Save reflection'));
    });

    expect(onReflectionInputFocus).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
    await waitFor(() => {
      expect(onAddReflection).toHaveBeenCalledWith(
        '11111111-1111-4111-8111-111111111111',
        'A quieter follow-up',
        undefined,
      );
    });
  });

  it('toggles reactions for a reflection row', async () => {
    const onToggleReflectionMemoryReaction = jest.fn().mockResolvedValue(true);
    const { getByTestId } = await renderWithProviders(
      <EntryReflectionSection
        entryId="11111111-1111-4111-8111-111111111111"
        reflections={reflections}
        variant="timeline"
        onToggleReflectionMemoryReaction={onToggleReflectionMemoryReaction}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('entry-reflection-reaction-22222222-2222-4222-8222-222222222222-button'));
    await fireEvent.press(getByTestId('entry-reflection-reaction-22222222-2222-4222-8222-222222222222-button-cherish'));

    expect(onToggleReflectionMemoryReaction).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      'cherish',
    );
  });

  it('adds a reply to a reflection thread', async () => {
    const onAddReflectionReply = jest.fn().mockResolvedValue(true);
    const { getByLabelText, getByTestId } = await renderWithProviders(
      <EntryReflectionSection
        entryId="11111111-1111-4111-8111-111111111111"
        reflections={reflections}
        variant="timeline"
        onAddReflectionReply={onAddReflectionReply}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const replyButton = getByTestId('entry-reflection-replies-22222222-2222-4222-8222-222222222222-add-button');
    expect(StyleSheet.flatten(replyButton.props.style).alignSelf).toBe('flex-end');

    await fireEvent.press(replyButton);
    await fireEvent.changeText(getByLabelText('Reflection reply text'), 'A threaded note');
    await act(async () => {
      await fireEvent.press(getByTestId('entry-reflection-replies-22222222-2222-4222-8222-222222222222-submit'));
    });

    expect(onAddReflectionReply).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      'A threaded note',
    );
  });

  it('renders existing reflection replies', async () => {
    const { getByText } = await renderWithProviders(
      <EntryReflectionSection
        entryId="11111111-1111-4111-8111-111111111111"
        reflections={[
          {
            ...reflections[0]!,
            replies: [
              {
                id: '55555555-5555-4555-8555-555555555555',
                text: 'A reply below the reflection.',
                createdAt: '2026-08-29T02:14:00.000Z',
                updatedAt: '2026-08-29T02:14:00.000Z',
              },
            ],
          },
        ]}
        variant="timeline"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByText('A reply below the reflection.')).toBeTruthy();
  });

  it('places text-only reflection reactions in a footer', async () => {
    const textOnlyReflection: DiaryReflection = {
      ...reflections[0]!,
      photo: undefined,
    };
    const { getByTestId } = await renderWithProviders(
      <EntryReflectionSection
        entryId="11111111-1111-4111-8111-111111111111"
        reflections={[textOnlyReflection]}
        variant="timeline"
        onToggleReflectionMemoryReaction={jest.fn().mockResolvedValue(true)}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const footerStyle = StyleSheet.flatten(
      getByTestId('entry-reflection-reaction-22222222-2222-4222-8222-222222222222').props.style,
    );

    expect(footerStyle.justifyContent).toBe('flex-start');
    expect(getByTestId('entry-reflection-reaction-22222222-2222-4222-8222-222222222222-button')).toBeTruthy();
  });

  it('places image reflection reactions in the same footer', async () => {
    const { getByTestId } = await renderWithProviders(
      <EntryReflectionSection
        entryId="11111111-1111-4111-8111-111111111111"
        reflections={reflections}
        variant="timeline"
        onToggleReflectionMemoryReaction={jest.fn().mockResolvedValue(true)}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const footerStyle = StyleSheet.flatten(
      getByTestId('entry-reflection-reaction-22222222-2222-4222-8222-222222222222').props.style,
    );

    expect(footerStyle.justifyContent).toBe('flex-start');
    expect(getByTestId('entry-reflection-reaction-22222222-2222-4222-8222-222222222222-button')).toBeTruthy();
  });
});
