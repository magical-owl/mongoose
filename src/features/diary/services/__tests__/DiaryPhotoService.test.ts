import type { ImagePickerAsset } from 'expo-image-picker';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import {
  clearDiaryPhotoImageSourceCache,
  DiaryPhotoService,
  diaryPhotoService,
  getDiaryPhotoImageSource,
  resolveImportedDiaryPhotoUri,
} from '@/features/diary/services/DiaryPhotoService';
import { EncryptedMediaStorageService } from '@/services/EncryptedMediaStorageService';

describe('DiaryPhotoService', () => {
  afterEach(() => {
    clearDiaryPhotoImageSourceCache();
  });

  it('stores compatible album JPEG assets encrypted while using a renderable jpg cache', async () => {
    const imported = await diaryPhotoService.importAsset({
      uri: 'file:///picker/IMG_0001.HEIC',
      fileName: 'IMG_0001.HEIC',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 800,
    } as ImagePickerAsset);

    expect(imported.uri.endsWith('.jpg.enc')).toBe(true);
    expect(imported.width).toBe(1200);
    expect(imported.height).toBe(800);
    expect(getDiaryPhotoImageSource(imported.uri)).toEqual({
      uri: expect.stringMatching(/\/media-render-cache\/.+\.jpg$/),
    });
  });

  it('stores the media encryption key in secure storage', async () => {
    const storage: ISecureStorageDataSource = {
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockResolvedValue(undefined),
      removeItem: jest.fn().mockResolvedValue(undefined),
    };
    const service = new DiaryPhotoService(new EncryptedMediaStorageService(storage));

    await service.importAsset({
      uri: 'file:///picker/photo.png',
      fileName: 'photo.png',
      mimeType: 'image/png',
      width: 900,
      height: 900,
    } as ImagePickerAsset);

    expect(storage.setItem).toHaveBeenCalledWith(secureStorageKeys.mediaEncryptionKey, '01'.repeat(32));
  });

  it('resolves persisted imported photo URIs through the current document directory', () => {
    const uri = 'file:///old-container/diary-photos/photo-1.jpg';

    expect(resolveImportedDiaryPhotoUri(uri)).toBe('file:///document/diary-photos/photo-1.jpg');
    expect(getDiaryPhotoImageSource(uri)).toEqual({ uri: 'file:///document/diary-photos/photo-1.jpg' });
  });

  it('resolves encrypted persisted photo URIs through the render cache', () => {
    const uri = 'file:///old-container/diary-photos/photo-1.jpg.enc';

    expect(resolveImportedDiaryPhotoUri(uri)).toBe('file:///document/diary-photos/photo-1.jpg.enc');
    expect(getDiaryPhotoImageSource(uri)).toEqual({ uri: 'file://cache/media-render-cache/photo-1.jpg' });
  });

  it('reuses image source objects for the same resolved imported photo uri', () => {
    const oldContainerUri = 'file:///old-container/diary-photos/photo-1.jpg';
    const currentContainerUri = 'file:///document/diary-photos/photo-1.jpg';

    expect(getDiaryPhotoImageSource(oldContainerUri)).toBe(getDiaryPhotoImageSource(currentContainerUri));
  });
});
