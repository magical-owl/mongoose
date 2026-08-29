import { SlidingDrawer } from '../SlidingDrawer';
import { renderWithProviders } from '@tests/helpers';
import { Text } from 'react-native';

describe('SlidingDrawer', () => {
  it('renders drawer content when visible', async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <SlidingDrawer
        visible
        onClose={jest.fn()}
        accessibilityCloseLabel="Close menu"
        testID="drawer"
      >
        <Text>Drawer content</Text>
      </SlidingDrawer>,
    );

    expect(getByTestId('drawer')).toBeTruthy();
    expect(getByText('Drawer content')).toBeTruthy();
  });

  it('does not render drawer content when hidden', async () => {
    const { queryByTestId, queryByText } = await renderWithProviders(
      <SlidingDrawer
        visible={false}
        onClose={jest.fn()}
        accessibilityCloseLabel="Close menu"
        testID="drawer"
      >
        <Text>Drawer content</Text>
      </SlidingDrawer>,
    );

    expect(queryByTestId('drawer')).toBeNull();
    expect(queryByText('Drawer content')).toBeNull();
  });
});
