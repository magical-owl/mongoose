import type { TimeFormat } from '@/stores/useAppStore';

export function formatDisplayTime(value: string, format: TimeFormat): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12-hour',
  });
}

export function formatDisplayMonthDayTime(value: string, format: TimeFormat): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const dateText = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeText = formatDisplayTime(value, format);
  return timeText ? `${dateText}, ${timeText}` : dateText;
}

export function formatDisplayMonthDayYearTime(value: string, format: TimeFormat): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const dateText = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const timeText = formatDisplayTime(value, format);
  return timeText ? `${dateText}, ${timeText}` : dateText;
}
