import { buildDiaryEntry } from '@tests/fixtures/domain';
import {
  FREE_PLAN_LIMITS,
  PLAN_LIMIT_ERROR_CODES,
  getLocalDateKey,
  validateDiaryEntryPlanLimits,
} from '../PlanLimitService';

describe('PlanLimitService release gating', () => {
  it('blocks entries when monetization is enabled', () => {
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

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(PLAN_LIMIT_ERROR_CODES.entriesPerDay);
    }
  });
});
