import { MOMENT_ENTRY_PHOTO_LIMIT } from '@/features/diary/domain/DiaryEntry';
import { buildDiaryPhoto } from '@tests/fixtures/domain';
import { applyMomentPhotoImport, getMomentPhotoImportSelectionLimit } from '../MomentPhotoImportService';

function buildPhoto(index: number) {
  return buildDiaryPhoto({
    id: `33333333-3333-4333-8333-3333333333${String(index).padStart(2, '0')}`,
    uri: `file:///photo-${index}.jpg`,
  });
}

describe('MomentPhotoImportService', () => {
  it('reserves the first imported photo as the cover when no cover exists', () => {
    const importedPhotos = [buildPhoto(1), buildPhoto(2), buildPhoto(3)];

    const result = applyMomentPhotoImport({
      currentCoverPhoto: undefined,
      currentMomentPhotos: [],
      importedPhotos,
    });

    expect(result.coverPhoto).toBe(importedPhotos[0]);
    expect(result.momentPhotos).toEqual([importedPhotos[1], importedPhotos[2]]);
  });

  it('keeps an existing cover and appends every imported photo to the moment side', () => {
    const coverPhoto = buildPhoto(10);
    const importedPhotos = [buildPhoto(1), buildPhoto(2)];

    const result = applyMomentPhotoImport({
      currentCoverPhoto: coverPhoto,
      currentMomentPhotos: [buildPhoto(20)],
      importedPhotos,
    });

    expect(result.coverPhoto).toBe(coverPhoto);
    expect(result.momentPhotos).toEqual([buildPhoto(20), ...importedPhotos]);
  });

  it('caps moment photos at the moment limit after reserving a cover', () => {
    const importedPhotos = Array.from({ length: MOMENT_ENTRY_PHOTO_LIMIT + 2 }, (_, index) => buildPhoto(index + 1));

    const result = applyMomentPhotoImport({
      currentCoverPhoto: undefined,
      currentMomentPhotos: [],
      importedPhotos,
    });

    expect(result.coverPhoto).toBe(importedPhotos[0]);
    expect(result.momentPhotos).toHaveLength(MOMENT_ENTRY_PHOTO_LIMIT);
    expect(result.momentPhotos[0]).toBe(importedPhotos[1]);
  });

  it('allows one extra picker slot for the cover when no cover exists', () => {
    expect(getMomentPhotoImportSelectionLimit(undefined, 0)).toBe(MOMENT_ENTRY_PHOTO_LIMIT + 1);
    expect(getMomentPhotoImportSelectionLimit(buildPhoto(1), 0)).toBe(MOMENT_ENTRY_PHOTO_LIMIT);
  });

  it('still allows picking a cover when moment photos are already full', () => {
    expect(getMomentPhotoImportSelectionLimit(undefined, MOMENT_ENTRY_PHOTO_LIMIT)).toBe(1);
    expect(getMomentPhotoImportSelectionLimit(buildPhoto(1), MOMENT_ENTRY_PHOTO_LIMIT)).toBe(0);
  });
});
