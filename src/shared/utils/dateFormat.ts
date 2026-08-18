import type { CalendarDateFormat } from '@/stores/useAppStore';

export function formatDisplayDate(value: string, format: CalendarDateFormat): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  const date = new Date(year, month - 1, day, 12);
  if (format === 'year-month-day') {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const monthName = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date);
  return format === 'day-month-year'
    ? `${day} ${monthName} ${year}`
    : `${monthName} ${day}, ${year}`;
}
