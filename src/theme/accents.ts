export type AccentColor = 'blue' | 'violet' | 'green' | 'rose' | 'amber';

export const accentColors: Record<AccentColor, { light: string; dark: string; label: string }> = {
  blue: { light: '#2F93E8', dark: '#6BB5F0', label: 'Blue' },
  violet: { light: '#7C5CFC', dark: '#A99AFF', label: 'Violet' },
  green: { light: '#2E9D67', dark: '#70D6A0', label: 'Green' },
  rose: { light: '#D95778', dark: '#F58DA8', label: 'Rose' },
  amber: { light: '#C47A16', dark: '#F2B84B', label: 'Amber' },
};
