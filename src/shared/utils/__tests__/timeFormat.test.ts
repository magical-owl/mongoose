import { formatDisplayMonthDayTime, formatDisplayMonthDayYearTime, formatDisplayTime, formatFriendlyTimestamp } from '@/shared/utils/timeFormat';

const friendlyLabels = {
  today: 'Today',
  yesterday: 'Yesterday',
  todayAt: 'Today at {time}',
  yesterdayAt: 'Yesterday at {time}',
  justNow: 'Just now',
  minutesAgo: '{count}m ago',
  hoursAgo: '{count}h ago',
};

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

describe('formatDisplayMonthDayYearTime', () => {
  it('includes the year and selected time format', () => {
    const value = '2026-08-17T23:02:00.000Z';
    expect(formatDisplayMonthDayYearTime(value, '24-hour')).toMatch(/2026.*\d{1,2}:\d{2}/);
    expect(formatDisplayMonthDayYearTime(value, '12-hour')).toMatch(/2026.*(AM|PM)/i);
  });

  it('returns an empty value for invalid timestamps', () => {
    expect(formatDisplayMonthDayYearTime('invalid', '24-hour')).toBe('');
  });
});

describe('formatFriendlyTimestamp', () => {
  it('formats very recent timestamps as relative text', () => {
    const now = new Date(2026, 7, 29, 10, 0, 0);

    expect(formatFriendlyTimestamp(new Date(2026, 7, 29, 9, 59, 30).toISOString(), '12-hour', friendlyLabels, now)).toBe('Just now');
    expect(formatFriendlyTimestamp(new Date(2026, 7, 29, 9, 42, 0).toISOString(), '12-hour', friendlyLabels, now)).toBe('18m ago');
    expect(formatFriendlyTimestamp(new Date(2026, 7, 29, 8, 0, 0).toISOString(), '12-hour', friendlyLabels, now)).toBe('2h ago');
  });

  it('formats same-day and previous-day timestamps with friendly day labels', () => {
    const now = new Date(2026, 7, 29, 10, 0, 0);

    expect(formatFriendlyTimestamp(new Date(2026, 7, 29, 2, 15, 0).toISOString(), '12-hour', friendlyLabels, now)).toMatch(/^Today at .*2:15/i);
    expect(formatFriendlyTimestamp(new Date(2026, 7, 28, 21, 15, 0).toISOString(), '12-hour', friendlyLabels, now)).toMatch(/^Yesterday at .*9:15/i);
  });

  it('falls back to month/day time for older timestamps', () => {
    const now = new Date(2026, 7, 29, 10, 0, 0);

    expect(formatFriendlyTimestamp(new Date(2026, 7, 20, 9, 30, 0).toISOString(), '24-hour', friendlyLabels, now)).toMatch(/Aug 20.*9:30/i);
  });

  it('returns an empty value for invalid timestamps', () => {
    expect(formatFriendlyTimestamp('invalid', '24-hour', friendlyLabels)).toBe('');
  });
});
