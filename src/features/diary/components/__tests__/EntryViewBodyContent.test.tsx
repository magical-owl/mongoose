import { EntryViewBodyContent } from '@/features/diary/components/EntryViewBodyContent';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { renderWithProviders } from '@tests/helpers';
import { buildDiaryEntry } from '@tests/fixtures/domain';

jest.mock('@/features/diary/components/DiaryEntryBodyView', () => {
  const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    DiaryEntryBodyView: ({ entry }: { readonly entry: DiaryEntry }) => (
      <View testID="mock-diary-entry-body-view">
        <Text>{entry.content}</Text>
      </View>
    ),
  };
});

const entry = buildDiaryEntry({
  content: '<p>Body</p>',
  paperBackgroundId: 'vintage-parchment',
});

describe('EntryViewBodyContent', () => {
  it('shows the no-cover header above the diary body', async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <EntryViewBodyContent
        entry={entry}
        hasCoverPhoto={false}
        timestamp="Yesterday at 08:33"
        loadingEntryDirection={null}
        bodyCanvasHeight={260}
        stickers={[]}
        onChangeBodyLayout={jest.fn()}
        onUpdateSticker={jest.fn()}
        onDeleteSticker={jest.fn()}
        onStickerDragStateChange={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('entry-view-no-cover-header')).toBeTruthy();
    expect(getByText('A quiet morning')).toBeTruthy();
    expect(getByText('Yesterday at 08:33')).toBeTruthy();
    expect(getByTestId('mock-diary-entry-body-view')).toBeTruthy();
  });

  it('hides the no-cover header when a cover photo is present', async () => {
    const { queryByTestId, getByTestId } = await renderWithProviders(
      <EntryViewBodyContent
        entry={entry}
        hasCoverPhoto
        timestamp="Yesterday at 08:33"
        loadingEntryDirection={null}
        bodyCanvasHeight={260}
        stickers={[]}
        onChangeBodyLayout={jest.fn()}
        onUpdateSticker={jest.fn()}
        onDeleteSticker={jest.fn()}
        onStickerDragStateChange={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(queryByTestId('entry-view-no-cover-header')).toBeNull();
    expect(getByTestId('mock-diary-entry-body-view')).toBeTruthy();
  });

  it('shows previous and next loaders by direction', async () => {
    const previous = await renderWithProviders(
      <EntryViewBodyContent
        entry={entry}
        hasCoverPhoto
        timestamp="Yesterday at 08:33"
        loadingEntryDirection="previous"
        bodyCanvasHeight={260}
        stickers={[]}
        onChangeBodyLayout={jest.fn()}
        onUpdateSticker={jest.fn()}
        onDeleteSticker={jest.fn()}
        onStickerDragStateChange={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(previous.getByTestId('entry-view-previous-loader')).toBeTruthy();
    expect(previous.queryByTestId('entry-view-next-loader')).toBeNull();

    const next = await renderWithProviders(
      <EntryViewBodyContent
        entry={entry}
        hasCoverPhoto
        timestamp="Yesterday at 08:33"
        loadingEntryDirection="next"
        bodyCanvasHeight={260}
        stickers={[]}
        onChangeBodyLayout={jest.fn()}
        onUpdateSticker={jest.fn()}
        onDeleteSticker={jest.fn()}
        onStickerDragStateChange={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(next.queryByTestId('entry-view-previous-loader')).toBeNull();
    expect(next.getByTestId('entry-view-next-loader')).toBeTruthy();
  });
});
