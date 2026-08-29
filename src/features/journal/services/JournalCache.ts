import type { Journal } from '../domain/Journal';

let cachedJournals: Journal[] | null = null;

export function getCachedJournals(): Journal[] | null {
  return cachedJournals;
}

export function setCachedJournals(journals: readonly Journal[]): void {
  cachedJournals = [...journals];
}

export function clearCachedJournals(): void {
  cachedJournals = null;
}
