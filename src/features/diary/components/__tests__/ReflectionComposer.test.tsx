import { act, fireEvent, waitFor } from '@testing-library/react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { ReflectionComposer } from '@/features/diary/components/ReflectionComposer';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { renderWithProviders } from '@tests/helpers';

const mockChooseDiaryPhoto = jest.fn();
const mockImportAsset = jest.fn();
const mockDeletePhoto = jest.fn();

jest.mock('@/features/diary/services/DiaryPhotoPickerService', () => ({
  chooseDiaryPhoto: () => mockChooseDiaryPhoto(),
}));

jest.mock('@/features/diary/services/DiaryPhotoService', () => ({
  diaryPhotoService: {
    importAsset: (asset: ImagePickerAsset) => mockImportAsset(asset),
    deletePhoto: (photo: DiaryPhoto) => mockDeletePhoto(photo),
  },
  getDiaryPhotoImageSource: (uri: string) => ({ uri }),
}));

const selectedAsset = {
  uri: 'file:///picker/reflection.jpg',
  fileName: 'reflection.jpg',
  mimeType: 'image/jpeg',
  width: 1200,
  height: 800,
} as ImagePickerAsset;

const importedPhoto: DiaryPhoto = {
  id: '33333333-3333-4333-8333-333333333333',
  uri: 'file:///document/diary-photos/reflection.jpg',
  width: 1200,
  height: 800,
  createdAt: '2026-08-29T02:13:00.000Z',
};

describe('ReflectionComposer', () => {
  beforeEach(() => {
    mockChooseDiaryPhoto.mockResolvedValue({ success: true, assets: [selectedAsset] });
    mockImportAsset.mockResolvedValue(importedPhoto);
    mockDeletePhoto.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits one attached photo with reflection text', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    const { getByLabelText, getByTestId, queryByTestId } = await renderWithProviders(
      <ReflectionComposer
        onSubmit={onSubmit}
        inputBoxTestID="reflection-composer"
        attachButtonTestID="reflection-attach-photo"
        submitButtonTestID="reflection-submit"
        photoPreviewTestID="reflection-photo-preview"
        selectedPhotoTestID="reflection-selected-photo"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await act(async () => {
      fireEvent.press(getByTestId('reflection-attach-photo'));
    });

    await waitFor(() => {
      expect(getByTestId('reflection-selected-photo').props.source).toEqual({
        uri: importedPhoto.uri,
      });
    });

    fireEvent.changeText(getByLabelText('Reflection text'), 'A small visual note');
    await waitFor(() => {
      expect(getByLabelText('Reflection text').props.value).toBe('A small visual note');
    });

    await act(async () => {
      fireEvent.press(getByTestId('reflection-submit'));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('A small visual note', importedPhoto);
    });
    expect(queryByTestId('reflection-photo-preview')).toBeNull();
    expect(mockDeletePhoto).not.toHaveBeenCalled();
  });

  it('removes a pending photo before saving', async () => {
    const { getByTestId, queryByTestId } = await renderWithProviders(
      <ReflectionComposer
        onSubmit={jest.fn().mockResolvedValue(true)}
        attachButtonTestID="reflection-attach-photo"
        removePhotoButtonTestID="reflection-remove-photo"
        photoPreviewTestID="reflection-photo-preview"
        selectedPhotoTestID="reflection-selected-photo"
      />,
    );

    await act(async () => {
      fireEvent.press(getByTestId('reflection-attach-photo'));
    });
    await waitFor(() => expect(queryByTestId('reflection-photo-preview')).toBeTruthy());

    fireEvent.press(getByTestId('reflection-remove-photo'));

    await waitFor(() => expect(queryByTestId('reflection-photo-preview')).toBeNull());
    expect(mockDeletePhoto).toHaveBeenCalledWith(importedPhoto);
  });
});
