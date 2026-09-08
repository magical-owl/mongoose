import { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { useDiaryCoverPhotoEditing } from '@/features/diary/hooks/useDiaryCoverPhotoEditing';

const mockChooseDiaryPhoto = jest.fn();
const mockTakeDiaryPhoto = jest.fn();
const mockImportAsset = jest.fn();

jest.mock('@/features/diary/services/DiaryPhotoPickerService', () => ({
  chooseDiaryPhoto: () => mockChooseDiaryPhoto(),
  takeDiaryPhoto: () => mockTakeDiaryPhoto(),
}));

jest.mock('@/features/diary/services/DiaryPhotoService', () => ({
  diaryPhotoService: {
    importAsset: (asset: ImagePickerAsset) => mockImportAsset(asset),
  },
}));

const selectedAsset = {
  uri: 'file:///picker/cover.jpg',
  width: 1200,
  height: 800,
} as ImagePickerAsset;

const importedPhoto: DiaryPhoto = {
  id: '33333333-3333-4333-8333-333333333333',
  uri: 'file:///document/diary-photos/cover.jpg',
  width: 1200,
  height: 800,
  createdAt: '2026-08-29T01:00:00.000Z',
};

function CoverPhotoHarness({
  onNativeModuleMissing = jest.fn(),
  onCameraPermissionDenied = jest.fn(),
  onLibraryPermissionDenied = jest.fn(),
  onPhotoImportFailed = jest.fn(),
}: {
  readonly onNativeModuleMissing?: () => void;
  readonly onCameraPermissionDenied?: () => void;
  readonly onLibraryPermissionDenied?: () => void;
  readonly onPhotoImportFailed?: () => void;
}) {
  const [photo, setPhoto] = useState<DiaryPhoto | undefined>();
  const hook = useDiaryCoverPhotoEditing({
    onChangePhoto: setPhoto,
    onNativeModuleMissing,
    onCameraPermissionDenied,
    onLibraryPermissionDenied,
    onPhotoImportFailed,
  });

  return (
    <>
      <Text testID="cover-photo-uri">{photo?.uri ?? 'none'}</Text>
      <TouchableOpacity testID="take-cover-photo" onPress={hook.handleTakeCoverPhoto}>
        <Text>Take</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="choose-cover-photo" onPress={hook.handleChooseCoverPhoto}>
        <Text>Choose</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="remove-cover-photo" onPress={hook.handleRemoveCoverPhoto}>
        <Text>Remove</Text>
      </TouchableOpacity>
    </>
  );
}

describe('useDiaryCoverPhotoEditing', () => {
  beforeEach(() => {
    mockChooseDiaryPhoto.mockResolvedValue({ success: true, assets: [selectedAsset] });
    mockTakeDiaryPhoto.mockResolvedValue({ success: true, assets: [selectedAsset] });
    mockImportAsset.mockResolvedValue(importedPhoto);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('imports a selected library photo as the cover photo', async () => {
    const { getByTestId } = await render(<CoverPhotoHarness />);

    await act(async () => {
      fireEvent.press(getByTestId('choose-cover-photo'));
    });

    await waitFor(() => {
      expect(getByTestId('cover-photo-uri').props.children).toBe(importedPhoto.uri);
    });
    expect(mockImportAsset).toHaveBeenCalledWith(selectedAsset);
  });

  it('imports a camera photo as the cover photo', async () => {
    const { getByTestId } = await render(<CoverPhotoHarness />);

    await act(async () => {
      fireEvent.press(getByTestId('take-cover-photo'));
    });

    await waitFor(() => {
      expect(getByTestId('cover-photo-uri').props.children).toBe(importedPhoto.uri);
    });
  });

  it('removes the selected cover photo', async () => {
    const { getByTestId } = await render(<CoverPhotoHarness />);

    await act(async () => {
      fireEvent.press(getByTestId('choose-cover-photo'));
    });
    await waitFor(() => expect(getByTestId('cover-photo-uri').props.children).toBe(importedPhoto.uri));

    await act(async () => {
      fireEvent.press(getByTestId('remove-cover-photo'));
    });

    expect(getByTestId('cover-photo-uri').props.children).toBe('none');
  });

  it('ignores canceled picker results without importing', async () => {
    mockChooseDiaryPhoto.mockResolvedValue({ success: true, assets: [] });
    const { getByTestId } = await render(<CoverPhotoHarness />);

    await act(async () => {
      fireEvent.press(getByTestId('choose-cover-photo'));
    });

    expect(getByTestId('cover-photo-uri').props.children).toBe('none');
    expect(mockImportAsset).not.toHaveBeenCalled();
  });

  it('reports camera, library, and native module failures to the caller', async () => {
    const onNativeModuleMissing = jest.fn();
    const onCameraPermissionDenied = jest.fn();
    const onLibraryPermissionDenied = jest.fn();
    const { getByTestId } = await render(
      <CoverPhotoHarness
        onNativeModuleMissing={onNativeModuleMissing}
        onCameraPermissionDenied={onCameraPermissionDenied}
        onLibraryPermissionDenied={onLibraryPermissionDenied}
      />,
    );

    mockTakeDiaryPhoto.mockResolvedValueOnce({ success: false, error: 'camera-permission-denied' });
    await act(async () => {
      fireEvent.press(getByTestId('take-cover-photo'));
    });
    expect(onCameraPermissionDenied).toHaveBeenCalled();

    mockChooseDiaryPhoto.mockResolvedValueOnce({ success: false, error: 'library-permission-denied' });
    await act(async () => {
      fireEvent.press(getByTestId('choose-cover-photo'));
    });
    expect(onLibraryPermissionDenied).toHaveBeenCalled();

    mockChooseDiaryPhoto.mockResolvedValueOnce({ success: false, error: 'native-module-missing' });
    await act(async () => {
      fireEvent.press(getByTestId('choose-cover-photo'));
    });
    expect(onNativeModuleMissing).toHaveBeenCalled();
  });

  it('reports import failures to the caller', async () => {
    mockImportAsset.mockRejectedValue(new Error('import failed'));
    const onPhotoImportFailed = jest.fn();
    const { getByTestId } = await render(<CoverPhotoHarness onPhotoImportFailed={onPhotoImportFailed} />);

    await act(async () => {
      fireEvent.press(getByTestId('choose-cover-photo'));
    });

    expect(onPhotoImportFailed).toHaveBeenCalled();
  });
});
