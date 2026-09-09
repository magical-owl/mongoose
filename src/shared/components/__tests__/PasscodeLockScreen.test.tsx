import { fireEvent } from '@testing-library/react-native';
import { PasscodeLockScreen } from '@shared/components/PasscodeLockScreen';
import { renderWithProviders } from '@tests/helpers';

describe('PasscodeLockScreen', () => {
  it('submits after four digits are entered', async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = await renderWithProviders(
      <PasscodeLockScreen
        title="Enter passcode"
        message="Unlock your diary."
        submitLabel="OK"
        onSubmit={onSubmit}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByLabelText('Enter 1'));
    await fireEvent.press(getByLabelText('Enter 2'));
    await fireEvent.press(getByLabelText('Enter 3'));
    await fireEvent.press(getByLabelText('Enter 4'));
    await fireEvent.press(getByText('OK'));

    expect(onSubmit).toHaveBeenCalledWith('1234');
  });

  it('deletes the last digit before submit', async () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = await renderWithProviders(
      <PasscodeLockScreen
        title="Enter passcode"
        submitLabel="OK"
        onSubmit={onSubmit}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByLabelText('Enter 1'));
    await fireEvent.press(getByLabelText('Enter 2'));
    await fireEvent.press(getByLabelText('Delete digit'));
    await fireEvent.press(getByLabelText('Enter 3'));
    await fireEvent.press(getByLabelText('Enter 4'));
    await fireEvent.press(getByLabelText('Enter 5'));
    await fireEvent.press(getByText('OK'));

    expect(onSubmit).toHaveBeenCalledWith('1345');
  });

  it('calls cancel when the cancel action is pressed', async () => {
    const onCancel = jest.fn();
    const { getByText } = await renderWithProviders(
      <PasscodeLockScreen
        title="Set a passcode"
        submitLabel="OK"
        cancelLabel="Cancel"
        onSubmit={jest.fn()}
        onCancel={onCancel}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
