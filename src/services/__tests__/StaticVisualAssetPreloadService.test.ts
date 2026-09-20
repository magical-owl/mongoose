import { Image } from 'react-native';
import {
  preloadStaticVisualAssets,
  resetStaticVisualAssetPreloadForTests,
} from '../StaticVisualAssetPreloadService';

jest.mock('@/features/diary/domain/DiaryPaperBackgrounds', () => ({
  getAllDiaryPaperBackgroundSources: () => [
    { uri: 'paper://vintage' },
    { uri: 'paper://vintage' },
  ],
}));

jest.mock('@/features/journal/domain/JournalBackgrounds', () => ({
  getAllBuiltinJournalCoverImageSources: () => [
    { uri: 'journal://meadow-day' },
  ],
}));

describe('StaticVisualAssetPreloadService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetStaticVisualAssetPreloadForTests();
    jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('prefetches unique diary paper and journal cover assets after startup work is scheduled', () => {
    preloadStaticVisualAssets();
    jest.runOnlyPendingTimers();

    expect(Image.prefetch).toHaveBeenCalledTimes(2);
    expect(Image.prefetch).toHaveBeenCalledWith('paper://vintage');
    expect(Image.prefetch).toHaveBeenCalledWith('journal://meadow-day');
  });

  it('schedules static visual asset preloading only once', () => {
    preloadStaticVisualAssets();
    preloadStaticVisualAssets();
    jest.runOnlyPendingTimers();

    expect(Image.prefetch).toHaveBeenCalledTimes(2);
  });
});
