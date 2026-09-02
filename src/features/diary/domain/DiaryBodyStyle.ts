import { z } from 'zod';

export const DiaryBodyFontFamilySchema = z.enum(['system', 'inter', 'nunito', 'lora', 'merriweather', 'sourceCodePro']);
export type DiaryBodyFontFamily = z.infer<typeof DiaryBodyFontFamilySchema>;

export const DIARY_BODY_DEFAULT_FONT_FAMILY: DiaryBodyFontFamily = 'system';

export const DIARY_BODY_TEXT_COLORS = [
  { id: 'cream', label: 'Cream', value: '#FFF7E6' },
  { id: 'ink', label: 'Ink', value: '#2F2A24' },
  { id: 'sepia', label: 'Sepia', value: '#6B4E3D' },
  { id: 'sage', label: 'Sage', value: '#DCE8C8' },
  { id: 'rose', label: 'Rose', value: '#F3C6C1' },
  { id: 'blue', label: 'Blue', value: '#D7E7FF' },
] as const;

export type DiaryBodyTextColor = (typeof DIARY_BODY_TEXT_COLORS)[number]['value'];

export const DiaryBodyTextColorSchema = z.enum([
  '#FFF7E6',
  '#2F2A24',
  '#6B4E3D',
  '#DCE8C8',
  '#F3C6C1',
  '#D7E7FF',
]);

export function normalizeDiaryBodyFontFamily(value: unknown): DiaryBodyFontFamily {
  const parsed = DiaryBodyFontFamilySchema.safeParse(value);
  return parsed.success ? parsed.data : DIARY_BODY_DEFAULT_FONT_FAMILY;
}

export function normalizeDiaryBodyTextColor(value: unknown): DiaryBodyTextColor | undefined {
  const parsed = DiaryBodyTextColorSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
