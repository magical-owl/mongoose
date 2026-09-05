import { DiaryCoverPhotoPicker } from '@/features/diary/components/DiaryCoverPhotoPicker';
import { BUILTIN_JOURNAL_BACKGROUNDS } from '@/features/journal/domain/JournalBackgrounds';
import { renderWithProviders } from '@tests/helpers';
import { waitFor } from '@testing-library/react-native';
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

  it('keeps the previous cover visible while a new cover loads', async () => {
    const firstBackground = BUILTIN_JOURNAL_BACKGROUNDS[0]!;
    const secondBackground = BUILTIN_JOURNAL_BACKGROUNDS[1]!;
    const firstPhoto = {
      id: '33333333-0000-4000-8000-000000000011',
      uri: firstBackground.uri,
      width: firstBackground.width,
      height: firstBackground.height,
      createdAt: '2026-05-01T08:00:00.000Z',
    };
    const secondPhoto = {
      id: '33333333-0000-4000-8000-000000000012',
      uri: secondBackground.uri,
      width: secondBackground.width,
      height: secondBackground.height,
      createdAt: '2026-05-01T08:00:00.000Z',
    };

    const { getByTestId, rerender } = await renderWithProviders(
      <DiaryCoverPhotoPicker editable={false} photo={firstPhoto} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await rerender(<DiaryCoverPhotoPicker editable={false} photo={secondPhoto} />);

    expect(getByTestId('diary-cover-photo-image').props.source).toBe(firstBackground.source);
    await waitFor(() => {
      expect(getByTestId('diary-cover-photo-image-incoming').props.source).toBe(secondBackground.source);
    });
  });

  it('can replace the previous cover immediately for preloaded transitions', async () => {
    const firstBackground = BUILTIN_JOURNAL_BACKGROUNDS[0]!;
    const secondBackground = BUILTIN_JOURNAL_BACKGROUNDS[1]!;
    const firstPhoto = {
      id: '33333333-0000-4000-8000-000000000021',
      uri: firstBackground.uri,
      width: firstBackground.width,
      height: firstBackground.height,
      createdAt: '2026-05-01T08:00:00.000Z',
    };
    const secondPhoto = {
      id: '33333333-0000-4000-8000-000000000022',
      uri: secondBackground.uri,
      width: secondBackground.width,
      height: secondBackground.height,
      createdAt: '2026-05-01T08:00:00.000Z',
    };

    const { getByTestId, queryByTestId, rerender } = await renderWithProviders(
      <DiaryCoverPhotoPicker editable={false} photo={firstPhoto} transitionMode="replace" />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await rerender(<DiaryCoverPhotoPicker editable={false} photo={secondPhoto} transitionMode="replace" />);

    await waitFor(() => {
      expect(getByTestId('diary-cover-photo-image').props.source).toBe(secondBackground.source);
    });
    expect(queryByTestId('diary-cover-photo-image-incoming')).toBeNull();
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

  it('uses white text for the entry hero cover placeholder', async () => {
    const { getByText } = await renderWithProviders(
      <DiaryCoverPhotoPicker variant="entryHero" height={160} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const placeholderStyle = StyleSheet.flatten(getByText('Cover photo').props.style);

    expect(placeholderStyle.color).toBe('#FFFFFF');
  });
});
