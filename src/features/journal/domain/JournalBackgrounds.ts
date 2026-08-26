import type { ImageSourcePropType } from 'react-native';

export const BUILTIN_JOURNAL_COVER_PREFIX = 'builtin://journal-background/';

export interface BuiltinJournalBackground {
  readonly id: string;
  readonly title: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly source: ImageSourcePropType;
}

export const BUILTIN_JOURNAL_BACKGROUNDS: readonly BuiltinJournalBackground[] = [
  {
    id: 'botanical-desk',
    title: 'Botanical Desk',
    uri: `${BUILTIN_JOURNAL_COVER_PREFIX}botanical-desk`,
    width: 1672,
    height: 941,
    source: require('../../../../assets/journal-backgrounds/botanical-desk.png'),
  },
  {
    id: 'moonlit-lake',
    title: 'Moonlit Lake',
    uri: `${BUILTIN_JOURNAL_COVER_PREFIX}moonlit-lake`,
    width: 1672,
    height: 941,
    source: require('../../../../assets/journal-backgrounds/moonlit-lake.png'),
  },
  {
    id: 'cozy-reading-nook',
    title: 'Cozy Reading Nook',
    uri: `${BUILTIN_JOURNAL_COVER_PREFIX}cozy-reading-nook`,
    width: 1672,
    height: 941,
    source: require('../../../../assets/journal-backgrounds/cozy-reading-nook.png'),
  },
  {
    id: 'school',
    title: 'School',
    uri: `${BUILTIN_JOURNAL_COVER_PREFIX}school`,
    width: 1672,
    height: 941,
    source: require('../../../../assets/journal-backgrounds/school.png'),
  },
  {
    id: 'office',
    title: 'Office',
    uri: `${BUILTIN_JOURNAL_COVER_PREFIX}office`,
    width: 1672,
    height: 941,
    source: require('../../../../assets/journal-backgrounds/office.png'),
  },
  {
    id: 'summer',
    title: 'Summer',
    uri: `${BUILTIN_JOURNAL_COVER_PREFIX}summer`,
    width: 1672,
    height: 941,
    source: require('../../../../assets/journal-backgrounds/summer.png'),
  },
];

export function findBuiltinJournalBackground(uri?: string): BuiltinJournalBackground | undefined {
  if (!uri?.startsWith(BUILTIN_JOURNAL_COVER_PREFIX)) return undefined;
  return BUILTIN_JOURNAL_BACKGROUNDS.find((background) => background.uri === uri);
}

export function getJournalCoverImageSource(uri?: string): ImageSourcePropType | undefined {
  const builtin = findBuiltinJournalBackground(uri);
  if (builtin) return builtin.source;
  return uri ? { uri } : undefined;
}
