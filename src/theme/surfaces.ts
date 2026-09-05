import type { Theme } from '@/providers/ThemeProvider';

export function getTranslucentSurfaceColor(theme: Theme): string {
  return theme.colors.surface + (theme.isDark ? 'B8' : 'D9');
}

export function getSubtleTranslucentSurfaceColor(theme: Theme): string {
  return theme.colors.surface + (theme.isDark ? 'D9' : 'E8');
}
