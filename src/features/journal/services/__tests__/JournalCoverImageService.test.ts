import { getJournalCoverRenderableSource } from '@/features/journal/services/JournalCoverImageService';
import {
  BUILTIN_JOURNAL_BACKGROUNDS,
  BUILTIN_JOURNAL_COVER_PREFIX,
} from '@/features/journal/domain/JournalBackgrounds';

jest.mock('@/features/diary/services/DiaryPhotoService', () => ({
  getDiaryPhotoImageSource: jest.fn((uri: string) => ({ uri: `render-cache:${uri}` })),
}));

describe('JournalCoverImageService', () => {
  it('uses built-in sources for built-in journal covers', () => {
    const builtin = BUILTIN_JOURNAL_BACKGROUNDS[0]!;

    expect(getJournalCoverRenderableSource(builtin.uri)).toBe(builtin.source);
    expect(getJournalCoverRenderableSource(`${BUILTIN_JOURNAL_COVER_PREFIX}missing`)).toBe(builtin.source);
  });

  it('uses diary photo rendering for gallery journal covers', () => {
    expect(getJournalCoverRenderableSource('file:///document/diary-photos/encrypted-cover.jpg')).toEqual({
      uri: 'render-cache:file:///document/diary-photos/encrypted-cover.jpg',
    });
  });
});
