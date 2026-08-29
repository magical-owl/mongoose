import { useCallback, useEffect, useState } from 'react';
import type { Journal } from '../domain/Journal';
import { getCachedJournals, setCachedJournals } from '../services/JournalCache';
import { journalService } from '../services/JournalService';

export function useJournals() {
  const cachedJournals = getCachedJournals();
  const [journals, setJournals] = useState<Journal[]>(() => cachedJournals ?? []);
  const [isLoading, setIsLoading] = useState(() => cachedJournals === null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const result = await journalService.getJournals();
    if (result.success) {
      setCachedJournals(result.data);
      setJournals(result.data);
      setError(null);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void journalService.getJournals().then((result) => {
      if (!active) return;
      if (result.success) {
        setCachedJournals(result.data);
        setJournals(result.data);
        setError(null);
      } else {
        setError(result.error.message);
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const createJournal = useCallback(async (title: string) => {
    const result = await journalService.createJournal(title);
    if (result.success) await refresh();
    return result;
  }, [refresh]);

  const saveJournal = useCallback(async (journal: Journal) => {
    const result = await journalService.saveJournal(journal);
    if (result.success) await refresh();
    return result;
  }, [refresh]);

  const deleteJournal = useCallback(async (id: string) => {
    const result = await journalService.deleteJournal(id);
    if (result.success) await refresh();
    return result;
  }, [refresh]);

  return { journals, isLoading, error, refresh, createJournal, saveJournal, deleteJournal };
}
