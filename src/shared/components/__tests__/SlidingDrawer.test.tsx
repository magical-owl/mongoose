import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { SlidingDrawer } from '../SlidingDrawer';
import { renderWithProviders } from '@tests/helpers';
import { Animated, Text } from 'react-native';

describe('SlidingDrawer', () => {
  beforeEach(() => {
    const animation = {
      start: (callback?: (result: { finished: boolean }) => void) => {
        callback?.({ finished: true });
      },
      stop: jest.fn(),
      reset: jest.fn(),
    };
    jest.spyOn(Animated, 'timing').mockReturnValue(animation as unknown as Animated.CompositeAnimation);
    jest.spyOn(Animated, 'spring').mockReturnValue(animation as unknown as Animated.CompositeAnimation);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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

    await waitFor(() => expect(getByTestId('drawer-profile')).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByTestId('drawer-profile'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('drawer-close'));
    });

    expect(getByText('Sarah Meadow')).toBeTruthy();
    expect(handleProfilePress).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
