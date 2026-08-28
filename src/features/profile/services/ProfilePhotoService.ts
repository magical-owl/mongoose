import { Directory, File, Paths } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { generateUUID } from '@/shared/utils/uuid';

const PROFILE_PHOTO_DIRECTORY_NAME = 'profile-photos';
const PROFILE_PHOTO_DIRECTORY_MARKER = `/${PROFILE_PHOTO_DIRECTORY_NAME}/`;

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

function getImportedProfilePhotoFilename(uri: string): string | null {
  const markerIndex = uri.lastIndexOf(PROFILE_PHOTO_DIRECTORY_MARKER);
  if (markerIndex < 0) return null;
  const filename = uri.slice(markerIndex + PROFILE_PHOTO_DIRECTORY_MARKER.length);
  if (!filename || filename.includes('/')) return null;
  return filename;
}

export function resolveImportedProfilePhotoUri(uri: string): string {
  const filename = getImportedProfilePhotoFilename(uri);
  if (!filename) return uri;
  return new File(new Directory(Paths.document, PROFILE_PHOTO_DIRECTORY_NAME), filename).uri;
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
