import type { TimeFormat } from '@/stores/useAppStore';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const RECENT_HOURS_LIMIT = 6;

export interface FriendlyTimestampLabels {
  readonly today: string;
  readonly yesterday: string;
  readonly todayAt: string;
  readonly yesterdayAt: string;
  readonly justNow: string;
  readonly minutesAgo: string;
  readonly hoursAgo: string;
}

function formatCountLabel(template: string, count: number): string {
  return template.replace('{count}', String(count));
}

function formatTimeLabel(template: string, time: string): string {
  return template.replace('{time}', time);
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

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

export function formatFriendlyTimestamp(
  value: string,
  format: TimeFormat,
  labels: FriendlyTimestampLabels,
  now: Date = new Date(),
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || Number.isNaN(now.getTime())) return '';

  const diffMs = now.getTime() - date.getTime();
  if (diffMs >= 0 && diffMs < MINUTE_MS) return labels.justNow;
  if (diffMs >= MINUTE_MS && diffMs < HOUR_MS) {
    return formatCountLabel(labels.minutesAgo, Math.max(1, Math.floor(diffMs / MINUTE_MS)));
  }
  if (diffMs >= HOUR_MS && diffMs < RECENT_HOURS_LIMIT * HOUR_MS) {
    return formatCountLabel(labels.hoursAgo, Math.max(1, Math.floor(diffMs / HOUR_MS)));
  }

  const timeText = formatDisplayTime(value, format);
  if (isSameLocalDay(date, now)) return timeText ? formatTimeLabel(labels.todayAt, timeText) : labels.today;

  const yesterday = new Date(startOfLocalDay(now).getTime() - 24 * HOUR_MS);
  if (isSameLocalDay(date, yesterday)) return timeText ? formatTimeLabel(labels.yesterdayAt, timeText) : labels.yesterday;

  return formatDisplayMonthDayTime(value, format);
}
