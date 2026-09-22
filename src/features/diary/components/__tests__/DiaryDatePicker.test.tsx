import { fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';
import { DiaryDatePicker } from '@/features/diary/components/DiaryDatePicker';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@react-native-community/datetimepicker', () => {
  const { View: MockView } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <MockView testID="native-date-picker" {...props} />
    ),
  };
});

describe('DiaryDatePicker', () => {
  it('uses the active theme text color for the entry hero date label in light mode', async () => {
    const { getByText } = await renderWithProviders(
      <DiaryDatePicker
        value={new Date('2026-01-02T12:00:00.000Z')}
        onChange={jest.fn()}
        variant="entryHero"
      />,
      { wrapperOptions: { initialThemeMode: 'light' } },
    );

    const labelStyle = StyleSheet.flatten(getByText('Friday, January 2, 2026').props.style);

    expect(labelStyle.color).toBe('#111827');
  });

  it('passes readable dark-mode text props to the native entry date picker', async () => {
    const { getByTestId } = await renderWithProviders(
      <View>
        <DiaryDatePicker
          value={new Date('2026-01-02T12:00:00.000Z')}
          onChange={jest.fn()}
          maximumDate={new Date('2026-01-03T12:00:00.000Z')}
          variant="entryHero"
          testID="entry-date-button"
        />
      </View>,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('entry-date-button'));

    await waitFor(() => {
      expect(getByTestId('native-date-picker').props.themeVariant).toBe('dark');
      expect(getByTestId('native-date-picker').props.textColor).toBeTruthy();
    });
  });
});
