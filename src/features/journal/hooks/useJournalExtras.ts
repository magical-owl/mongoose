import { useCallback, useEffect, useState } from 'react';
import { EMPTY_JOURNAL_EXTRAS, JournalExtras } from '../domain/JournalExtras';
import { journalExtrasService } from '../services/JournalExtrasService';
import type { Result } from '@/shared/types/architecture';

export function useJournalExtras() {
  const [state, setState] = useState<JournalExtras>(EMPTY_JOURNAL_EXTRAS);
  const [isLoading, setIsLoading] = useState(true);
  const refresh = useCallback(async () => {
    const result = await journalExtrasService.get();
    if (result.success) setState(result.data);
    setIsLoading(false);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => { void refresh(); }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);
  const apply = useCallback(async (operation: (current: JournalExtras) => Promise<Result<JournalExtras>>) => {
    const result = await operation(state);
    if (result.success && result.data) setState(result.data);
    return result;
  }, [state]);
  return { ...state, state, isLoading, refresh, replace: (next: JournalExtras) => apply(() => journalExtrasService.save(next)), addChapter: (title: string) => apply((current) => journalExtrasService.addChapter(current, { title, startDate: new Date().toISOString().slice(0, 10) })), addRitual: (title: string) => apply((current) => journalExtrasService.addRitual(current, { title, frequency: 'weekly' })), addCollection: (title: string) => apply((current) => journalExtrasService.addCollection(current, { title })), addMilestone: (title: string) => apply((current) => journalExtrasService.addMilestone(current, { title, date: new Date().toISOString().slice(0, 10) })), completeRitual: (id: string) => apply((current) => journalExtrasService.completeRitual(current, id, new Date().toISOString().slice(0, 10))) };
}
