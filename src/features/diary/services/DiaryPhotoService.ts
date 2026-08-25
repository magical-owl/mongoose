import { Directory, File, Paths } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { generateUUID } from '@/shared/utils/uuid';

const PHOTO_DIRECTORY_NAME = 'diary-photos';

export class DiaryPhotoService {
  public async importAsset(asset: ImagePickerAsset): Promise<DiaryPhoto> {
    const id = generateUUID();
    const directory = new Directory(Paths.document, PHOTO_DIRECTORY_NAME);
    directory.create({ idempotent: true, intermediates: true });

    const source = new File(asset.uri);
    const destination = new File(directory, `${id}${getPhotoExtension(asset)}`);
    await source.copy(destination, { overwrite: true });

    return {
      id,
      uri: destination.uri,
      width: asset.width > 0 ? asset.width : undefined,
      height: asset.height > 0 ? asset.height : undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

function getPhotoExtension(asset: ImagePickerAsset): string {
  const filenameExtension = asset.fileName?.match(/\.[a-z0-9]+$/i)?.[0];
  if (filenameExtension) return filenameExtension.toLowerCase();
  if (asset.mimeType === 'image/png') return '.png';
  if (asset.mimeType === 'image/heic') return '.heic';
  if (asset.mimeType === 'image/heif') return '.heif';
  if (asset.mimeType === 'image/webp') return '.webp';
  return '.jpg';
}

export const diaryPhotoService = new DiaryPhotoService();
