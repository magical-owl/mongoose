export type ColorTheme = 'default' | 'amber' | 'sage' | 'rose';

type ThemeColorKey =
  | 'background'
  | 'surface'
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'border'
  | 'borderLight'
  | 'card'
  | 'inputBackground'
  | 'inputBorder';

type ThemeColorOverrides = Partial<Record<ThemeColorKey, string>>;

export interface ColorThemeDefinition {
  readonly label: string;
  readonly preview: string;
  readonly light: ThemeColorOverrides;
  readonly dark: ThemeColorOverrides;
}

export const colorThemes: Record<ColorTheme, ColorThemeDefinition> = {
  default: {
    label: 'Default',
    preview: '#2F93E8',
    light: {},
    dark: {},
  },
  amber: {
    label: 'Amber Night',
    preview: '#D69B37',
    light: {
      background: '#F7F1E5',
      surface: '#EEE5D4',
      text: '#2B241A',
      textSecondary: '#756850',
      textTertiary: '#9A8B70',
      border: '#D8C9AC',
      borderLight: '#E7DDCA',
      card: '#EEE5D4',
      inputBackground: '#EEE5D4',
      inputBorder: '#D8C9AC',
    },
    dark: {
      background: '#15120E',
      surface: '#2A2318',
      text: '#F5E9C9',
      textSecondary: '#8D8066',
      textTertiary: '#75684F',
      border: '#3A3020',
      borderLight: '#30281B',
      card: '#2A2318',
      inputBackground: '#2A2318',
      inputBorder: '#3A3020',
    },
  },
  sage: {
    label: 'Sage',
    preview: '#7FAF8A',
    light: {
      background: '#F1F5F0',
      surface: '#E3ECE2',
      text: '#203027',
      textSecondary: '#5C7163',
      textTertiary: '#84958A',
      border: '#C5D5C7',
      borderLight: '#DCE7DD',
      card: '#E3ECE2',
      inputBackground: '#E3ECE2',
      inputBorder: '#C5D5C7',
    },
    dark: {
      background: '#101814',
      surface: '#1E2B23',
      text: '#E5F0E5',
      textSecondary: '#91A995',
      textTertiary: '#687D6D',
      border: '#304638',
      borderLight: '#26392D',
      card: '#1E2B23',
      inputBackground: '#1E2B23',
      inputBorder: '#304638',
    },
  },
  rose: {
    label: 'Rosewood',
    preview: '#C48791',
    light: {
      background: '#FAF1F1',
      surface: '#F1E3E4',
      text: '#342326',
      textSecondary: '#7E6267',
      textTertiary: '#A58C90',
      border: '#DFC9CC',
      borderLight: '#EDDCDE',
      card: '#F1E3E4',
      inputBackground: '#F1E3E4',
      inputBorder: '#DFC9CC',
    },
    dark: {
      background: '#181113',
      surface: '#2D1F22',
      text: '#F6E7E8',
      textSecondary: '#B08E94',
      textTertiary: '#866A70',
      border: '#493238',
      borderLight: '#39282D',
      card: '#2D1F22',
      inputBackground: '#2D1F22',
      inputBorder: '#493238',
    },
  },
};
