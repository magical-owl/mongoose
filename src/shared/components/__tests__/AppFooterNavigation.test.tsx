import { StyleSheet } from 'react-native';
import { AppFooterNavigation } from '../AppFooterNavigation';
import { renderWithProviders } from '@tests/helpers';
import { accentColors } from '@/theme/accents';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('AppFooterNavigation', () => {
  it('renders a floating footer with the active item highlighted', async () => {
    const { getByTestId } = await renderWithProviders(
      <AppFooterNavigation activeItem="calendar" bottom={12} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const toolbarStyle = StyleSheet.flatten(getByTestId('app-footer-navigation').props.style);
    const calendarStyle = StyleSheet.flatten(getByTestId('app-footer-navigation-calendar').props.style);

    expect(toolbarStyle.borderRadius).toBe(28);
    expect(calendarStyle.backgroundColor).toBe(`${accentColors.blue.dark}18`);
  });
});
