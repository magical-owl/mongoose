import { useState, useEffect, useCallback } from 'react';
import { diaryService } from '../services/DiaryService';
import { DiaryEntry } from '../domain/DiaryEntry';
import { CompanionType } from '../domain/Companion';

export function useDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionType>('cat');

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
    refresh: fetchEntries,
    streakStats,
  };
}
