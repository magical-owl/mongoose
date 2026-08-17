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
