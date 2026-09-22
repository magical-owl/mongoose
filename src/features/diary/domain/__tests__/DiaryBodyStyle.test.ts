import {
  getDiaryBodyPlaceholderColor,
  normalizeDiaryBodyFontFamily,
  normalizeDiaryBodyTextColor,
} from '@/features/diary/domain/DiaryBodyStyle';

describe('DiaryBodyStyle', () => {
  it('normalizes body font family values', () => {
    expect(normalizeDiaryBodyFontFamily('lora')).toBe('lora');
    expect(normalizeDiaryBodyFontFamily('unknown')).toBe('system');
  });

  it('only accepts supported body text colors', () => {
    expect(normalizeDiaryBodyTextColor('#FFF7E6')).toBe('#FFF7E6');
    expect(normalizeDiaryBodyTextColor('#000000')).toBeUndefined();
  });

  it('uses a readable diary-paper placeholder fallback', () => {
    expect(getDiaryBodyPlaceholderColor(undefined)).toBe('#6B4E3D');
    expect(getDiaryBodyPlaceholderColor('#FFF7E6')).toBe('#FFF7E6');
  });
});
