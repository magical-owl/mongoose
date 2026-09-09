import { useCallback } from 'react';
import { Alert } from 'react-native';
import type { DiaryEntry, DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';
import { isPlanLimitErrorCode } from '@/features/subscription/services/PlanLimitService';
import type { useDiary } from '@/features/diary/hooks/useDiary';
import type { useTranslation } from '@/localization/i18n';

type DiaryActions = Pick<
  ReturnType<typeof useDiary>,
  'saveDiaryEntry' | 'deleteDiaryEntry' | 'addReflection' | 'deleteReflection' | 'toggleMemoryReaction' | 'toggleReflectionMemoryReaction'
>;

interface UseEntryDetailActionsOptions extends DiaryActions {
  readonly entry: DiaryEntry | null;
  readonly editTitle: string;
  readonly buildUpdatedEntry: (entry: DiaryEntry) => DiaryEntry;
  readonly setEntry: (entry: DiaryEntry) => void;
  readonly setIsEditing: (isEditing: boolean) => void;
  readonly setIsSaving: (isSaving: boolean) => void;
  readonly setShowPremiumModal: (isVisible: boolean) => void;
  readonly setShowFormattingTools: (isVisible: boolean) => void;
  readonly setShowReflections: (isVisible: boolean) => void;
  readonly setShowMemoryReactionPicker: (isVisible: boolean) => void;
  readonly dismissEntryKeyboard: () => void;
  readonly navigateBack: () => void;
  readonly t: ReturnType<typeof useTranslation>;
}

export function useEntryDetailActions({
  entry,
  editTitle,
  buildUpdatedEntry,
  setEntry,
  setIsEditing,
  setIsSaving,
  setShowPremiumModal,
  setShowFormattingTools,
  setShowReflections,
  setShowMemoryReactionPicker,
  dismissEntryKeyboard,
  navigateBack,
  saveDiaryEntry,
  deleteDiaryEntry,
  addReflection,
  deleteReflection,
  toggleMemoryReaction,
  toggleReflectionMemoryReaction,
  t,
}: UseEntryDetailActionsOptions) {
  const handleSaveEdit = useCallback(async () => {
    if (!entry) return;
    if (!editTitle.trim()) {
      Alert.alert(t('entryTitleRequiredTitle'), t('entryEditTitleRequiredMessage'));
      return;
    }

    setIsSaving(true);
    const updated = buildUpdatedEntry(entry);
    const result = await saveDiaryEntry(updated);
    setIsSaving(false);

    if (result.success) {
      setEntry(updated);
      setIsEditing(false);
    } else if (isPlanLimitErrorCode(result.error.code)) {
      setShowPremiumModal(true);
    } else {
      Alert.alert(t('entrySaveFailedTitle'), result.error.message);
    }
  }, [
    buildUpdatedEntry,
    editTitle,
    entry,
    saveDiaryEntry,
    setEntry,
    setIsEditing,
    setIsSaving,
    setShowPremiumModal,
    t,
  ]);

  const handleDelete = useCallback(async () => {
    if (!entry) return;
    dismissEntryKeyboard();
    setShowFormattingTools(false);
    setShowReflections(false);
    setTimeout(() => {
      Alert.alert(t('entryDeleteTitle'), t('entryDeleteMessage'), [
        { text: t('entryCancel'), style: 'cancel' },
        {
          text: t('entryDelete'),
          style: 'destructive',
          onPress: async () => {
            await deleteDiaryEntry(entry.id);
            navigateBack();
          },
        },
      ]);
    }, 80);
  }, [
    deleteDiaryEntry,
    dismissEntryKeyboard,
    entry,
    navigateBack,
    setShowFormattingTools,
    setShowReflections,
    t,
  ]);

  const handleAddReflection = useCallback(async (entryId: string, text: string, photo?: DiaryPhoto) => {
    if (!entry || entry.id !== entryId) return false;
    const trimmed = text.trim();
    if (!trimmed) return false;

    const result = await addReflection(entry.id, trimmed, photo);
    if (result.success) {
      setEntry(result.data);
      return true;
    }

    Alert.alert(t('reflectionNotSavedTitle'), result.error.message);
    return false;
  }, [addReflection, entry, setEntry, t]);

  const handleDeleteReflection = useCallback((entryId: string, reflectionId: string) => {
    if (!entry || entry.id !== entryId) return;
    Alert.alert(t('reflectionDeleteTitle'), t('reflectionDeleteMessage'), [
      { text: t('entryCancel'), style: 'cancel' },
      {
        text: t('entryDelete'),
        style: 'destructive',
        onPress: async () => {
          const result = await deleteReflection(entryId, reflectionId);
          if (result.success) setEntry(result.data);
          else Alert.alert(t('reflectionNotDeletedTitle'), result.error.message);
        },
      },
    ]);
  }, [deleteReflection, entry, setEntry, t]);

  const handleToggleMemoryReaction = useCallback(async (reaction: MemoryReaction) => {
    if (!entry) return;
    const result = await toggleMemoryReaction(entry.id, reaction);
    if (result.success) {
      setEntry(result.data);
      setShowMemoryReactionPicker(false);
    } else {
      Alert.alert(t('memoryReactionNotSavedTitle'), result.error.message);
    }
  }, [entry, setEntry, setShowMemoryReactionPicker, t, toggleMemoryReaction]);

  const handleToggleReflectionMemoryReaction = useCallback(async (
    entryId: string,
    reflectionId: string,
    reaction: MemoryReaction,
  ) => {
    if (!entry || entry.id !== entryId) return false;
    const result = await toggleReflectionMemoryReaction(entryId, reflectionId, reaction);
    if (result.success) {
      setEntry(result.data);
      return true;
    }

    Alert.alert(t('memoryReactionNotSavedTitle'), result.error.message);
    return false;
  }, [entry, setEntry, t, toggleReflectionMemoryReaction]);

  return {
    handleSaveEdit,
    handleDelete,
    handleAddReflection,
    handleDeleteReflection,
    handleToggleMemoryReaction,
    handleToggleReflectionMemoryReaction,
  };
}
