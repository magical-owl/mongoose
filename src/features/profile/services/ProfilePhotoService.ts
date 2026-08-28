import { Directory, File, Paths } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { generateUUID } from '@/shared/utils/uuid';

const PROFILE_PHOTO_DIRECTORY_NAME = 'profile-photos';
const PROFILE_PHOTO_DIRECTORY_MARKER = `/${PROFILE_PHOTO_DIRECTORY_NAME}/`;
const LEGACY_DIARY_PHOTO_DIRECTORY_NAME = 'diary-photos';
const LEGACY_DIARY_PHOTO_DIRECTORY_MARKER = `/${LEGACY_DIARY_PHOTO_DIRECTORY_NAME}/`;

export class ProfilePhotoService {
  public async importAsset(asset: ImagePickerAsset): Promise<string> {
    const id = generateUUID();
    const directory = new Directory(Paths.document, PROFILE_PHOTO_DIRECTORY_NAME);
    directory.create({ idempotent: true, intermediates: true });

    const source = new File(asset.uri);
    const destination = new File(directory, `${id}${getProfilePhotoExtension(asset)}`);
    await source.copy(destination, { overwrite: true });
    return destination.uri;
  }
}

function getImportedProfilePhotoFilename(uri: string, marker: string): string | null {
  const markerIndex = uri.lastIndexOf(marker);
  if (markerIndex < 0) return null;
  const filename = uri.slice(markerIndex + marker.length);
  if (!filename || filename.includes('/')) return null;
  return filename;
}

export function resolveImportedProfilePhotoUri(uri: string): string {
  const profilePhotoFilename = getImportedProfilePhotoFilename(uri, PROFILE_PHOTO_DIRECTORY_MARKER);
  if (profilePhotoFilename) {
    return new File(new Directory(Paths.document, PROFILE_PHOTO_DIRECTORY_NAME), profilePhotoFilename).uri;
  }

  const legacyDiaryPhotoFilename = getImportedProfilePhotoFilename(uri, LEGACY_DIARY_PHOTO_DIRECTORY_MARKER);
  if (legacyDiaryPhotoFilename) {
    return new File(new Directory(Paths.document, LEGACY_DIARY_PHOTO_DIRECTORY_NAME), legacyDiaryPhotoFilename).uri;
  }

  return uri;
}

function getProfilePhotoExtension(asset: ImagePickerAsset): string {
  const filenameExtension = asset.fileName?.match(/\.[a-z0-9]+$/i)?.[0];
  if (filenameExtension) return filenameExtension.toLowerCase();
  if (asset.mimeType === 'image/png') return '.png';
  if (asset.mimeType === 'image/heic') return '.heic';
  if (asset.mimeType === 'image/heif') return '.heif';
  if (asset.mimeType === 'image/webp') return '.webp';
  return '.jpg';
}

export const profilePhotoService = new ProfilePhotoService();
