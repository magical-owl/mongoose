import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TagBadgeList } from '@/features/diary/components/TagBadgeList';
import { renderWithProviders } from '@tests/helpers';

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

describe('TagBadgeList', () => {
  it('renders the first tag and summarizes overflow', async () => {
    const { getByText, getByTestId, queryByTestId } = await renderWithProviders(
      <TagBadgeList
        tags={['work', 'family', 'travel']}
        maxVisible={1}
        testID="tags"
      />,
      { wrapperOptions: { initialThemeMode: 'light' } },
    );

    const firstTagStyle = StyleSheet.flatten(getByTestId('tags-work').props.style);

    expect(getByText('#work')).toBeTruthy();
    expect(getByText('+2')).toBeTruthy();
    expect(firstTagStyle.borderWidth).toBe(1);
    expect(getByTestId('tags-overflow').props.accessibilityLabel).toBe('#family, #travel');
    expect(queryByTestId('tags-family')).toBeNull();
  });

  it('opens a popup with every tag when overflow is enabled', async () => {
    const { getByTestId, findByText } = await renderWithProviders(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <TagBadgeList
          tags={['work', 'family', 'travel']}
          maxVisible={1}
          overflowPopup
          testID="tags"
        />
      </SafeAreaProvider>,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    fireEvent.press(getByTestId('tags-overflow'));

    expect(await findByText('TAGS')).toBeTruthy();
    expect(await findByText('#family')).toBeTruthy();
    expect(await findByText('#travel')).toBeTruthy();
  });
});
