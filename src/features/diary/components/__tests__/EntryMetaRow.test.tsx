import { fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
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

    await fireEvent.press(getByTestId('entry-meta-reaction'));
    expect(onOpen).toHaveBeenCalled();

    await fireEvent.press(getByTestId('entry-meta-reflections'));
    expect(onReflectionPress).toHaveBeenCalled();
  });

  it('returns no surface when no metadata is available', async () => {
    const { queryByTestId } = await renderWithProviders(
      <EntryMetaRow variant="timeline" moods={[]} tags={[]} testID="entry-meta-row" />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await waitFor(() => expect(queryByTestId('entry-meta-row')).toBeNull());
  });

  it('sizes and centers the reaction button in the view diary footer row', async () => {
    const { getByTestId } = await renderWithProviders(
      <EntryMetaRow
        variant="viewFooter"
        moods={['happy']}
        tags={['family']}
        memoryReactions={['cherish']}
        isMemoryReactionPickerVisible={false}
        onOpenMemoryReactionPicker={jest.fn()}
        onDismissMemoryReactionPicker={jest.fn()}
        onToggleMemoryReaction={jest.fn()}
        reflectionCount={1}
        onReflectionPress={jest.fn()}
        reflectionAccessibilityLabel="Open reflections"
        memoryReactionTestID="entry-view-reaction"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const reactionWrapperStyle = StyleSheet.flatten(getByTestId('entry-view-reaction').parent?.props.style);
    const reactionButtonStyle = StyleSheet.flatten(getByTestId('entry-view-reaction').props.style);

    expect(reactionWrapperStyle.alignSelf).toBe('center');
    expect(reactionButtonStyle.minHeight).toBe(38);
    expect(reactionButtonStyle.minWidth).toBe(62);
    expect(reactionButtonStyle.borderRadius).toBe(19);
  });
});
