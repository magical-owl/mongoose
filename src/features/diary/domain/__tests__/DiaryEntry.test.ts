import { DiaryEntrySchema, MOMENT_ENTRY_PHOTO_LIMIT, normalizeMomentEntryPhotos } from '@/features/diary/domain/DiaryEntry';
import { buildDiaryEntry, buildDiaryPhoto } from '@tests/fixtures/domain';

describe('DiaryEntry', () => {
  it('allows moment entries with photos and no body text', () => {
    const result = DiaryEntrySchema.safeParse(buildDiaryEntry({
      entryType: 'moment',
      title: '',
      content: '',
      photos: [buildDiaryPhoto()],
    }));

    expect(result.success).toBe(true);
  });

  it('requires titles only for diary entries', () => {
    expect(DiaryEntrySchema.safeParse(buildDiaryEntry({
      entryType: 'diary',
      title: '',
    })).success).toBe(false);
    expect(DiaryEntrySchema.safeParse(buildDiaryEntry({
      entryType: 'moment',
      title: '',
      content: '',
      photos: [buildDiaryPhoto()],
    })).success).toBe(true);
  });

  it('keeps diary entries text-first', () => {
    const result = DiaryEntrySchema.safeParse(buildDiaryEntry({
      entryType: 'diary',
      content: '',
      photos: [buildDiaryPhoto()],
    }));

    expect(result.success).toBe(false);
  });

  it('caps normalized moment photos at the moment limit', () => {
    const photos = Array.from({ length: MOMENT_ENTRY_PHOTO_LIMIT + 2 }, (_, index) => buildDiaryPhoto({
      id: `33333333-3333-4333-8333-3333333333${String(index).padStart(2, '0')}`,
    }));

    expect(normalizeMomentEntryPhotos(photos)).toHaveLength(MOMENT_ENTRY_PHOTO_LIMIT);
  });
});
