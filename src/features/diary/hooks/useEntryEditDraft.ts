import { useCallback, useState } from 'react';
import {
  getEntryManualMoods,
  getPrimaryManualMood,
  type DiaryEntry,
  type DiaryPhoto,
  type ManualMood,
  type ManualMoodWeather,
  type WritingMode,
} from '@/features/diary/domain/DiaryEntry';
import type { CompanionType } from '@/features/diary/domain/Companion';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import { createPlacedPhotoSticker } from '@/features/diary/services/DiaryPhotoService';
import { normalizeDiaryTags } from '@/features/diary/services/DiaryTagService';
import {
  DIARY_BODY_DEFAULT_FONT_FAMILY,
  normalizeDiaryBodyFontFamily,
  normalizeDiaryBodyTextColor,
  type DiaryBodyFontFamily,
  type DiaryBodyTextColor,
} from '@/features/diary/domain/DiaryBodyStyle';
import { DEFAULT_DIARY_PAPER_BACKGROUND_ID } from '@/features/diary/domain/DiaryPaperBackgrounds';

function entryDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day, 12, 0, 0) : new Date();
}

function formatEntryDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function appendTemplateToEntryContent(content: string, templateContent: string): string {
  const trimmed = content
    ? content.replace(/[\s\n\r]*$/, '').replace(/(<p><\/p>|<br\s*\/?>)*$/, '')
    : '';
  return trimmed ? `${trimmed}<br><br>${templateContent}` : templateContent;
}

