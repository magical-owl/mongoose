import type { ImageSourcePropType } from 'react-native';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import {
  BUILTIN_JOURNAL_COVER_PREFIX,
  getJournalCoverImageSource,
} from '@/features/journal/domain/JournalBackgrounds';

export function getJournalCoverRenderableSource(uri?: string): ImageSourcePropType | undefined {
  if (!uri) return undefined;
  if (uri.startsWith(BUILTIN_JOURNAL_COVER_PREFIX)) return getJournalCoverImageSource(uri);
  return getDiaryPhotoImageSource(uri);
}
