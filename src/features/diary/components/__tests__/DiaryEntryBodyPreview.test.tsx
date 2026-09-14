import { StyleSheet } from 'react-native';
import { DiaryEntryBodyPreview } from '@/features/diary/components/DiaryEntryBodyPreview';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import { buildDiaryEntry } from '@tests/fixtures/domain';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@/features/diary/components/StickerCanvasItem', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    StickerCanvasItem: ({ sticker, testID }: { readonly sticker: PlacedSticker; readonly testID?: string }) => (
      React.createElement(
        View,
        { testID: testID ?? `preview-sticker-${sticker.id}` },
        React.createElement(Text, null, `${sticker.x}:${sticker.y}:${sticker.scale}`),
      )
    ),
  };
});

describe('DiaryEntryBodyPreview', () => {
  it('uses the feed coordinate scale for sticker rendering', async () => {
    const entry = buildDiaryEntry({
      content: 'Scaled preview',
      stickers: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          stickerId: 'photo:album',
          category: 'photos',
          x: 100,
          y: 80,
          scale: 2,
          rotation: 0,
          zIndex: 1,
          behindText: false,
          imageUri: 'file:///album-photo.jpg',
          imageWidth: 1200,
          imageHeight: 800,
          wrapText: true,
        },
      ],
    });

    const { getByText } = await renderWithProviders(
      <DiaryEntryBodyPreview
        entry={entry}
        bodyCanvasHeight={240}
        bodyFontSize={16}
        bodyLineHeight={24}
        stickers={entry.stickers}
        coordinateScale={0.5}
        onBodyLayout={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByText('50:40:1')).toBeTruthy();
  });

  it('applies text avoidance from the initial canvas width before layout measurement', async () => {
    const entry = buildDiaryEntry({
      content: 'Avoid the sticker',
      stickers: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          stickerId: 'cat_sleepy',
          category: 'cat-img',
          x: 24,
          y: 24,
          scale: 1,
          rotation: 0,
          zIndex: 1,
          behindText: false,
          wrapText: true,
        },
      ],
    });

    const { getByTestId } = await renderWithProviders(
      <DiaryEntryBodyPreview
        entry={entry}
        bodyCanvasHeight={240}
        bodyFontSize={16}
        bodyLineHeight={24}
        stickers={entry.stickers}
        initialCanvasWidth={320}
        onBodyLayout={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const textLayerStyle = StyleSheet.flatten(getByTestId('diary-entry-body-preview-text-layer').props.style);

    expect(textLayerStyle.paddingLeft).toBeGreaterThan(0);
  });
});
