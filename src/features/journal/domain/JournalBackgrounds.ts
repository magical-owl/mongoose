import type { ImageSourcePropType } from "react-native";

export const BUILTIN_JOURNAL_COVER_PREFIX = "builtin://journal-background/";

export interface BuiltinJournalBackground {
  readonly id: string;
  readonly title: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly source: ImageSourcePropType;
}

export const BUILTIN_JOURNAL_BACKGROUNDS: readonly BuiltinJournalBackground[] =
  [
    {
      id: "winter",
      title: "Winter",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}winter`,
      width: 1672,
      height: 940,
      source: require("../../../../assets/journal-backgrounds/winter.png"),
    },
    {
      id: "spring",
      title: "Spring",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}spring`,
      width: 1672,
      height: 941,
      source: require("../../../../assets/journal-backgrounds/spring.png"),
    },
    {
      id: "summer",
      title: "Summer",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}summer`,
      width: 1672,
      height: 941,
      source: require("../../../../assets/journal-backgrounds/summer.png"),
    },
    {
      id: "fall",
      title: "Fall",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}fall`,
      width: 1672,
      height: 941,
      source: require("../../../../assets/journal-backgrounds/fall.png"),
    },
    {
      id: "moonlit-lake",
      title: "Moonlit Lake",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}moonlit-lake`,
      width: 1672,
      height: 941,
      source: require("../../../../assets/journal-backgrounds/moonlit-lake.png"),
    },
    {
      id: "cozy-reading-nook",
      title: "Cozy Reading Nook",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}cozy-reading-nook`,
      width: 1672,
      height: 941,
      source: require("../../../../assets/journal-backgrounds/cozy-reading-nook.png"),
    },
    {
      id: "school",
      title: "School",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}school`,
      width: 1672,
      height: 941,
      source: require("../../../../assets/journal-backgrounds/school.png"),
    },
    {
      id: "office",
      title: "Office",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}office`,
      width: 1672,
      height: 941,
      source: require("../../../../assets/journal-backgrounds/office.png"),
    },
    {
      id: "rainy-window",
      title: "Rainy Window",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}rainy-window`,
      width: 1672,
      height: 941,
      source: require("../../../../assets/journal-backgrounds/rainy-window.png"),
    },
    {
      id: "mountain-sunrise",
      title: "Mountain Sunrise",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}mountain-sunrise`,
      width: 1672,
      height: 941,
      source: require("../../../../assets/journal-backgrounds/mountain-sunrise.png"),
    },
    {
      id: "greenhouse",
      title: "Greenhouse",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}greenhouse`,
      width: 1672,
      height: 941,
      source: require("../../../../assets/journal-backgrounds/greenhouse.png"),
    },
    {
      id: "cafe-morning",
      title: "Cafe Morning",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}cafe-morning`,
      width: 1672,
      height: 941,
      source: require("../../../../assets/journal-backgrounds/cafe-morning.png"),
    },
  ];

export function findBuiltinJournalBackground(
  uri?: string,
): BuiltinJournalBackground | undefined {
  if (!uri?.startsWith(BUILTIN_JOURNAL_COVER_PREFIX)) return undefined;
  return BUILTIN_JOURNAL_BACKGROUNDS.find(
    (background) => background.uri === uri,
  );
}

export function getJournalCoverImageSource(
  uri?: string,
): ImageSourcePropType | undefined {
  const builtin = findBuiltinJournalBackground(uri);
  if (builtin) return builtin.source;
  if (uri?.startsWith(BUILTIN_JOURNAL_COVER_PREFIX)) return undefined;
  return uri ? { uri } : undefined;
}
