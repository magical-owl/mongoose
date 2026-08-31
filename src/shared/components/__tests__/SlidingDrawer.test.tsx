import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { withTiming } from 'react-native-reanimated';
import { SlidingDrawer } from '../SlidingDrawer';
import { renderWithProviders } from '@tests/helpers';

jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  const cancelAnimation = jest.fn();
  const withSpring = jest.fn((toValue: number) => toValue);
  const withTiming = jest.fn((
    toValue: number,
    _config?: { readonly duration?: number },
    callback?: (finished: boolean) => void,
  ) => {
    callback?.(true);
    return toValue;
  });

  return {
    __esModule: true,
    default: { View },
    cancelAnimation,
    runOnJS: (callback: (value: boolean) => void) => callback,
    useAnimatedStyle: (callback: () => Record<string, unknown>) => callback(),
    useSharedValue: (initialValue: number) => {
      let currentValue = initialValue;
      return {
        get: () => currentValue,
        set: (nextValue: number) => {
          currentValue = nextValue;
        },
      };
    },
    withSpring,
    withTiming,
  };
});

describe('SlidingDrawer', () => {
  afterEach(() => {
    jest.clearAllMocks();
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

  it('starts the entrance animation from the left edge', async () => {
    await renderWithProviders(
      <SlidingDrawer
        visible
        onClose={jest.fn()}
        accessibilityCloseLabel="Close menu"
        testID="drawer"
      >
        <Text>Drawer content</Text>
      </SlidingDrawer>,
    );

    expect(withTiming).toHaveBeenCalledWith(1, { duration: 220 });
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
    expect(StyleSheet.flatten(getByTestId('drawer-profile').props.style).borderRadius).toBe(8);
    expect(StyleSheet.flatten(getByText('Sarah Meadow').props.style).textDecorationLine).toBe('underline');
    expect(getByTestId('drawer-profile-chevron')).toBeTruthy();
    expect(handleProfilePress).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
