import {
  MOMENT_ENTRY_PHOTO_LIMIT,
  normalizeMomentEntryPhotos,
  type DiaryPhoto,
} from '@/features/diary/domain/DiaryEntry';

interface ApplyMomentPhotoImportInput {
  readonly currentCoverPhoto?: DiaryPhoto;
  readonly currentMomentPhotos: readonly DiaryPhoto[];
  readonly importedPhotos: readonly DiaryPhoto[];
}

interface ApplyMomentPhotoImportResult {
  readonly coverPhoto?: DiaryPhoto;
  readonly momentPhotos: DiaryPhoto[];
}

export function getMomentPhotoImportSelectionLimit(
  currentCoverPhoto: DiaryPhoto | undefined,
  currentMomentPhotoCount: number,
): number {
  const remainingMomentSlots = Math.max(0, MOMENT_ENTRY_PHOTO_LIMIT - currentMomentPhotoCount);
  return currentCoverPhoto ? remainingMomentSlots : remainingMomentSlots + 1;
}

export function applyMomentPhotoImport({
  currentCoverPhoto,
  currentMomentPhotos,
  importedPhotos,
}: ApplyMomentPhotoImportInput): ApplyMomentPhotoImportResult {
  if (importedPhotos.length === 0) {
    return {
      coverPhoto: currentCoverPhoto,
      momentPhotos: normalizeMomentEntryPhotos(currentMomentPhotos),
    };
  }

  const [firstImportedPhoto, ...remainingImportedPhotos] = importedPhotos;
  const coverPhoto = currentCoverPhoto ?? firstImportedPhoto;
  const photosForMoment = currentCoverPhoto ? importedPhotos : remainingImportedPhotos;

  return {
    coverPhoto,
    momentPhotos: normalizeMomentEntryPhotos([...currentMomentPhotos, ...photosForMoment]),
  };
}
