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
