import { fireEvent, waitFor } from '@testing-library/react-native';
import { Animated, StyleSheet } from 'react-native';
import { AppFooterNavigation } from '../AppFooterNavigation';
import { renderWithProviders } from '@tests/helpers';
import { accentColors } from '@/theme/accents';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    callback();
  },
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('AppFooterNavigation', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a floating footer with the active item highlighted', async () => {
    const { getByTestId } = await renderWithProviders(
      <AppFooterNavigation activeItem="calendar" bottom={12} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const toolbarStyle = StyleSheet.flatten(getByTestId('app-footer-navigation').props.style);

    expect(toolbarStyle.borderRadius).toBe(28);
    fireEvent(getByTestId('app-footer-navigation-track'), 'layout', {
      nativeEvent: { layout: { width: 300, height: 42 } },
    });

    await waitFor(() => expect(getByTestId('app-footer-navigation-indicator')).toBeTruthy());

    const indicatorStyle = StyleSheet.flatten(getByTestId('app-footer-navigation-indicator').props.style);
    expect(indicatorStyle.backgroundColor).toBe(`${accentColors.blue.dark}18`);
    expect(indicatorStyle.width).toBeCloseTo((300 - 18) / 4);
    expect(getByTestId('app-footer-navigation-rediscover')).toBeTruthy();
  });

  it('springs the footer indicator to the active tab after measurement', async () => {
    const springSpy = jest.spyOn(Animated, 'spring');
    const { getByTestId } = await renderWithProviders(
      <AppFooterNavigation activeItem="rediscover" bottom={12} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    fireEvent(getByTestId('app-footer-navigation-track'), 'layout', {
      nativeEvent: { layout: { width: 300, height: 42 } },
    });

    await waitFor(() => {
      expect(springSpy).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          friction: 10,
          tension: 100,
          toValue: 2,
          useNativeDriver: true,
        }),
      );
    });
  });
});
