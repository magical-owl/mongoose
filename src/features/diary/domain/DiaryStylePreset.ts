import {
  DIARY_BODY_DEFAULT_FONT_FAMILY,
  type DiaryBodyFontFamily,
  type DiaryBodyTextColor,
} from '@/features/diary/domain/DiaryBodyStyle';
import { DEFAULT_DIARY_PAPER_BACKGROUND_ID } from '@/features/diary/domain/DiaryPaperBackgrounds';

export type DiaryStylePresetId =
  | 'classic'
  | 'notebook'
  | 'kraft'
  | 'minimal'
  | 'pressed-petal'
  | 'taped-note'
  | 'rose-letter'
  | 'blue-study'
  | 'cream-letter';

export interface DiaryStylePreset {
  readonly id: DiaryStylePresetId;
  readonly accessTier: 'free' | 'premium';
  readonly paperBackgroundId: string;
  readonly bodyFontFamily: DiaryBodyFontFamily;
  readonly bodyTextColor?: DiaryBodyTextColor;
}

export const DEFAULT_DIARY_STYLE_PRESET_ID: DiaryStylePresetId = 'classic';

export const DIARY_STYLE_PRESETS = [
  {
    id: 'classic',
    accessTier: 'free',
    paperBackgroundId: DEFAULT_DIARY_PAPER_BACKGROUND_ID,
    bodyFontFamily: DIARY_BODY_DEFAULT_FONT_FAMILY,
  },
  {
    id: 'notebook',
    accessTier: 'free',
    paperBackgroundId: 'soft-lined-paper',
    bodyFontFamily: 'lora',
    bodyTextColor: '#2F2A24',
  },
  {
    id: 'kraft',
    accessTier: 'free',
    paperBackgroundId: 'recycled-kraft-paper',
    bodyFontFamily: 'merriweather',
    bodyTextColor: '#FFF7E6',
  },
  {
    id: 'minimal',
    accessTier: 'free',
    paperBackgroundId: 'blank',
    bodyFontFamily: DIARY_BODY_DEFAULT_FONT_FAMILY,
  },
  {
    id: 'pressed-petal',
    accessTier: 'premium',
    paperBackgroundId: 'cream-dot-paper',
    bodyFontFamily: 'lora',
    bodyTextColor: '#6B4E3D',
  },
  {
    id: 'taped-note',
    accessTier: 'premium',
    paperBackgroundId: 'warm-grid-paper',
    bodyFontFamily: 'nunito',
    bodyTextColor: '#2F2A24',
  },
  {
    id: 'rose-letter',
    accessTier: 'premium',
    paperBackgroundId: 'rose-memo-paper',
    bodyFontFamily: 'merriweather',
    bodyTextColor: '#6B4E3D',
  },
  {
    id: 'blue-study',
    accessTier: 'premium',
    paperBackgroundId: 'blue-notebook-paper',
    bodyFontFamily: 'inter',
    bodyTextColor: '#2F2A24',
  },
  {
    id: 'cream-letter',
    accessTier: 'premium',
    paperBackgroundId: 'cream-letter-paper',
    bodyFontFamily: 'merriweather',
    bodyTextColor: '#6B4E3D',
  },
] as const satisfies readonly DiaryStylePreset[];

export function isDiaryStylePresetId(value: unknown): value is DiaryStylePresetId {
  return DIARY_STYLE_PRESETS.some((preset) => preset.id === value);
}

export function getDiaryStylePreset(id: string | null | undefined): DiaryStylePreset {
  return DIARY_STYLE_PRESETS.find((preset) => preset.id === id)
    ?? DIARY_STYLE_PRESETS.find((preset) => preset.id === DEFAULT_DIARY_STYLE_PRESET_ID)
    ?? DIARY_STYLE_PRESETS[0]!;
}
