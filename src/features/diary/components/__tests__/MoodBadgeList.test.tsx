import { StyleSheet } from 'react-native';
import { MoodBadgeList } from '@/features/diary/components/MoodBadgeList';
import { renderWithProviders } from '@tests/helpers';

describe('MoodBadgeList', () => {
  it('renders each visible mood as its own colored chip and summarizes overflow', async () => {
    const { getByTestId, queryByTestId } = await renderWithProviders(
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
    expect(queryByTestId('moods-excited')).toBeNull();
  });
});
