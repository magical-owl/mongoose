import { fireEvent } from '@testing-library/react-native';
import { EntryCoverSummary } from '@/features/diary/components/EntryCoverSummary';
import { renderWithProviders } from '@tests/helpers';

describe('EntryCoverSummary', () => {
  it('renders title, timestamp, view count, mood, and tag overlays', async () => {
    const onShuffle = jest.fn();
    const onViewCountPress = jest.fn();
    const { getByLabelText, getByTestId, getByText } = await renderWithProviders(
      <EntryCoverSummary
        variant="memoryFeatured"
        title="Quiet morning"
        timestamp="Sep 7, 2026"
        imageSource={{ uri: 'file:///cover.jpg' }}
        isFavorite
        viewCount={4}
        viewCountAccessibilityLabel="Viewed 4 times."
        onViewCountPress={onViewCountPress}
        memoryReactions={['wonder']}
        moods={['happy', 'sad']}
        tags={['family', 'weekend']}
        onShuffle={onShuffle}
        shuffleAccessibilityLabel="Shuffle memory"
        imageTestID="entry-cover-summary-image"
        viewCountTestID="entry-cover-summary-view-count"
        timestampTestID="entry-cover-summary-timestamp"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('entry-cover-summary-image').props.source).toEqual({ uri: 'file:///cover.jpg' });
    expect(getByText('Quiet morning')).toBeTruthy();
    expect(getByTestId('entry-cover-summary-timestamp')).toBeTruthy();
    expect(getByText('Wonder')).toBeTruthy();
    expect(getByText('Happy +1')).toBeTruthy();
    expect(getByText('#family +1')).toBeTruthy();
    expect(getByTestId('entry-cover-summary-view-count')).toBeTruthy();

    await fireEvent.press(getByLabelText('Shuffle memory'));
    expect(onShuffle).toHaveBeenCalled();

    await fireEvent.press(getByLabelText('Viewed 4 times.'));
    expect(onViewCountPress).toHaveBeenCalled();
  });
});
