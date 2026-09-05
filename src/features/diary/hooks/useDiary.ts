import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { diaryService } from '../services/DiaryService';
import { DiaryEntry } from '../domain/DiaryEntry';
import type { MemoryReaction } from '../domain/MemoryReaction';
import { getCachedDiaryEntries, setCachedDiaryEntries } from '../services/DiaryEntryCache';
import { useAppStore } from '@/stores/useAppStore';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';

export function replaceDiaryEntryPreservingOrder(
  entries: readonly DiaryEntry[],
  updatedEntry: DiaryEntry,
): DiaryEntry[] {
  return entries.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry));
}

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
  const entriesRef = useRef(entries);
  const deletedEntriesRef = useRef(deletedEntries);

  const commitDiaryEntries = useCallback((nextEntries: DiaryEntry[], nextDeletedEntries: DiaryEntry[]) => {
    entriesRef.current = nextEntries;
    deletedEntriesRef.current = nextDeletedEntries;
    setCachedDiaryEntries(nextEntries, nextDeletedEntries);
    setEntries(nextEntries);
    setDeletedEntries(nextDeletedEntries);
  }, []);

  const sortEntriesByDateDesc = useCallback((items: readonly DiaryEntry[]) => (
    [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  ), []);

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
    commitDiaryEntries(entriesResult.data, deletedEntriesResult.data);
    setError(null);
    setIsLoading(false);
  }, [commitDiaryEntries]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchEntries();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEntries]);

  const saveEntry = async (entry: DiaryEntry) => {
    const result = await diaryService.saveEntry(entry, { isPro });
    if (result.success) {
      commitDiaryEntries(
        sortEntriesByDateDesc([
          result.data,
          ...entriesRef.current.filter((current) => current.id !== result.data.id),
        ]),
        deletedEntriesRef.current.filter((current) => current.id !== result.data.id),
      );
    }
    return result;
  };

  const deleteEntry = async (id: string) => {
    const result = await diaryService.deleteEntry(id);
    if (result.success) {
      const entry = entriesRef.current.find((current) => current.id === id);
      if (entry) {
        const now = new Date().toISOString();
        commitDiaryEntries(
          entriesRef.current.filter((current) => current.id !== id),
          sortEntriesByDateDesc([
            { ...entry, deletedAt: now, updatedAt: now },
            ...deletedEntriesRef.current.filter((current) => current.id !== id),
          ]),
        );
      }
    }
    return result;
  };

  const restoreDeletedEntry = async (id: string) => {
    const result = await diaryService.restoreDeletedEntry(id);
    if (result.success) {
      if (result.data) {
        commitDiaryEntries(
          sortEntriesByDateDesc([
            result.data,
            ...entriesRef.current.filter((current) => current.id !== result.data?.id),
          ]),
          deletedEntriesRef.current.filter((current) => current.id !== result.data?.id),
        );
      }
    }
    return result;
  };

  const permanentlyDeleteEntry = async (id: string) => {
    const result = await diaryService.permanentlyDeleteEntry(id);
    if (result.success) {
      commitDiaryEntries(
        entriesRef.current.filter((current) => current.id !== id),
        deletedEntriesRef.current.filter((current) => current.id !== id),
      );
    }
    return result;
  };

  const restoreEntries = async (entriesToRestore: readonly DiaryEntry[]) => {
    const result = await diaryService.restoreEntries(entriesToRestore);
    if (result.success) {
      const restoredIds = new Set(result.data.map((entry) => entry.id));
      commitDiaryEntries(
        sortEntriesByDateDesc([
          ...result.data,
          ...entriesRef.current.filter((entry) => !restoredIds.has(entry.id)),
        ]),
        deletedEntriesRef.current.filter((entry) => !restoredIds.has(entry.id)),
      );
    }
    return result;
  };

  const addReflection = async (entryId: string, text: string) => {
    const result = await diaryService.addReflection(entryId, text);
    if (result.success) {
      commitDiaryEntries(
        sortEntriesByDateDesc([
          result.data,
          ...entriesRef.current.filter((entry) => entry.id !== entryId),
        ]),
        deletedEntriesRef.current,
      );
    }
    return result;
  };

  const deleteReflection = async (entryId: string, reflectionId: string) => {
    const result = await diaryService.deleteReflection(entryId, reflectionId);
    if (result.success) {
      commitDiaryEntries(
        sortEntriesByDateDesc([
          result.data,
          ...entriesRef.current.filter((entry) => entry.id !== entryId),
        ]),
        deletedEntriesRef.current,
      );
    }
    return result;
  };

  const toggleMemoryReaction = async (entryId: string, reaction: MemoryReaction) => {
    const result = await diaryService.toggleMemoryReaction(entryId, reaction);
    if (result.success) {
      commitDiaryEntries(
        replaceDiaryEntryPreservingOrder(entriesRef.current, result.data),
        deletedEntriesRef.current,
      );
    }
    return result;
  };

  const recordEntryView = async (entryId: string) => {
    const result = await diaryService.recordEntryView(entryId);
    if (result.success) {
      commitDiaryEntries(
        replaceDiaryEntryPreservingOrder(entriesRef.current, result.data),
        deletedEntriesRef.current,
      );
    }
    return result;
  };

  const streakStats = useMemo(() => diaryService.calculateStreak(entries), [entries]);

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
    toggleMemoryReaction,
    recordEntryView,
    refresh: fetchEntries,
    streakStats,
  };
}
