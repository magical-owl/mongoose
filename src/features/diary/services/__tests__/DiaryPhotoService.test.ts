import type { ImagePickerAsset } from 'expo-image-picker';
import { diaryPhotoService, getDiaryPhotoImageSource, resolveImportedDiaryPhotoUri } from '@/features/diary/services/DiaryPhotoService';

describe('DiaryPhotoService', () => {
  it('stores compatible album JPEG assets with a renderable jpg extension', async () => {
    const imported = await diaryPhotoService.importAsset({
      uri: 'file:///picker/IMG_0001.HEIC',
      fileName: 'IMG_0001.HEIC',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 800,
    } as ImagePickerAsset);

    expect(imported.uri.endsWith('.jpg')).toBe(true);
    expect(imported.width).toBe(1200);
    expect(imported.height).toBe(800);
  });

  it('resolves persisted imported photo URIs through the current document directory', () => {
    const uri = 'file:///old-container/diary-photos/photo-1.jpg';

    expect(resolveImportedDiaryPhotoUri(uri)).toBe('file:///document/diary-photos/photo-1.jpg');
    expect(getDiaryPhotoImageSource(uri)).toEqual({ uri: 'file:///document/diary-photos/photo-1.jpg' });
  });
});
