import { fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { AccentPillButton } from '@shared/components/AccentPillButton';
import { renderWithProviders } from '@tests/helpers';
import { accentColors } from '@theme/accents';

describe('AccentPillButton', () => {
  it('uses the label as the default accessibility label', async () => {
    const handlePress = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <AccentPillButton label="Save" onPress={handlePress} testID="save-button" />,
    );

    fireEvent.press(getByTestId('save-button'));

    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('supports an explicit accessibility label', async () => {
    const { getByLabelText } = await renderWithProviders(
      <AccentPillButton label="Save" accessibilityLabel="Save diary entry" />,
    );

    expect(getByLabelText('Save diary entry')).toBeTruthy();
  });

  it('uses the active theme accent color by default', async () => {
    const { getByTestId } = await renderWithProviders(
      <AccentPillButton label="Create" testID="create-button" />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const style = StyleSheet.flatten(getByTestId('create-button').props.style);

    expect(style.backgroundColor).toBe(accentColors.blue.dark);
  });

  it('supports overriding label text metrics', async () => {
    const { getByText } = await renderWithProviders(
      <AccentPillButton label="Today" labelStyle={{ fontSize: 14, lineHeight: 17 }} />,
    );

    const style = StyleSheet.flatten(getByText('Today').props.style);

    expect(style.fontSize).toBe(14);
    expect(style.lineHeight).toBe(17);
  });
});
