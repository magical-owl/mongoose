import { formatDisplayMonthDayTime, formatDisplayTime } from '@/shared/utils/timeFormat';

describe('formatDisplayTime', () => {
  it('supports both display formats', () => {
    const value = '2026-08-17T23:02:00.000Z';
    expect(formatDisplayTime(value, '24-hour')).toMatch(/\d{1,2}:\d{2}/);
    expect(formatDisplayTime(value, '12-hour')).toMatch(/(AM|PM)/i);
  });

  it('returns an empty value for invalid timestamps', () => {
    expect(formatDisplayTime('invalid', '24-hour')).toBe('');
  });
});

describe('formatDisplayMonthDayTime', () => {
  it('uses the selected time format', () => {
    const value = '2026-08-17T23:02:00.000Z';
    expect(formatDisplayMonthDayTime(value, '24-hour')).toMatch(/\d{1,2}:\d{2}/);
    expect(formatDisplayMonthDayTime(value, '12-hour')).toMatch(/(AM|PM)/i);
  });

  it('returns an empty value for invalid timestamps', () => {
    expect(formatDisplayMonthDayTime('invalid', '24-hour')).toBe('');
  });
});