export function useEntryEditDraft() {
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editStickers, setEditStickers] = useState<PlacedSticker[]>([]);
  const [editCoverPhoto, setEditCoverPhoto] = useState<DiaryPhoto | undefined>();
  const [editPaperBackgroundId, setEditPaperBackgroundId] = useState<string>(DEFAULT_DIARY_PAPER_BACKGROUND_ID);
  const [editBodyFontFamily, setEditBodyFontFamily] = useState<DiaryBodyFontFamily>(DIARY_BODY_DEFAULT_FONT_FAMILY);
  const [editBodyTextColor, setEditBodyTextColor] = useState<DiaryBodyTextColor | undefined>();
  const [editMoodWeather, setEditMoodWeather] = useState<ManualMoodWeather>('neutral');
  const [editMoods, setEditMoods] = useState<ManualMood[]>(['neutral']);
  const [editWritingMode, setEditWritingMode] = useState<WritingMode>('free-write');
  const [editLocation, setEditLocation] = useState('');
  const [editSounds, setEditSounds] = useState('');
  const [editSmells, setEditSmells] = useState('');
  const [editEnergy, setEditEnergy] = useState('5');
  const [editBody, setEditBody] = useState('');
  const [editLockbox, setEditLockbox] = useState(false);
  const [editUnlockAt, setEditUnlockAt] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editFavorite, setEditFavorite] = useState(false);
  const [editJournalIds, setEditJournalIds] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editCompanion, setEditCompanion] = useState<CompanionType>('cat');

  const resetEditableBodyStyle = useCallback((sourceEntry: DiaryEntry) => {
    setEditBodyFontFamily(normalizeDiaryBodyFontFamily(sourceEntry.bodyFontFamily));
    setEditBodyTextColor(normalizeDiaryBodyTextColor(sourceEntry.bodyTextColor));
  }, []);

  const hydrateEditDraft = useCallback((sourceEntry: DiaryEntry) => {
    setEditTitle(sourceEntry.title);
    setEditContent(sourceEntry.content);
    setEditDate(entryDate(sourceEntry.date));
    setEditCoverPhoto(sourceEntry.coverPhoto);
    setEditPaperBackgroundId(sourceEntry.paperBackgroundId ?? DEFAULT_DIARY_PAPER_BACKGROUND_ID);
    resetEditableBodyStyle(sourceEntry);
    setEditStickers([
      ...sourceEntry.stickers,
      ...sourceEntry.photos.map((photo, index) => createPlacedPhotoSticker(photo, sourceEntry.stickers.length + index)),
    ]);
    setEditCompanion(sourceEntry.companion);
    setEditFavorite(sourceEntry.isFavorite);
    setEditJournalIds(sourceEntry.journalIds ?? sourceEntry.collectionIds);
    setEditTags(normalizeDiaryTags(sourceEntry.tags));
    setEditMoods(getEntryManualMoods(sourceEntry));
    setEditMoodWeather(sourceEntry.manualMoodWeather);
    setEditWritingMode(sourceEntry.writingMode);
    setEditLocation(sourceEntry.sensory.locationLabel);
    setEditSounds(sourceEntry.sensory.sounds);
    setEditSmells(sourceEntry.sensory.smells);
    setEditEnergy(String(sourceEntry.sensory.energyLevel));
    setEditBody(sourceEntry.sensory.bodyState);
    setEditLockbox(sourceEntry.isLockbox);
    setEditUnlockAt(sourceEntry.timeCapsuleUnlockAt ?? '');
    setEditExpiresAt(sourceEntry.expiresAt ?? '');
  }, [resetEditableBodyStyle]);

  const buildUpdatedEntry = useCallback((sourceEntry: DiaryEntry): DiaryEntry => ({
    ...sourceEntry,
    title: editTitle.trim(),
    content: editContent.trim(),
    date: formatEntryDate(editDate),
    paperBackgroundId: editPaperBackgroundId,
    bodyFontFamily: editBodyFontFamily,
    bodyTextColor: editBodyTextColor,
    stickers: editStickers,
    coverPhoto: editCoverPhoto,
    photos: [],
    companion: editCompanion,
    isFavorite: editFavorite,
    tags: editTags,
    collectionIds: editJournalIds,
    journalIds: editJournalIds,
    manualMoodWeather: editMoodWeather,
    manualMood: getPrimaryManualMood(editMoods),
    manualMoods: editMoods,
    writingMode: editWritingMode,
    sensory: {
      locationLabel: editLocation,
      sounds: editSounds,
      smells: editSmells,
      energyLevel: Math.min(10, Math.max(1, Number(editEnergy) || 5)),
      bodyState: editBody,
    },
    isLockbox: editLockbox,
    timeCapsuleUnlockAt: editUnlockAt || undefined,
    expiresAt: editExpiresAt || undefined,
    updatedAt: new Date().toISOString(),
  }), [
    editBody,
    editBodyFontFamily,
    editBodyTextColor,
    editCompanion,
    editContent,
    editCoverPhoto,
    editDate,
    editEnergy,
    editExpiresAt,
    editFavorite,
    editJournalIds,
    editLocation,
    editLockbox,
    editMoodWeather,
    editMoods,
    editPaperBackgroundId,
    editSmells,
    editSounds,
    editStickers,
    editTags,
    editTitle,
    editUnlockAt,
    editWritingMode,
  ]);

  return {
    editTitle,
    setEditTitle,
    editContent,
    setEditContent,
    editDate,
    setEditDate,
    editStickers,
    setEditStickers,
    editCoverPhoto,
    setEditCoverPhoto,
    editPaperBackgroundId,
    setEditPaperBackgroundId,
    editBodyFontFamily,
    setEditBodyFontFamily,
    editBodyTextColor,
    setEditBodyTextColor,
    editMoodWeather,
    setEditMoodWeather,
    editMoods,
    setEditMoods,
    editWritingMode,
    setEditWritingMode,
    editLocation,
    setEditLocation,
    editSounds,
    setEditSounds,
    editSmells,
    setEditSmells,
    editEnergy,
    setEditEnergy,
    editBody,
    setEditBody,
    editLockbox,
    setEditLockbox,
    editUnlockAt,
    setEditUnlockAt,
    editExpiresAt,
    setEditExpiresAt,
    editFavorite,
    setEditFavorite,
    editJournalIds,
    setEditJournalIds,
    editTags,
    setEditTags,
    editCompanion,
    setEditCompanion,
    hydrateEditDraft,
    buildUpdatedEntry,
  };
}
