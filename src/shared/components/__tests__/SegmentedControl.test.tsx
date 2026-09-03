import { fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { SegmentedControl } from '@/shared/components/SegmentedControl';
import { renderWithProviders } from '@tests/helpers';

function getSegmentTab<T extends { readonly props: { readonly accessibilityRole?: string } }>(nodes: T[]): T {
  const tab = nodes.find((node) => node.props.accessibilityRole === 'tab');
  if (!tab) {
    throw new Error('Segment tab not found');
  }
  return tab;
}

describe('SegmentedControl', () => {
  it('routes segment presses by index', async () => {
    const onSelect = jest.fn();
    const { getAllByLabelText } = await renderWithProviders(
      <SegmentedControl
        segments={['Timeline', 'Card', 'Feed']}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );

    fireEvent.press(getSegmentTab(getAllByLabelText('Feed')));

    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('renders the sliding indicator after measuring the control', async () => {
    const { getByTestId } = await renderWithProviders(
      <SegmentedControl
        segments={['Timeline', 'Card', 'Feed']}
        selectedIndex={1}
        onSelect={jest.fn()}
        containerStyle={{ padding: 4 }}
        testID="entry-view-mode"
      />,
    );

    fireEvent(getByTestId('entry-view-mode'), 'layout', {
      nativeEvent: { layout: { width: 300, height: 44 } },
    });

    await waitFor(() => expect(getByTestId('entry-view-mode-indicator')).toBeTruthy());

    const indicatorStyle = StyleSheet.flatten(getByTestId('entry-view-mode-indicator').props.style);
    expect(indicatorStyle.left).toBe(4);
    expect(indicatorStyle.width).toBeCloseTo((300 - 8) / 3);
  });

  it('marks the active segment as selected', async () => {
    const { getAllByLabelText, rerender } = await renderWithProviders(
      <SegmentedControl
        segments={['Timeline', 'Card', 'Feed']}
        selectedIndex={0}
        onSelect={jest.fn()}
      />,
    );

    expect(getSegmentTab(getAllByLabelText('Timeline')).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );

    await rerender(
      <SegmentedControl
        segments={['Timeline', 'Card', 'Feed']}
        selectedIndex={2}
        onSelect={jest.fn()}
      />,
    );

    expect(getSegmentTab(getAllByLabelText('Feed')).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
  });
});
