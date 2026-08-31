import { DiaryCoverPhotoPicker } from '@/features/diary/components/DiaryCoverPhotoPicker';
import { BUILTIN_JOURNAL_BACKGROUNDS } from '@/features/journal/domain/JournalBackgrounds';
import { renderWithProviders } from '@tests/helpers';

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
});
