import { fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileEditorForm } from '@/features/profile/components/ProfileEditorForm';
import { renderWithProviders } from '@tests/helpers';

const mockSaveProfile = jest.fn();

jest.mock('@/features/profile/hooks/useProfileForm', () => ({
  useProfileForm: () => ({
    saveProfile: mockSaveProfile,
  }),
}));

describe('ProfileEditorForm', () => {
  beforeEach(() => {
    mockSaveProfile.mockReset();
  });

  it('saves the current display name and existing avatar', async () => {
    mockSaveProfile.mockResolvedValue({
      success: true,
      data: {
        id: 'profile-1',
        displayName: 'Sarah',
        avatarUri: 'file:///avatar.jpg',
        createdAt: '2026-08-29T00:00:00.000Z',
        updatedAt: '2026-08-29T00:00:00.000Z',
      },
    });
    const onSaved = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <ProfileEditorForm
        profile={{
          id: 'profile-1',
          displayName: 'Sarah',
          avatarUri: 'file:///avatar.jpg',
          createdAt: '2026-08-29T00:00:00.000Z',
          updatedAt: '2026-08-29T00:00:00.000Z',
        }}
        onSaved={onSaved}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    fireEvent.press(getByTestId('profile-save-button'));

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledWith({
        displayName: 'Sarah',
        email: undefined,
        bio: undefined,
        avatarUri: 'file:///avatar.jpg',
      });
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
  });
});
