import type { DiaryEntry, DiaryPhoto, DiaryReflection, SensoryDetails } from '@/features/diary/domain/DiaryEntry';
import type { DiaryDraft } from '@/features/diary/services/DiaryDraftService';
import type { Journal } from '@/features/journal/domain/Journal';
import type { Profile } from '@/features/profile/domain/Profile';

const DEFAULT_DATE = '2026-08-29';
const DEFAULT_DATETIME = '2026-08-29T01:00:00.000Z';

const defaultSensory: SensoryDetails = {
  locationLabel: '',
  sounds: '',
  smells: '',
  energyLevel: 5,
  bodyState: '',
};

export function buildDiaryPhoto(overrides: Partial<DiaryPhoto> = {}): DiaryPhoto {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    uri: 'file:///diary-photo.jpg',
    width: 1200,
    height: 800,
    createdAt: DEFAULT_DATETIME,
    ...overrides,
  };
}

export function buildDiaryReflection(overrides: Partial<DiaryReflection> = {}): DiaryReflection {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    text: 'A small reflection.',
    createdAt: DEFAULT_DATETIME,
    updatedAt: DEFAULT_DATETIME,
    ...overrides,
  };
}

export function buildDiaryEntry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'A quiet morning',
    content: '<p>Entry body.</p>',
    date: DEFAULT_DATE,
    paperBackgroundId: 'blank',
    bodyFontFamily: 'system',
    stickers: [],
    companion: 'cat',
    isFavorite: false,
    viewCount: 0,
    viewHistory: [],
    memoryReactions: [],
    tags: [],
    createdAt: DEFAULT_DATETIME,
    updatedAt: DEFAULT_DATETIME,
    manualMoodWeather: 'neutral',
    manualMood: 'neutral',
    manualMoods: ['neutral'],
    writingMode: 'free-write',
    sensory: { ...defaultSensory },
    isLockbox: false,
    collectionIds: [],
    journalIds: [],
    photos: [],
    reflections: [],
    ...overrides,
  };
}

export function buildDiaryDraft(overrides: Partial<DiaryDraft> = {}): DiaryDraft {
  return {
    title: '',
    content: '<p>Draft body.</p>',
    date: DEFAULT_DATE,
    companion: 'cat',
    stickers: [],
    paperBackgroundId: 'blank',
    bodyFontFamily: 'system',
    photos: [],
    tags: [],
    manualMoodWeather: 'neutral',
    manualMood: 'neutral',
    manualMoods: ['neutral'],
    writingMode: 'free-write',
    sensory: { ...defaultSensory },
    isLockbox: false,
    savedAt: DEFAULT_DATETIME,
    ...overrides,
  };
}

export function buildJournal(overrides: Partial<Journal> = {}): Journal {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Everyday Notes',
    description: '',
    color: '#4ECDC4',
    createdAt: DEFAULT_DATETIME,
    updatedAt: DEFAULT_DATETIME,
    ...overrides,
  };
}

export function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    displayName: 'Miming',
    createdAt: DEFAULT_DATETIME,
    updatedAt: DEFAULT_DATETIME,
    ...overrides,
  };
}
