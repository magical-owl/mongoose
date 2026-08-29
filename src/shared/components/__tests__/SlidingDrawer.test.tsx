import { fireEvent } from '@testing-library/react-native';
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

  it('renders a tappable profile section when profile data is provided', async () => {
    const handleClose = jest.fn();
    const handleProfilePress = jest.fn();
    const { getByTestId, getByText } = await renderWithProviders(
      <SlidingDrawer
        visible
        onClose={handleClose}
        accessibilityCloseLabel="Close menu"
        profile={{ displayName: 'Sarah Meadow' }}
        onProfilePress={handleProfilePress}
        profileAccessibilityLabel="Edit profile"
        testID="drawer"
      >
        <Text>Drawer content</Text>
      </SlidingDrawer>,
    );

    fireEvent.press(getByTestId('drawer-profile'));
    fireEvent.press(getByTestId('drawer-close'));

    expect(getByText('Sarah Meadow')).toBeTruthy();
    expect(handleProfilePress).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
