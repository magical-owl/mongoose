import { fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { renderWithProviders } from '@tests/helpers';
import { accentColors } from '@theme/accents';
import { palette } from '@theme/colors';

describe('IconCircleButton', () => {
  it('calls onPress when enabled', async () => {
    const handlePress = jest.fn();
    const { getByLabelText } = await renderWithProviders(
      <IconCircleButton icon="star-outline" accessibilityLabel="Favorite entry" onPress={handlePress} />,
    );

    fireEvent.press(getByLabelText('Favorite entry'));

    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const handlePress = jest.fn();
    const { getByLabelText } = await renderWithProviders(
      <IconCircleButton icon="star-outline" accessibilityLabel="Favorite entry" onPress={handlePress} disabled />,
    );

    fireEvent.press(getByLabelText('Favorite entry'));

    expect(handlePress).not.toHaveBeenCalled();
  });

  it('uses the active theme accent color by default', async () => {
    const { getByLabelText } = await renderWithProviders(
      <IconCircleButton icon="book-multiple" accessibilityLabel="Active filter" active />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const style = StyleSheet.flatten(getByLabelText('Active filter').props.style);

    expect(style.backgroundColor).toBe(`${accentColors.blue.dark}18`);
  });

  it('supports an overlay surface for image-backed controls', async () => {
    const { getByLabelText, getByTestId } = await renderWithProviders(
      <IconCircleButton icon="dots-horizontal" accessibilityLabel="More options" surface="overlay" testID="more-options" />,
    );

    const button = getByLabelText('More options');
    const style = StyleSheet.flatten(button.props.style);

    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0.42)');
    expect(StyleSheet.flatten(getByTestId('more-options-icon').props.style).color).toBe(palette.white);
  });
});
