import { Directory, File, Paths } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { ImageSourcePropType } from 'react-native';
import type { DiaryEntry, DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import { getJournalCoverImageSource } from '@/features/journal/domain/JournalBackgrounds';
import { generateUUID } from '@/shared/utils/uuid';

const PHOTO_DIRECTORY_NAME = 'diary-photos';
const PHOTO_DIRECTORY_MARKER = `/${PHOTO_DIRECTORY_NAME}/`;

export interface IDiaryPhotoCleanupService {
  deleteEntryPhotos(entry: DiaryEntry): Promise<void>;
  clearImportedPhotos(): Promise<void>;
}

export class DiaryPhotoService implements IDiaryPhotoCleanupService {
  public async importAsset(asset: ImagePickerAsset): Promise<DiaryPhoto> {
    const id = generateUUID();
    const directory = this.getPhotoDirectory();
    directory.create({ idempotent: true, intermediates: true });

    const source = new File(asset.uri);
    const destination = new File(directory, `${id}${getPhotoExtension(asset)}`);
    await source.copy(destination, { overwrite: true });

    return {
      id,
      uri: normalizeLocalFileUri(destination.uri),
      width: asset.width > 0 ? asset.width : undefined,
      height: asset.height > 0 ? asset.height : undefined,
      createdAt: new Date().toISOString(),
    };
  }

  public async deleteEntryPhotos(entry: DiaryEntry): Promise<void> {
    const uris = new Set<string>();
    if (entry.coverPhoto) uris.add(entry.coverPhoto.uri);
    entry.photos.forEach((photo) => uris.add(photo.uri));
    entry.stickers.forEach((sticker) => {
      if (sticker.imageUri) uris.add(sticker.imageUri);
    });

    await Promise.all(
      Array.from(uris)
        .filter((uri) => this.isImportedPhotoUri(uri))
        .map((uri) => this.deleteFileIfExists(uri))
    );
  }

  public async clearImportedPhotos(): Promise<void> {
    const directory = this.getPhotoDirectory();
    if (!directory.exists) return;
    directory.delete();
  }

  private getPhotoDirectory(): Directory {
    return new Directory(Paths.document, PHOTO_DIRECTORY_NAME);
  }

  private isImportedPhotoUri(uri: string): boolean {
    return uri.startsWith(this.getPhotoDirectory().uri) || getImportedPhotoFilename(uri) !== null;
  }

  private async deleteFileIfExists(uri: string): Promise<void> {
    const file = new File(resolveImportedDiaryPhotoUri(uri));
    if (!file.exists) return;
    file.delete();
  }
}

function getImportedPhotoFilename(uri: string): string | null {
  const markerIndex = uri.lastIndexOf(PHOTO_DIRECTORY_MARKER);
  if (markerIndex < 0) return null;
  const filename = uri.slice(markerIndex + PHOTO_DIRECTORY_MARKER.length);
  if (!filename || filename.includes('/')) return null;
  return filename;
}

export function resolveImportedDiaryPhotoUri(uri: string): string {
  const filename = getImportedPhotoFilename(uri);
  if (!filename) return uri;
  return normalizeLocalFileUri(new File(new Directory(Paths.document, PHOTO_DIRECTORY_NAME), filename).uri);
}

export function getDiaryPhotoImageSource(uri: string): ImageSourcePropType | undefined {
  return getJournalCoverImageSource(resolveImportedDiaryPhotoUri(uri));
}

function getPhotoExtension(asset: ImagePickerAsset): string {
  if (asset.mimeType === 'image/jpeg' || asset.mimeType === 'image/jpg') return '.jpg';
  if (asset.mimeType === 'image/png') return '.png';
  if (asset.mimeType === 'image/webp') return '.webp';
  const filenameExtension = asset.fileName?.match(/\.[a-z0-9]+$/i)?.[0];
  if (filenameExtension) return filenameExtension.toLowerCase();
  return '.jpg';
}

function normalizeLocalFileUri(uri: string): string {
  if (!uri.startsWith('file://') || uri.startsWith('file:///')) return uri;
  return `file:///${uri.slice('file://'.length)}`;
}

export const diaryPhotoService = new DiaryPhotoService();

export function createPlacedPhotoSticker(photo: DiaryPhoto, index: number): PlacedSticker {
  return {
    id: photo.id,
    stickerId: `photo:${photo.id}`,
    category: 'photos',
    imageUri: resolveImportedDiaryPhotoUri(photo.uri),
    imageWidth: photo.width,
    imageHeight: photo.height,
    x: 36 + (index % 3) * 42,
    y: 132 + (index % 4) * 34,
    scale: 1,
    rotation: 0,
    zIndex: index + 1,
    behindText: false,
  };
}
