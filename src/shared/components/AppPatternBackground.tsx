import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useAppStore } from '@/stores/useAppStore';
import {
  DEFAULT_PATTERN_BACKGROUND_VARIANT,
  isPatternBackgroundVariant,
} from '@/theme/patternBackgrounds';
import { PatternBackground } from './PatternBackground';

interface AppPatternBackgroundProps {
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function AppPatternBackground({
  children,
  style,
  contentStyle,
  testID,
}: AppPatternBackgroundProps): React.JSX.Element {
  const storedVariant = useAppStore((state) => state.patternBackgroundVariant);
  const variant = isPatternBackgroundVariant(storedVariant)
    ? storedVariant
    : DEFAULT_PATTERN_BACKGROUND_VARIANT;

  return (
    <PatternBackground variant={variant} style={style} contentStyle={contentStyle} testID={testID}>
      {children}
    </PatternBackground>
  );
}
