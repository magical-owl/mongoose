import type { ImageSourcePropType } from 'react-native';

export interface DiaryPaperBackground {
  readonly id: string;
  readonly label: string;
  readonly source: ImageSourcePropType;
}

export const DIARY_PAPER_BACKGROUNDS = [
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
] as const satisfies readonly DiaryPaperBackground[];

export function getDiaryPaperBackgroundSource(id: string): ImageSourcePropType {
  return DIARY_PAPER_BACKGROUNDS.find((background) => background.id === id)?.source ?? DIARY_PAPER_BACKGROUNDS[0].source;
}
