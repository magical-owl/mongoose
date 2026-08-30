import { useAppStore } from '@/stores/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it('defaults diary entry lists to flat hierarchy', () => {
    expect(useAppStore.getState().entryHierarchyMode).toBe('none');
  });
});
