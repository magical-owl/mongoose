import { MutableRefObject, useRef, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { useEntryStickerEditing } from '@/features/diary/hooks/useEntryStickerEditing';

const mockChooseDiaryPhoto = jest.fn();
const mockImportAsset = jest.fn();

jest.mock('@/features/diary/services/DiaryPhotoPickerService', () => ({
  chooseDiaryPhoto: () => mockChooseDiaryPhoto(),
}));

jest.mock('@/features/diary/services/DiaryPhotoService', () => ({
  diaryPhotoService: {
    importAsset: (asset: ImagePickerAsset) => mockImportAsset(asset),
  },
  createPlacedPhotoSticker: (photo: DiaryPhoto, index: number): PlacedSticker => ({
    id: `photo-sticker-${photo.id}`,
    stickerId: photo.id,
    category: 'photo',
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    zIndex: index + 1,
    behindText: false,
    imageUri: photo.uri,
    imageWidth: photo.width,
    imageHeight: photo.height,
  }),
}));

jest.mock('@/shared/utils/uuid', () => ({
  generateUUID: () => 'generated-sticker-id',
}));

function StickerEditingHarness({
  scrollOffsetYRef,
  onNativeModuleMissing = jest.fn(),
  onPhotoPermissionDenied = jest.fn(),
  onPhotoImportFailed = jest.fn(),
}: {
  readonly scrollOffsetYRef: MutableRefObject<number>;
  readonly onNativeModuleMissing?: () => void;
  readonly onPhotoPermissionDenied?: () => void;
  readonly onPhotoImportFailed?: () => void;
}) {
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const hook = useEntryStickerEditing({
    stickers,
    setStickers,
    windowWidth: 390,
    bodyMinHeight: 400,
    horizontalSpacing: 20,
    scrollOffsetYRef,
    scrollViewportHeight: 500,
    onNativeModuleMissing,
    onPhotoPermissionDenied,
    onPhotoImportFailed,
  });
  const firstSticker = stickers[0];

  return (
    <>
      <Text testID="sticker-count">{stickers.length}</Text>
      <Text testID="first-sticker-category">{firstSticker?.category ?? 'none'}</Text>
      <Text testID="first-sticker-x">{firstSticker?.x ?? 'none'}</Text>
      <Text testID="first-sticker-y">{firstSticker?.y ?? 'none'}</Text>
      <Text testID="first-sticker-scale">{firstSticker?.scale ?? 'none'}</Text>
      <Text testID="show-sticker-bounds">{hook.showStickerBounds ? 'visible' : 'hidden'}</Text>
      <TouchableOpacity testID="add-sticker" onPress={() => hook.handleAddSticker('cat-sun', 'cat')}>
        <Text>Add sticker</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="add-text-sticker" onPress={hook.handleAddTextSticker}>
        <Text>Add text</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="add-photo-sticker" onPress={() => { void hook.handleAddPhotoStickers(); }}>
        <Text>Add photo</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="update-sticker"
        onPress={() => {
          if (!firstSticker) return;
          hook.handleUpdateSticker({ ...firstSticker, x: 240 });
        }}
      >
        <Text>Update</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="delete-sticker"
        onPress={() => {
          if (!firstSticker) return;
          hook.handleDeleteSticker(firstSticker.id);
        }}
      >
        <Text>Delete</Text>
      </TouchableOpacity>
    </>
  );
}

function TestContainer({
  onNativeModuleMissing,
  onPhotoPermissionDenied,
  onPhotoImportFailed,
}: {
  readonly onNativeModuleMissing?: () => void;
  readonly onPhotoPermissionDenied?: () => void;
  readonly onPhotoImportFailed?: () => void;
}) {
  const scrollOffsetYRef = useRef(0);
  return (
    <StickerEditingHarness
      scrollOffsetYRef={scrollOffsetYRef}
      onNativeModuleMissing={onNativeModuleMissing}
      onPhotoPermissionDenied={onPhotoPermissionDenied}
      onPhotoImportFailed={onPhotoImportFailed}
    />
  );
}

describe('useEntryStickerEditing', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    mockChooseDiaryPhoto.mockResolvedValue({ success: true, assets: [] });
    mockImportAsset.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      uri: 'file:///photo.jpg',
      width: 1200,
      height: 800,
      createdAt: '2026-08-29T01:00:00.000Z',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('adds, updates, and deletes regular stickers', async () => {
    const { getByTestId } = await render(<TestContainer />);

    await fireEvent.press(getByTestId('add-sticker'));

    await waitFor(() => expect(getByTestId('sticker-count').props.children).toBe(1));
    expect(getByTestId('first-sticker-category').props.children).toBe('cat');
    expect(getByTestId('first-sticker-x').props.children).toBe(127);
    expect(getByTestId('first-sticker-y').props.children).toBe(152);
    expect(getByTestId('first-sticker-scale').props.children).toBe(2.25);
    expect(getByTestId('show-sticker-bounds').props.children).toBe('visible');

    await fireEvent.press(getByTestId('update-sticker'));
    await waitFor(() => expect(getByTestId('first-sticker-x').props.children).toBe(240));

    await fireEvent.press(getByTestId('delete-sticker'));
    await waitFor(() => expect(getByTestId('sticker-count').props.children).toBe(0));
  });

  it('adds text stickers with text defaults', async () => {
    const { getByTestId } = await render(<TestContainer />);

    await fireEvent.press(getByTestId('add-text-sticker'));

    await waitFor(() => expect(getByTestId('sticker-count').props.children).toBe(1));
    expect(getByTestId('first-sticker-category').props.children).toBe('text');
  });

  it('imports a picked photo as one photo sticker', async () => {
    mockChooseDiaryPhoto.mockResolvedValue({
      success: true,
      assets: [{ uri: 'file:///picker/photo.jpg', width: 1200, height: 800 }],
    });
    const { getByTestId } = await render(<TestContainer />);

    await act(async () => {
      await fireEvent.press(getByTestId('add-photo-sticker'));
    });

    await waitFor(() => expect(getByTestId('sticker-count').props.children).toBe(1));
    expect(getByTestId('first-sticker-category').props.children).toBe('photo');
    expect(mockImportAsset).toHaveBeenCalledWith({ uri: 'file:///picker/photo.jpg', width: 1200, height: 800 });
  });

  it('reports picker failures to the caller', async () => {
    mockChooseDiaryPhoto.mockResolvedValue({ success: false, error: 'native-module-missing' });
    const onNativeModuleMissing = jest.fn();
    const { getByTestId } = await render(<TestContainer onNativeModuleMissing={onNativeModuleMissing} />);

    await act(async () => {
      await fireEvent.press(getByTestId('add-photo-sticker'));
    });

    expect(onNativeModuleMissing).toHaveBeenCalled();
  });
});
