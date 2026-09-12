import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { stripHtml } from '@/shared/utils/html';

const MAX_PREVIEW_TEXT_CACHE_SIZE = 500;

type PreviewTextEntry = Pick<DiaryEntry, 'id' | 'content' | 'updatedAt'>;

const previewTextCache = new Map<string, string>();

function hashText(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function getPreviewTextCacheKey(entry: PreviewTextEntry): string {
  return `${entry.id}:${entry.updatedAt}:${entry.content.length}:${hashText(entry.content)}`;
}

export function getDiaryEntryPreviewText(entry: PreviewTextEntry): string {
  const cacheKey = getPreviewTextCacheKey(entry);
  const cachedPreview = previewTextCache.get(cacheKey);
  if (cachedPreview !== undefined) {
    previewTextCache.delete(cacheKey);
    previewTextCache.set(cacheKey, cachedPreview);
    return cachedPreview;
  }

  const previewText = stripHtml(entry.content);
  previewTextCache.set(cacheKey, previewText);

  if (previewTextCache.size > MAX_PREVIEW_TEXT_CACHE_SIZE) {
    const oldestKey = previewTextCache.keys().next().value;
    if (oldestKey) previewTextCache.delete(oldestKey);
  }

  return previewText;
}

export function clearDiaryEntryPreviewTextCache(): void {
  previewTextCache.clear();
}
