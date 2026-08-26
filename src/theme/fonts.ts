import { Platform } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import {
  Merriweather_500Medium,
  Merriweather_600SemiBold,
  Merriweather_400Regular,
  Merriweather_700Bold,
} from '@expo-google-fonts/merriweather';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import {
  SourceCodePro_400Regular,
  SourceCodePro_500Medium,
  SourceCodePro_600SemiBold,
  SourceCodePro_700Bold,
} from '@expo-google-fonts/source-code-pro';

export type AppFontFamily = 'system' | 'inter' | 'nunito' | 'lora' | 'merriweather' | 'sourceCodePro';

export interface AppFontOption {
  readonly value: AppFontFamily;
  readonly label: string;
  readonly description: string;
  readonly license: string;
  readonly previewText: string;
}

export const appFontOptions: readonly AppFontOption[] = [
  {
    value: 'system',
    label: 'System',
    description: 'Device default',
    license: 'Platform font',
    previewText: 'Aa',
  },
  {
    value: 'inter',
    label: 'Inter',
    description: 'Clean journal UI',
    license: 'SIL Open Font License',
    previewText: 'Aa',
  },
  {
    value: 'nunito',
    label: 'Nunito',
    description: 'Soft rounded sans',
    license: 'SIL Open Font License',
    previewText: 'Aa',
  },
  {
    value: 'lora',
    label: 'Lora',
    description: 'Readable serif',
    license: 'SIL Open Font License',
    previewText: 'Aa',
  },
  {
    value: 'merriweather',
    label: 'Merriweather',
    description: 'Bookish serif',
    license: 'SIL Open Font License',
    previewText: 'Aa',
  },
  {
    value: 'sourceCodePro',
    label: 'Source Code Pro',
    description: 'Monospace notes',
    license: 'SIL Open Font License',
    previewText: 'Aa',
  },
];

export const appFontSources = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  Merriweather_400Regular,
  Merriweather_500Medium,
  Merriweather_600SemiBold,
  Merriweather_700Bold,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  SourceCodePro_400Regular,
  SourceCodePro_500Medium,
  SourceCodePro_600SemiBold,
  SourceCodePro_700Bold,
};

export function normalizeAppFontFamily(value: unknown): AppFontFamily {
  if (value === 'inter' || value === 'nunito' || value === 'lora' || value === 'merriweather' || value === 'sourceCodePro') {
    return value;
  }
  if (value === 'serif') return 'lora';
  if (value === 'monospace') return 'sourceCodePro';
  return 'system';
}

export function resolveAppFontFamily(value: unknown, fontsLoaded: boolean): string {
  const family = normalizeAppFontFamily(value);
  if (!fontsLoaded || family === 'system') return Platform.OS === 'ios' ? 'System' : 'sans-serif';
  if (family === 'inter') return 'Inter_400Regular';
  if (family === 'nunito') return 'Nunito_400Regular';
  if (family === 'lora') return 'Lora_400Regular';
  if (family === 'merriweather') return 'Merriweather_400Regular';
  return 'SourceCodePro_400Regular';
}

export function getAppFontLabel(value: unknown): string {
  const family = normalizeAppFontFamily(value);
  return appFontOptions.find((option) => option.value === family)?.label ?? 'System';
}
