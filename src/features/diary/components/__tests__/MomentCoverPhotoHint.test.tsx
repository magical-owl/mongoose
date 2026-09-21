import { Alert } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { MomentCoverPhotoHint } from '@/features/diary/components/MomentCoverPhotoHint';
import { useAppStore } from '@/stores/useAppStore';
import { renderWithProviders } from '@tests/helpers';

describe('MomentCoverPhotoHint', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('hides tips and shows a one-time settings notice when dismissed', async () => {
    const { getByTestId, queryByTestId, rerender } = await renderWithProviders(
      <MomentCoverPhotoHint testID="moment-cover-hint" />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('moment-cover-hint-dismiss'));

    expect(useAppStore.getState().showTips).toBe(false);
    expect(useAppStore.getState().tipDismissNoticeShown).toBe(true);
    expect(Alert.alert).toHaveBeenCalledWith('Tips hidden', 'You can show tips again from Settings > Display.');

    await rerender(<MomentCoverPhotoHint testID="moment-cover-hint" />);
    expect(queryByTestId('moment-cover-hint')).toBeNull();

    await act(async () => {
      useAppStore.getState().setShowTips(true);
    });
    expect(getByTestId('moment-cover-hint')).toBeTruthy();
    await fireEvent.press(getByTestId('moment-cover-hint-dismiss'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });
});
