import { RemoteAiSummaryService } from '../RemoteAiSummaryService';
import { useAppStore } from '@/stores/useAppStore';

describe('RemoteAiSummaryService', () => {
  beforeEach(() => useAppStore.getState().reset());

  it('requires explicit consent before processing entry content', async () => {
    const request = jest.fn();
    const result = await new RemoteAiSummaryService().summarize('private entry', request);
    expect(result.success).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });
});
