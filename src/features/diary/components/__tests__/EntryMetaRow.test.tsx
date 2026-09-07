import { fireEvent, waitFor } from '@testing-library/react-native';
import { EntryMetaRow } from '@/features/diary/components/EntryMetaRow';
import { renderWithProviders } from '@tests/helpers';

describe('EntryMetaRow', () => {
  it('renders reaction, mood, tag, and reflection controls in order', async () => {
    const onOpen = jest.fn();
    const onDismiss = jest.fn();
    const onToggleReaction = jest.fn();
    const onReflectionPress = jest.fn();
    const { getByTestId, getByText } = await renderWithProviders(
      <EntryMetaRow
        variant="card"
        moods={['happy', 'sad']}
        tags={['family', 'weekend']}
        memoryReactions={['cherish']}
        isMemoryReactionPickerVisible={false}
        onOpenMemoryReactionPicker={onOpen}
        onDismissMemoryReactionPicker={onDismiss}
        onToggleMemoryReaction={onToggleReaction}
        reflectionCount={3}
        onReflectionPress={onReflectionPress}
        reflectionAccessibilityLabel="Open reflections"
        testID="entry-meta-row"
        memoryReactionTestID="entry-meta-reaction"
        moodTestID="entry-meta-mood"
        tagTestID="entry-meta-tags"
        reflectionTestID="entry-meta-reflections"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('entry-meta-row').children[0]).toBe(getByTestId('entry-meta-reaction').parent);
    expect(getByText('Happy +1')).toBeTruthy();
    expect(getByText('#family +1')).toBeTruthy();

    fireEvent.press(getByTestId('entry-meta-reaction'));
    expect(onOpen).toHaveBeenCalled();

    fireEvent.press(getByTestId('entry-meta-reflections'));
    expect(onReflectionPress).toHaveBeenCalled();
  });

  it('returns no surface when no metadata is available', async () => {
    const { queryByTestId } = await renderWithProviders(
      <EntryMetaRow variant="timeline" moods={[]} tags={[]} testID="entry-meta-row" />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await waitFor(() => expect(queryByTestId('entry-meta-row')).toBeNull());
  });
});
