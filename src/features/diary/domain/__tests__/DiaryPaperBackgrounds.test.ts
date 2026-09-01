import { DEFAULT_DIARY_PAPER_BACKGROUND_ID, DIARY_PAPER_BACKGROUNDS, getDiaryPaperBackgroundSource } from '@/features/diary/domain/DiaryPaperBackgrounds';

describe('DiaryPaperBackgrounds', () => {
  it('exposes blank and the initial two diary body paper backgrounds', () => {
    expect(DIARY_PAPER_BACKGROUNDS.map((background) => background.id)).toEqual([
      'blank',
      'vintage-parchment',
      'soft-lined-paper',
    ]);
  });

  it('falls back to vintage parchment for unknown paper background IDs', () => {
    expect(getDiaryPaperBackgroundSource('missing-paper')).toBe(getDiaryPaperBackgroundSource('vintage-parchment'));
  });

  it('exposes vintage parchment as the default diary paper background', () => {
    expect(DEFAULT_DIARY_PAPER_BACKGROUND_ID).toBe('vintage-parchment');
  });

  it('uses no image source for the blank diary background', () => {
    expect(getDiaryPaperBackgroundSource('blank')).toBeUndefined();
  });
});
