import type { ImageSourcePropType } from 'react-native';

export interface DiaryPaperBackground {
  readonly id: string;
  readonly label: string;
  readonly accessTier: 'free' | 'premium';
  readonly source?: ImageSourcePropType;
}

export const DIARY_PAPER_BACKGROUNDS = [
  {
    id: 'blank',
    label: 'Blank',
    accessTier: 'free',
    source: undefined,
  },
  {
    id: 'vintage-parchment',
    label: 'Vintage parchment',
    accessTier: 'free',
    source: require('../../../../assets/diary-paper/vintage-parchment.jpg') as ImageSourcePropType,
  },
  {
    id: 'soft-lined-paper',
    label: 'Soft lined paper',
    accessTier: 'free',
    source: require('../../../../assets/diary-paper/soft-lined-paper.jpg') as ImageSourcePropType,
  },
  {
    id: 'cream-dot-paper',
    label: 'Pressed petal paper',
    accessTier: 'premium',
    source: require('../../../../assets/diary-paper/cream-dot-paper.jpg') as ImageSourcePropType,
  },
  {
    id: 'warm-grid-paper',
    label: 'Taped note paper',
    accessTier: 'premium',
    source: require('../../../../assets/diary-paper/warm-grid-paper.jpg') as ImageSourcePropType,
  },
  {
    id: 'rose-memo-paper',
    label: 'Rose memo paper',
    accessTier: 'premium',
    source: require('../../../../assets/diary-paper/rose-memo-paper.jpg') as ImageSourcePropType,
  },
  {
    id: 'blue-notebook-paper',
    label: 'Blue notebook paper',
    accessTier: 'premium',
    source: require('../../../../assets/diary-paper/blue-notebook-paper.jpg') as ImageSourcePropType,
  },
  {
    id: 'recycled-kraft-paper',
    label: 'Recycled kraft paper',
    accessTier: 'free',
    source: require('../../../../assets/diary-paper/recycled-kraft-paper.jpg') as ImageSourcePropType,
  },
  {
    id: 'pastel-memo-paper',
    label: 'Pastel memo paper',
    accessTier: 'premium',
    source: require('../../../../assets/diary-paper/pastel-memo-paper.jpg') as ImageSourcePropType,
  },
  {
    id: 'cream-letter-paper',
    label: 'Cream letter paper',
    accessTier: 'premium',
    source: require('../../../../assets/diary-paper/cream-letter-paper.jpg') as ImageSourcePropType,
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

export function getAllDiaryPaperBackgroundSources(): ImageSourcePropType[] {
  return DIARY_PAPER_BACKGROUNDS
    .map((background) => background.source)
    .filter((source): source is ImageSourcePropType => Boolean(source));
}
