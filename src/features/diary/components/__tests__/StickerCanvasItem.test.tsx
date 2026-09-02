import { StyleSheet } from 'react-native';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import { renderWithProviders } from '@tests/helpers';

const baseSticker: PlacedSticker = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  stickerId: 'text-sticker',
  category: 'text',
  x: 24,
  y: 32,
  scale: 1,
  rotation: 0,
  zIndex: 2,
  behindText: false,
  text: 'note',
};

describe('StickerCanvasItem', () => {
  it('keeps editable behind-text stickers below the body layer until selected', async () => {
    const { getByTestId } = await renderWithProviders(
      <StickerCanvasItem
        sticker={{ ...baseSticker, behindText: true }}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        isEditable
        testID="sticker-item"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const style = StyleSheet.flatten(getByTestId('sticker-item').props.style);

    expect(style.zIndex).toBe(1);
    expect(style.elevation).toBe(1);
  });

  it('keeps editable foreground stickers above the body layer', async () => {
    const { getByTestId } = await renderWithProviders(
      <StickerCanvasItem
        sticker={baseSticker}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        isEditable
        testID="sticker-item"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const style = StyleSheet.flatten(getByTestId('sticker-item').props.style);

    expect(style.zIndex).toBe(5);
    expect(style.elevation).toBe(5);
  });
});
