import { useCallback } from 'react';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { chooseDiaryPhoto, takeDiaryPhoto } from '@/features/diary/services/DiaryPhotoPickerService';
import { diaryPhotoService } from '@/features/diary/services/DiaryPhotoService';

type DiaryCoverPhotoPickerSource = 'camera' | 'library';

interface UseDiaryCoverPhotoEditingOptions {
  readonly onChangePhoto: (photo: DiaryPhoto | undefined) => void;
  readonly onNativeModuleMissing: () => void;
  readonly onCameraPermissionDenied: () => void;
  readonly onLibraryPermissionDenied: () => void;
  readonly onPhotoImportFailed: () => void;
}

export function useDiaryCoverPhotoEditing({
  onChangePhoto,
  onNativeModuleMissing,
  onCameraPermissionDenied,
  onLibraryPermissionDenied,
  onPhotoImportFailed,
}: UseDiaryCoverPhotoEditingOptions) {
  const handleCoverPhotoPickerResult = useCallback(async (source: DiaryCoverPhotoPickerSource) => {
    const result = source === 'camera' ? await takeDiaryPhoto() : await chooseDiaryPhoto();
    if (!result.success) {
      if (result.error === 'native-module-missing') onNativeModuleMissing();
      else if (result.error === 'camera-permission-denied') onCameraPermissionDenied();
      else onLibraryPermissionDenied();
      return;
    }

    const [asset] = result.assets;
    if (!asset) return;

    try {
      onChangePhoto(await diaryPhotoService.importAsset(asset));
    } catch {
      onPhotoImportFailed();
    }
  }, [
    onCameraPermissionDenied,
    onChangePhoto,
    onLibraryPermissionDenied,
    onNativeModuleMissing,
    onPhotoImportFailed,
  ]);

  const handleTakeCoverPhoto = useCallback(() => {
    void handleCoverPhotoPickerResult('camera');
  }, [handleCoverPhotoPickerResult]);

  const handleChooseCoverPhoto = useCallback(() => {
    void handleCoverPhotoPickerResult('library');
  }, [handleCoverPhotoPickerResult]);

  const handleRemoveCoverPhoto = useCallback(() => {
    onChangePhoto(undefined);
  }, [onChangePhoto]);

  return {
    handleTakeCoverPhoto,
    handleChooseCoverPhoto,
    handleRemoveCoverPhoto,
  };
}
