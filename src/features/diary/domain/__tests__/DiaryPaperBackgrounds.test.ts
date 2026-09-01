import { DIARY_PAPER_BACKGROUNDS, getDiaryPaperBackgroundSource } from '@/features/diary/domain/DiaryPaperBackgrounds';

describe('DiaryPaperBackgrounds', () => {
  it('exposes only the initial two diary body paper backgrounds', () => {
    expect(DIARY_PAPER_BACKGROUNDS.map((background) => background.id)).toEqual([
      'vintage-parchment',
      'soft-lined-paper',
    ]);
  });

  it('falls back to vintage parchment for unknown paper background IDs', () => {
    expect(getDiaryPaperBackgroundSource('missing-paper')).toBe(getDiaryPaperBackgroundSource('vintage-parchment'));
  });
});
