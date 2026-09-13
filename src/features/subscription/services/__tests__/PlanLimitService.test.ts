import { buildDiaryEntry } from '@tests/fixtures/domain';
import { FREE_PLAN_LIMITS, getLocalDateKey, validateDiaryEntryPlanLimits } from '../PlanLimitService';

describe('PlanLimitService release gating', () => {
  it('does not block entries when monetization is disabled for the release candidate', () => {
    const deviceDateKey = getLocalDateKey(new Date());
    const existingEntries = Array.from({ length: FREE_PLAN_LIMITS.entriesPerDay }, (_, index) => buildDiaryEntry({
      id: `entry-${index}`,
      createdAt: new Date().toISOString(),
    }));

    const result = validateDiaryEntryPlanLimits({
      isPro: false,
      existingEntries,
      nextEntry: buildDiaryEntry({ id: 'next-entry', createdAt: new Date().toISOString() }),
      previousEntry: null,
      deviceDateKey,
      dailyUsage: {
        dateKey: deviceDateKey,
        stickersUsed: FREE_PLAN_LIMITS.stickersPerDay,
      },
    });

    expect(result.success).toBe(true);
  });
});
