import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MoodBadgeList } from '@/features/diary/components/MoodBadgeList';
import { renderWithProviders } from '@tests/helpers';

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

describe('MoodBadgeList', () => {
  it('renders each visible mood as its own colored chip and summarizes overflow', async () => {
    const { getByText, getByTestId, queryByTestId } = await renderWithProviders(
      <MoodBadgeList
        moods={['happy', 'grateful', 'calm', 'excited']}
        maxVisible={3}
        testID="moods"
      />,
      { wrapperOptions: { initialThemeMode: 'light' } },
    );

    const happyStyle = StyleSheet.flatten(getByTestId('moods-happy').props.style);
    const gratefulStyle = StyleSheet.flatten(getByTestId('moods-grateful').props.style);

    expect(happyStyle.borderColor).toBeTruthy();
    expect(gratefulStyle.borderColor).toBeTruthy();
    expect(happyStyle.borderColor).not.toBe(gratefulStyle.borderColor);
    expect(getByTestId('moods-overflow')).toBeTruthy();
    expect(getByTestId('moods-overflow').props.accessibilityLabel).toBe('Excited');
    expect(getByText('+1')).toBeTruthy();
    expect(queryByTestId('moods-excited')).toBeNull();
  });

  it('opens a popup with every mood when overflow is enabled', async () => {
    const { getByTestId, findByText } = await renderWithProviders(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <MoodBadgeList
          moods={['happy', 'grateful', 'calm']}
          maxVisible={1}
          overflowPopup
          testID="moods"
        />
      </SafeAreaProvider>,
      { wrapperOptions: { initialThemeMode: 'light' } },
    );

    fireEvent.press(getByTestId('moods-overflow'));

    expect(await findByText('MOOD')).toBeTruthy();
    expect(await findByText('Grateful')).toBeTruthy();
    expect(await findByText('Calm')).toBeTruthy();
  });
});
