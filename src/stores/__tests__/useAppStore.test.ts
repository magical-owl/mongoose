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
});
