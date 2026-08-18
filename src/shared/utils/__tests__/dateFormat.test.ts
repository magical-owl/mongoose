import { formatDisplayDate } from '@/shared/utils/dateFormat';

describe('formatDisplayDate', () => {
  it('formats dates in month-day-year order', () => {
    expect(formatDisplayDate('2026-08-16', 'month-day-year')).toMatch(/Aug 16, 2026/);
  });

  it('formats dates in day-month-year order', () => {
    expect(formatDisplayDate('2026-08-16', 'day-month-year')).toMatch(/16 Aug 2026/);
  });

  it('formats dates in ISO order', () => {
    expect(formatDisplayDate('2026-08-16', 'year-month-day')).toBe('2026-08-16');
  });

  it('returns invalid values unchanged', () => {
    expect(formatDisplayDate('not-a-date', 'month-day-year')).toBe('not-a-date');
  });
});
