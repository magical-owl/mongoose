import { getPrimaryManualMood, type ManualMood } from '@/features/diary/domain/DiaryEntry';

interface EntryMetadataSavePromptInput {
  readonly moods: readonly ManualMood[];
  readonly tags: readonly string[];
}

export function shouldPromptForEntryMetadataBeforeSave({
  moods,
  tags,
}: EntryMetadataSavePromptInput): boolean {
  return getPrimaryManualMood(moods) === 'neutral' || tags.length === 0;
}
