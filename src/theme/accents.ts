export type AccentColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'indigo' | 'violet' | 'teal' | 'coral' | 'rose' | 'plum' | 'mint' | 'slate';

export const accentColors: Record<AccentColor, { light: string; dark: string; label: string }> = {
  red: { light: '#C53030', dark: '#FF7B7B', label: 'Red' },
  orange: { light: '#C05621', dark: '#FFAA66', label: 'Orange' },
  yellow: { light: '#A66A00', dark: '#F4C95D', label: 'Yellow' },
  green: { light: '#2E8B57', dark: '#70D6A0', label: 'Green' },
  blue: { light: '#2F75B5', dark: '#6BB5F0', label: 'Blue' },
  indigo: { light: '#4F5FC4', dark: '#9BA8FF', label: 'Indigo' },
  violet: { light: '#7C5CFC', dark: '#B39DFF', label: 'Violet' },
  teal: { light: '#168A8A', dark: '#63D1CE', label: 'Teal' },
  coral: { light: '#D9654E', dark: '#FF9B83', label: 'Coral' },
  rose: { light: '#C94F72', dark: '#F58DA8', label: 'Rose' },
  plum: { light: '#914B86', dark: '#D69ACD', label: 'Plum' },
  mint: { light: '#258A68', dark: '#78D6B1', label: 'Mint' },
  slate: { light: '#52657A', dark: '#A7B9CC', label: 'Slate' },
};
