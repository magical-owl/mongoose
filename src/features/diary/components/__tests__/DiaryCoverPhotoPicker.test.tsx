import { DiaryCoverPhotoPicker } from '@/features/diary/components/DiaryCoverPhotoPicker';
import { BUILTIN_JOURNAL_BACKGROUNDS } from '@/features/journal/domain/JournalBackgrounds';
import { renderWithProviders } from '@tests/helpers';
import { StyleSheet } from 'react-native';

describe('DiaryCoverPhotoPicker', () => {
  it('renders built-in journal background URIs as diary cover photos', async () => {
    const background = BUILTIN_JOURNAL_BACKGROUNDS[0]!;
    const { getByTestId } = await renderWithProviders(
      <DiaryCoverPhotoPicker
        editable={false}
        photo={{
          id: '33333333-0000-4000-8000-000000000001',
          uri: background.uri,
          width: background.width,
          height: background.height,
          createdAt: '2026-05-01T08:00:00.000Z',
        }}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('diary-cover-photo-image').props.source).toBe(background.source);
  });

  it('centers entry hero cover actions below the overlaid header', async () => {
    const background = BUILTIN_JOURNAL_BACKGROUNDS[0]!;
    const { getByTestId } = await renderWithProviders(
      <DiaryCoverPhotoPicker
        variant="entryHero"
        height={240}
        actionAreaTopInset={96}
        photo={{
          id: '33333333-0000-4000-8000-000000000002',
          uri: background.uri,
          width: background.width,
          height: background.height,
          createdAt: '2026-05-01T08:00:00.000Z',
        }}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const actionsStyle = StyleSheet.flatten(getByTestId('diary-cover-photo-entry-hero-actions').props.style);

    expect(actionsStyle.top).toBe(168);
  });
});
