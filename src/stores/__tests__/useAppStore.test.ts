import { useAppStore } from '@/stores/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it('defaults diary entry lists to flat hierarchy', () => {
    expect(useAppStore.getState().entryHierarchyMode).toBe('none');
  });

  it('defaults to the spring pattern background', () => {
    expect(useAppStore.getState().patternBackgroundVariant).toBe('spring');
  });

  it('updates the pattern background variant', () => {
    useAppStore.getState().setPatternBackgroundVariant('none');

    expect(useAppStore.getState().patternBackgroundVariant).toBe('none');
  });

  it('updates the default diary style preset', () => {
    useAppStore.getState().setDiaryStylePresetId('kraft');

    expect(useAppStore.getState().diaryStylePresetId).toBe('kraft');
  });

  it('remembers the last created entry type', () => {
    expect(useAppStore.getState().lastEntryType).toBe('diary');

    useAppStore.getState().setLastEntryType('moment');

    expect(useAppStore.getState().lastEntryType).toBe('moment');
  });
});
