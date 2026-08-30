import { useState, useEffect, useCallback } from 'react';
import { diaryService } from '../services/DiaryService';
import { DiaryEntry } from '../domain/DiaryEntry';
import { getCachedDiaryEntries, setCachedDiaryEntries } from '../services/DiaryEntryCache';
import { useAppStore } from '@/stores/useAppStore';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';

export function useDiary() {
  const cachedDiaryEntries = getCachedDiaryEntries();
  const [entries, setEntries] = useState<DiaryEntry[]>(() => cachedDiaryEntries.entries ?? []);
  const [deletedEntries, setDeletedEntries] = useState<DiaryEntry[]>(() => cachedDiaryEntries.deletedEntries ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(
    () => cachedDiaryEntries.entries === null || cachedDiaryEntries.deletedEntries === null
  );
  const [error, setError] = useState<string | null>(null);

  const selectedCompanion = useAppStore((state) => state.selectedCompanion);
  const setSelectedCompanion = useAppStore((state) => state.setSelectedCompanion);
  const isPro = useSubscriptionStore((state) => state.isPro);

  const fetchEntries = useCallback(async () => {
    const entriesResult = await diaryService.getEntries();
    const deletedEntriesResult = await diaryService.getDeletedEntries();
    if (!entriesResult.success) {
      setError(entriesResult.error.message);
      setIsLoading(false);
      return;
    }
    if (!deletedEntriesResult.success) {
      setError(deletedEntriesResult.error.message);
      setIsLoading(false);
      return;
    }
    setCachedDiaryEntries(entriesResult.data, deletedEntriesResult.data);
    setEntries(entriesResult.data);
    setDeletedEntries(deletedEntriesResult.data);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchEntries();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEntries]);

  const saveEntry = async (entry: DiaryEntry) => {
    const result = await diaryService.saveEntry(entry, { isPro });
    if (result.success) {
      await fetchEntries();
    }
    return result;
  };

  const deleteEntry = async (id: string) => {
    const result = await diaryService.deleteEntry(id);
    if (result.success) {
      await fetchEntries();
    }
    return result;
  };

  const restoreDeletedEntry = async (id: string) => {
    const result = await diaryService.restoreDeletedEntry(id);
    if (result.success) {
      await fetchEntries();
    }
    return result;
  };

  const permanentlyDeleteEntry = async (id: string) => {
    const result = await diaryService.permanentlyDeleteEntry(id);
    if (result.success) {
      await fetchEntries();
    }
    return result;
  };

  const restoreEntries = async (entriesToRestore: readonly DiaryEntry[]) => {
    const result = await diaryService.restoreEntries(entriesToRestore);
    if (result.success) {
      await fetchEntries();
    }
    return result;
  };

  const addReflection = async (entryId: string, text: string) => {
    const result = await diaryService.addReflection(entryId, text);
    if (result.success) {
      await fetchEntries();
    }
    return result;
  };

  const deleteReflection = async (entryId: string, reflectionId: string) => {
    const result = await diaryService.deleteReflection(entryId, reflectionId);
    if (result.success) {
      await fetchEntries();
    }
    return result;
  };

  const streakStats = diaryService.calculateStreak(entries);

  return {
    entries,
    deletedEntries,
    isLoading,
    error,
    selectedCompanion,
    setSelectedCompanion,
    saveEntry,
    saveDiaryEntry: saveEntry,
    deleteEntry,
    deleteDiaryEntry: deleteEntry,
    restoreDeletedEntry,
    permanentlyDeleteEntry,
    restoreEntries,
    addReflection,
    deleteReflection,
    refresh: fetchEntries,
    streakStats,
  };
}
