import { insightsMetricUnitLabel, translate, type TranslationKey } from '../i18n';

const t = (key: TranslationKey) => translate('en', key);

describe('i18n insight metric labels', () => {
  it('uses singular labels for one metric item', () => {
    expect(insightsMetricUnitLabel('entry', 1, t)).toBe('entry');
    expect(insightsMetricUnitLabel('word', 1, t)).toBe('word');
    expect(insightsMetricUnitLabel('sticker', 1, t)).toBe('sticker');
    expect(insightsMetricUnitLabel('writingDay', 1, t)).toBe('writing day');
    expect(insightsMetricUnitLabel('reflection', 1, t)).toBe('reflection');
  });

  it('uses plural labels for zero and multiple metric items', () => {
    expect(insightsMetricUnitLabel('entry', 0, t)).toBe('entries');
    expect(insightsMetricUnitLabel('word', 2, t)).toBe('words');
    expect(insightsMetricUnitLabel('sticker', 0, t)).toBe('stickers');
    expect(insightsMetricUnitLabel('writingDay', 3, t)).toBe('writing days');
    expect(insightsMetricUnitLabel('reflection', 0, t)).toBe('reflections');
  });
});
