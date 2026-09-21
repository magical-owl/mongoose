import type { ImagePickerAsset } from 'expo-image-picker';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import {
  clearDiaryPhotoImageSourceCache,
  createPlacedPhotoSticker,
  DiaryPhotoService,
  diaryPhotoService,
  getDiaryPhotoImageSource,
  mergePlacedStickersWithMomentPhotoStickers,
  resolveImportedDiaryPhotoUri,
} from '@/features/diary/services/DiaryPhotoService';
import { EncryptedMediaStorageService } from '@/services/EncryptedMediaStorageService';
import { buildDiaryPhoto } from '@tests/fixtures/domain';

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

  it('does not duplicate generated moment photo stickers when hydrating drafts', () => {
    const photo = buildDiaryPhoto({
      id: '33333333-3333-4333-8333-333333333301',
      uri: 'file:///document/diary-photos/photo-1.jpg',
    });
    const existingPhotoSticker = createPlacedPhotoSticker(photo, 0);

    const merged = mergePlacedStickersWithMomentPhotoStickers([existingPhotoSticker], [photo]);

    expect(merged).toEqual([existingPhotoSticker]);
  });

  it('drops duplicate sticker ids before adding missing moment photo stickers', () => {
    const firstPhoto = buildDiaryPhoto({
      id: '33333333-3333-4333-8333-333333333301',
      uri: 'file:///document/diary-photos/photo-1.jpg',
    });
    const secondPhoto = buildDiaryPhoto({
      id: '33333333-3333-4333-8333-333333333302',
      uri: 'file:///document/diary-photos/photo-2.jpg',
    });
    const duplicateSticker = createPlacedPhotoSticker(firstPhoto, 0);
    const duplicateStickerCopy = { ...duplicateSticker, x: duplicateSticker.x + 40 };

    const merged = mergePlacedStickersWithMomentPhotoStickers(
      [duplicateSticker, duplicateStickerCopy],
      [firstPhoto, secondPhoto],
    );

    expect(merged.map((sticker) => sticker.id)).toEqual([firstPhoto.id, secondPhoto.id]);
  });
});
