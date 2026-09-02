import { fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ReflectionSummaryButton } from '@/features/diary/components/ReflectionSummaryButton';
import { renderWithProviders } from '@tests/helpers';

describe('ReflectionSummaryButton', () => {
  it('renders the reflection count and calls onPress', async () => {
    const onPress = jest.fn();
    const { getByLabelText, getByText } = await renderWithProviders(
      <ReflectionSummaryButton count={2} onPress={onPress} accessibilityLabel="Open reflections" />,
    );

    fireEvent.press(getByLabelText('Open reflections'));

    expect(getByText('2')).toBeTruthy();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports larger sizing for the diary view footer', async () => {
    const { getByLabelText } = await renderWithProviders(
      <ReflectionSummaryButton
        count={4}
        onPress={jest.fn()}
        accessibilityLabel="Open reflections"
        iconSize={21}
        height={38}
        minWidth={62}
      />,
    );

    const style = StyleSheet.flatten(getByLabelText('Open reflections').props.style);

    expect(style.height).toBe(38);
    expect(style.minWidth).toBe(62);
    expect(style.borderRadius).toBe(19);
  });

  it('can render without the tinted backing', async () => {
    const { getByLabelText } = await renderWithProviders(
      <ReflectionSummaryButton
        count={1}
        onPress={jest.fn()}
        accessibilityLabel="Open reflections"
        variant="plain"
      />,
    );

    const style = StyleSheet.flatten(getByLabelText('Open reflections').props.style);

    expect(style.backgroundColor).toBe('transparent');
  });
});
