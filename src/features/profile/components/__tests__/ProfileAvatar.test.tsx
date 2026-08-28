import { StyleSheet } from 'react-native';
import { ProfileAvatar, getProfileInitials } from '@/features/profile/components/ProfileAvatar';
import { renderWithProviders } from '@tests/helpers';
import { accentColors } from '@theme/accents';

describe('ProfileAvatar', () => {
  it('derives compact initials from a display name', () => {
    expect(getProfileInitials('Sarah Meadow')).toBe('SM');
    expect(getProfileInitials('Sarah')).toBe('S');
    expect(getProfileInitials('')).toBe('');
  });

  it('renders a themed circular fallback avatar', async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <ProfileAvatar
        profile={{ displayName: 'Sarah Meadow' }}
        size={32}
        accessibilityLabel="Profile avatar"
        testID="profile-avatar"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const style = StyleSheet.flatten(getByTestId('profile-avatar').props.style);

    expect(style.width).toBe(32);
    expect(style.height).toBe(32);
    expect(style.borderRadius).toBe(16);
    expect(style.backgroundColor).toBe(`${accentColors.blue.dark}18`);
    expect(getByText('SM')).toBeTruthy();
  });
});
