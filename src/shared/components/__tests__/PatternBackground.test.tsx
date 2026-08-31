import { Text } from 'react-native';
import { renderWithProviders } from '@tests/helpers';
import { PATTERN_BACKGROUND_VARIANTS, PatternBackground, PatternBackgroundPreview } from '../PatternBackground';

describe('PatternBackground', () => {
  it('renders children above a decorative transparent pattern layer', async () => {
    const { getByText, getByTestId } = await renderWithProviders(
      <PatternBackground variant="spring" testID="pattern-background">
        <Text>Foreground content</Text>
      </PatternBackground>,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('pattern-background')).toBeTruthy();
    expect(getByText('Foreground content')).toBeTruthy();
  });

  it('exposes the available pattern background variants', () => {
    expect(PATTERN_BACKGROUND_VARIANTS).toEqual([
      'spring',
      'summer',
      'autumn',
      'winter',
    ]);
  });

  it('renders a compact preview for a pattern background variant', async () => {
    const { getByTestId } = await renderWithProviders(
      <PatternBackgroundPreview variant="winter" selected testID="pattern-preview" />,
    );

    expect(getByTestId('pattern-preview')).toBeTruthy();
  });
});
