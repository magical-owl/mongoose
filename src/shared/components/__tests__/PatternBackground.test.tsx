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
      'none',
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

  it('renders without a decorative pattern layer when the variant is none', async () => {
    const { getByText, queryByTestId } = await renderWithProviders(
      <PatternBackground variant="none" testID="pattern-background">
        <Text>Plain content</Text>
      </PatternBackground>,
    );

    expect(getByText('Plain content')).toBeTruthy();
    expect(queryByTestId('pattern-background-pattern')).toBeNull();
  });
});
