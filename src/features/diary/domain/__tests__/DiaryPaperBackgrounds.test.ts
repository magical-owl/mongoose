import { DEFAULT_DIARY_PAPER_BACKGROUND_ID, DIARY_PAPER_BACKGROUNDS, getDiaryPaperBackgroundSource } from '@/features/diary/domain/DiaryPaperBackgrounds';

describe('DiaryPaperBackgrounds', () => {
  it('exposes blank and the diary body paper backgrounds', () => {
    expect(DIARY_PAPER_BACKGROUNDS.map((background) => background.id)).toEqual([
      'blank',
      'vintage-parchment',
      'soft-lined-paper',
      'cream-dot-paper',
      'warm-grid-paper',
      'rose-memo-paper',
      'blue-notebook-paper',
      'recycled-kraft-paper',
      'pastel-memo-paper',
      'cream-letter-paper',
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

  it('marks baseline papers free and extra papers premium', () => {
    const tiers = Object.fromEntries(DIARY_PAPER_BACKGROUNDS.map((background) => [background.id, background.accessTier]));

    expect(tiers.blank).toBe('free');
    expect(tiers['vintage-parchment']).toBe('free');
    expect(tiers['soft-lined-paper']).toBe('free');
    expect(tiers['recycled-kraft-paper']).toBe('free');
    expect(tiers['pastel-memo-paper']).toBe('premium');
    expect(tiers['cream-letter-paper']).toBe('premium');
  });
});
