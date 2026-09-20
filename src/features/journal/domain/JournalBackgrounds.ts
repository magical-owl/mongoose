import type { ImageSourcePropType } from "react-native";

export const BUILTIN_JOURNAL_COVER_PREFIX = "builtin://journal-background/";
export const DEFAULT_JOURNAL_BACKGROUND_ID = "default-journal";
export const DEFAULT_JOURNAL_BACKGROUND_URI = `${BUILTIN_JOURNAL_COVER_PREFIX}${DEFAULT_JOURNAL_BACKGROUND_ID}`;
export const DEFAULT_JOURNAL_BACKGROUND_WIDTH = 1280;
export const DEFAULT_JOURNAL_BACKGROUND_HEIGHT = 720;

export interface BuiltinJournalBackground {
  readonly id: string;
  readonly title: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly source: ImageSourcePropType;
  readonly accessTier: "free" | "premium";
}

export const BUILTIN_JOURNAL_BACKGROUNDS: readonly BuiltinJournalBackground[] =
  [
    {
      id: DEFAULT_JOURNAL_BACKGROUND_ID,
      title: "Default Journal",
      uri: DEFAULT_JOURNAL_BACKGROUND_URI,
      width: DEFAULT_JOURNAL_BACKGROUND_WIDTH,
      height: DEFAULT_JOURNAL_BACKGROUND_HEIGHT,
      source: require("../../../../assets/journal-backgrounds/default-journal.jpg"),
      accessTier: "free",
    },
    {
      id: "meadow-day",
      title: "Meadow - Day",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}meadow-day`,
      width: 1280,
      height: 720,
      source: require("../../../../assets/journal-backgrounds/meadow-day.jpg"),
      accessTier: "free",
    },
    {
      id: "meadow-sunset",
      title: "Meadow - Sunset",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}meadow-sunset`,
      width: 1280,
      height: 720,
      source: require("../../../../assets/journal-backgrounds/meadow-sunset.jpg"),
      accessTier: "premium",
    },
    {
      id: "meadow-night",
      title: "Meadow - Night",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}meadow-night`,
      width: 1280,
      height: 720,
      source: require("../../../../assets/journal-backgrounds/meadow-night.jpg"),
      accessTier: "premium",
    },
    {
      id: "winter",
      title: "Winter",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}winter`,
      width: 1280,
      height: 720,
      source: require("../../../../assets/journal-backgrounds/winter.jpg"),
      accessTier: "premium",
    },
    {
      id: "summer",
      title: "Summer",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}summer`,
      width: 1280,
      height: 720,
      source: require("../../../../assets/journal-backgrounds/summer.jpg"),
      accessTier: "premium",
    },
    {
      id: "moonlit-lake",
      title: "Moonlit Lake",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}moonlit-lake`,
      width: 1280,
      height: 720,
      source: require("../../../../assets/journal-backgrounds/moonlit-lake.jpg"),
      accessTier: "premium",
    },
    {
      id: "mountain-sunrise",
      title: "Mountain Sunrise",
      uri: `${BUILTIN_JOURNAL_COVER_PREFIX}mountain-sunrise`,
      width: 1280,
      height: 720,
      source: require("../../../../assets/journal-backgrounds/mountain-sunrise.jpg"),
      accessTier: "premium",
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
  if (uri?.startsWith(BUILTIN_JOURNAL_COVER_PREFIX)) {
    return BUILTIN_JOURNAL_BACKGROUNDS[0]?.source;
  }
  return uri ? { uri } : undefined;
}

export function getAllBuiltinJournalCoverImageSources(): ImageSourcePropType[] {
  return BUILTIN_JOURNAL_BACKGROUNDS.map((background) => background.source);
}
