import { StyleSheet } from 'react-native';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import { renderWithProviders } from '@tests/helpers';

const mockGetDiaryPhotoImageSource = jest.fn((uri: string) => ({ uri: `cache:${uri}` }));

jest.mock('@/features/diary/services/DiaryPhotoService', () => ({
  getDiaryPhotoImageSource: (uri: string) => mockGetDiaryPhotoImageSource(uri),
}));

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

  it('renders photo stickers through the diary photo image source resolver', async () => {
    const photoSticker: PlacedSticker = {
      ...baseSticker,
      stickerId: 'photo:asset',
      category: 'photos',
      text: undefined,
      imageUri: 'file:///document/diary-photos/encrypted-photo.jpg',
      imageWidth: 1200,
      imageHeight: 800,
    };
    await renderWithProviders(
      <StickerCanvasItem
        sticker={photoSticker}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        isEditable
        testID="sticker-item"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(mockGetDiaryPhotoImageSource).toHaveBeenCalledWith('file:///document/diary-photos/encrypted-photo.jpg');
  });

  it('shows visible resize handles around a selected sticker', async () => {
    const { getByTestId } = await renderWithProviders(
      <StickerCanvasItem
        sticker={{ ...baseSticker, text: '' }}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        isEditable
        testID="sticker-item"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('sticker-item-corner-top-left')).toBeTruthy();
    expect(getByTestId('sticker-item-corner-top-right')).toBeTruthy();
    expect(getByTestId('sticker-item-corner-bottom-left')).toBeTruthy();
    expect(getByTestId('sticker-item-corner-bottom-right')).toBeTruthy();
    expect(getByTestId('sticker-item-side-top')).toBeTruthy();
    expect(getByTestId('sticker-item-side-right')).toBeTruthy();
    expect(getByTestId('sticker-item-side-bottom')).toBeTruthy();
    expect(getByTestId('sticker-item-side-left')).toBeTruthy();
  });

  it('hides resize handles when controlled as unselected', async () => {
    const { queryByTestId } = await renderWithProviders(
      <StickerCanvasItem
        sticker={{ ...baseSticker, text: '' }}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        isEditable
        isSelected={false}
        testID="sticker-item"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(queryByTestId('sticker-item-corner-top-left')).toBeNull();
  });
});
