import type { ImageSourcePropType } from 'react-native';

export interface DiaryPaperBackground {
  readonly id: string;
  readonly label: string;
  readonly source?: ImageSourcePropType;
}

export const DIARY_PAPER_BACKGROUNDS = [
  {
    id: 'blank',
    label: 'Blank',
    source: undefined,
  },
  {
    id: 'vintage-parchment',
    label: 'Vintage parchment',
    source: require('../../../../assets/diary-paper/vintage-parchment.png') as ImageSourcePropType,
  },
  {
    id: 'soft-lined-paper',
    label: 'Soft lined paper',
    source: require('../../../../assets/diary-paper/soft-lined-paper.png') as ImageSourcePropType,
  },
  {
    id: 'cream-dot-paper',
    label: 'Pressed petal paper',
    source: require('../../../../assets/diary-paper/cream-dot-paper.png') as ImageSourcePropType,
  },
  {
    id: 'warm-grid-paper',
    label: 'Taped note paper',
    source: require('../../../../assets/diary-paper/warm-grid-paper.png') as ImageSourcePropType,
  },
  {
    id: 'rose-memo-paper',
    label: 'Rose memo paper',
    source: require('../../../../assets/diary-paper/rose-memo-paper.png') as ImageSourcePropType,
  },
  {
    id: 'blue-notebook-paper',
    label: 'Blue notebook paper',
    source: require('../../../../assets/diary-paper/blue-notebook-paper.png') as ImageSourcePropType,
  },
] as const satisfies readonly DiaryPaperBackground[];

export const DEFAULT_DIARY_PAPER_BACKGROUND_ID = 'vintage-parchment';

export function getDiaryPaperBackground(id: string): DiaryPaperBackground {
  return DIARY_PAPER_BACKGROUNDS.find((background) => background.id === id)
    ?? DIARY_PAPER_BACKGROUNDS.find((background) => background.source)
    ?? DIARY_PAPER_BACKGROUNDS[0];
}

export function getDiaryPaperBackgroundSource(id: string): ImageSourcePropType | undefined {
  return getDiaryPaperBackground(id).source;
}
