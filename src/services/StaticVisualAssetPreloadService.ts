import { Image, type ImageSourcePropType } from 'react-native';
import { getAllDiaryPaperBackgroundSources } from '@/features/diary/domain/DiaryPaperBackgrounds';
import { getAllBuiltinJournalCoverImageSources } from '@/features/journal/domain/JournalBackgrounds';

let hasScheduledStaticVisualAssetPreload = false;

function resolveUri(source: ImageSourcePropType): string | undefined {
  const resolved = Image.resolveAssetSource(source);
  return typeof resolved?.uri === 'string' ? resolved.uri : undefined;
}

async function prefetchSources(sources: readonly ImageSourcePropType[]): Promise<void> {
  const uniqueUris = Array.from(new Set(sources.map(resolveUri).filter((uri): uri is string => Boolean(uri))));
  await Promise.all(uniqueUris.map((uri) => Image.prefetch(uri).catch(() => false)));
}

export function preloadStaticVisualAssets(): void {
  if (hasScheduledStaticVisualAssetPreload) return;
  hasScheduledStaticVisualAssetPreload = true;

  setTimeout(() => {
    void prefetchSources([
      ...getAllDiaryPaperBackgroundSources(),
      ...getAllBuiltinJournalCoverImageSources(),
    ]);
  }, 0);
}

export function resetStaticVisualAssetPreloadForTests(): void {
  hasScheduledStaticVisualAssetPreload = false;
}
