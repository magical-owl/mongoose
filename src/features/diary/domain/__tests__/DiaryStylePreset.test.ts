import {
  DEFAULT_DIARY_STYLE_PRESET_ID,
  DIARY_STYLE_PRESETS,
  getDiaryStylePreset,
  isDiaryStylePresetId,
} from '@/features/diary/domain/DiaryStylePreset';
import { DEFAULT_DIARY_PAPER_BACKGROUND_ID } from '@/features/diary/domain/DiaryPaperBackgrounds';

describe('DiaryStylePreset', () => {
  it('uses classic as the default diary style preset', () => {
    const preset = getDiaryStylePreset(undefined);

    expect(preset.id).toBe(DEFAULT_DIARY_STYLE_PRESET_ID);
    expect(preset.paperBackgroundId).toBe(DEFAULT_DIARY_PAPER_BACKGROUND_ID);
  });

  it('recognizes supported preset ids', () => {
    expect(isDiaryStylePresetId('kraft')).toBe(true);
    expect(isDiaryStylePresetId('unknown')).toBe(false);
  });

  it('keeps the base presets on free diary paper backgrounds', () => {
    expect(DIARY_STYLE_PRESETS.filter((preset) => preset.accessTier === 'free').map((preset) => preset.paperBackgroundId)).toEqual([
      'vintage-parchment',
      'soft-lined-paper',
      'recycled-kraft-paper',
      'blank',
    ]);
  });

  it('includes five premium diary style presets', () => {
    expect(DIARY_STYLE_PRESETS.filter((preset) => preset.accessTier === 'premium')).toHaveLength(5);
  });
});
