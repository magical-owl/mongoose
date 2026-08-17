import { useState, useEffect, useCallback } from 'react';
import { diaryService } from '../services/DiaryService';
import { DiaryEntry } from '../domain/DiaryEntry';
import { useAppStore } from '@/stores/useAppStore';

export function useDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const selectedCompanion = useAppStore((state) => state.selectedCompanion);
  const setSelectedCompanion = useAppStore((state) => state.setSelectedCompanion);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    const result = await diaryService.getEntries();
    if (result.success) {
      setEntries(result.data);
      setError(null);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const saveEntry = async (entry: DiaryEntry) => {
    const result = await diaryService.saveEntry(entry);
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
    isLoading,
    error,
    selectedCompanion,
    setSelectedCompanion,
    saveEntry,
    saveDiaryEntry: saveEntry,
    deleteEntry,
    deleteDiaryEntry: deleteEntry,
    addReflection,
    deleteReflection,
    refresh: fetchEntries,
    streakStats,
  };
}
