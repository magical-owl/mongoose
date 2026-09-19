import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import {
  GlobalKeyboardDismissButton,
  useGlobalKeyboardDismissHandler,
} from '@/shared/components/GlobalKeyboardDismissButton';
import { renderWithProviders } from '@tests/helpers';

type KeyboardListener = (event: { endCoordinates: { height: number } }) => void;

const keyboardListeners: Record<string, KeyboardListener[]> = {};

jest.mock('react-native', () => {
  const actual = jest.requireActual<typeof import('react-native')>('react-native');
  const reactNativeMock = Object.create(actual) as typeof actual;

  Object.defineProperty(reactNativeMock, 'Keyboard', {
    value: {
      addListener: jest.fn((eventName: string, listener: KeyboardListener) => {
        keyboardListeners[eventName] = [...(keyboardListeners[eventName] ?? []), listener];

        return {
          remove: jest.fn(() => {
            keyboardListeners[eventName] = (keyboardListeners[eventName] ?? []).filter((item) => item !== listener);
          }),
        };
      }),
      dismiss: jest.fn(),
    },
  });

  return reactNativeMock;
});

jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    SafeAreaInsetsContext: React.createContext({ top: 0, right: 0, bottom: 24, left: 0 }),
  };
});

function emitKeyboardEvent(eventName: string, height = 260) {
  (keyboardListeners[eventName] ?? []).forEach((listener) => listener({ endCoordinates: { height } }));
}

function RegisteredKeyboardDismissButton({ onDismiss }: { readonly onDismiss: () => void }) {
  useGlobalKeyboardDismissHandler(onDismiss);

  return <GlobalKeyboardDismissButton />;
}

describe('GlobalKeyboardDismissButton', () => {
  beforeEach(() => {
    Object.keys(keyboardListeners).forEach((eventName) => {
      keyboardListeners[eventName] = [];
    });
    jest.clearAllMocks();
  });

  it('appears when the keyboard opens and dismisses the keyboard', async () => {
    const onDismiss = jest.fn();
    const { queryByTestId, getByTestId } = await renderWithProviders(
      <RegisteredKeyboardDismissButton onDismiss={onDismiss} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(queryByTestId('global-keyboard-dismiss-button')).toBeNull();
    await waitFor(() => expect(Keyboard.addListener).toHaveBeenCalled());

    await act(() => {
      emitKeyboardEvent('keyboardDidShow');
    });
    await waitFor(() => expect(getByTestId('global-keyboard-dismiss-button')).toBeTruthy());

    fireEvent.press(getByTestId('global-keyboard-dismiss-button'));

    expect(onDismiss).toHaveBeenCalled();
    expect(Keyboard.dismiss).toHaveBeenCalled();

    await act(() => {
      emitKeyboardEvent('keyboardDidHide', 0);
    });
    await waitFor(() => expect(queryByTestId('global-keyboard-dismiss-button')).toBeNull());
  });
});
