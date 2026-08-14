import type { DiaryEntry } from '../domain/DiaryEntry';

export function isDiaryEntryVisible(entry: DiaryEntry, now: Date = new Date()): boolean {
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= now.getTime()) return false;
  if (entry.timeCapsuleUnlockAt && new Date(entry.timeCapsuleUnlockAt).getTime() > now.getTime()) return false;
  return true;
}
