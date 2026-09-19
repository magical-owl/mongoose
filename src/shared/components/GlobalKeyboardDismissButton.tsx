import { useCallback, useContext, useEffect, useState } from 'react';
import { Keyboard, StyleSheet, View, type KeyboardEvent } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useTranslation } from '@/localization/i18n';
import { IconCircleButton } from '@/shared/components/IconCircleButton';

const ROOT_FOOTER_CLEARANCE = 72;
const BUTTON_EDGE_OFFSET = 18;
const KEYBOARD_GAP = 8;
const keyboardDismissHandlers = new Set<() => void>();
const overlayLayerSubscribers = new Set<() => void>();
let activeOverlayLayerCount = 0;

interface GlobalKeyboardDismissButtonProps {
  readonly bottomClearance?: number;
  readonly layer?: 'root' | 'overlay';
}

export function GlobalKeyboardDismissButton({
  bottomClearance = KEYBOARD_GAP,
  layer = 'overlay',
}: GlobalKeyboardDismissButtonProps): React.JSX.Element | null {
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const t = useTranslation();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const activeOverlayCount = useActiveKeyboardDismissOverlayCount();

  useEffect(() => {
    const handleShow = (event: KeyboardEvent) => {
      setKeyboardHeight(Math.max(0, event.endCoordinates.height));
    };
    const handleHide = () => setKeyboardHeight(0);

    const subscriptions = [
      Keyboard.addListener('keyboardWillShow', handleShow),
      Keyboard.addListener('keyboardDidShow', handleShow),
      Keyboard.addListener('keyboardWillHide', handleHide),
      Keyboard.addListener('keyboardDidHide', handleHide),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  useEffect(() => {
    if (layer !== 'overlay') return undefined;

    activeOverlayLayerCount += 1;
    notifyOverlayLayerSubscribers();

    return () => {
      activeOverlayLayerCount = Math.max(0, activeOverlayLayerCount - 1);
      notifyOverlayLayerSubscribers();
    };
  }, [layer]);

  const handleDismissKeyboard = useCallback(() => {
    keyboardDismissHandlers.forEach((handler) => handler());
    Keyboard.dismiss();
  }, []);

  if (keyboardHeight <= 0 || (layer === 'root' && activeOverlayCount > 0)) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <IconCircleButton
        icon="keyboard-close"
        size="sm"
        surface="overlay"
        onPress={handleDismissKeyboard}
        accessibilityLabel={t('entryDismissKeyboardA11y')}
        testID="global-keyboard-dismiss-button"
        style={[
          styles.button,
          {
            bottom: keyboardHeight + Math.max(insets.bottom, KEYBOARD_GAP) + bottomClearance,
          },
        ]}
      />
    </View>
  );
}

function notifyOverlayLayerSubscribers() {
  overlayLayerSubscribers.forEach((subscriber) => subscriber());
}

function useActiveKeyboardDismissOverlayCount() {
  const [count, setCount] = useState(activeOverlayLayerCount);

  useEffect(() => {
    const update = () => setCount(activeOverlayLayerCount);
    overlayLayerSubscribers.add(update);
    update();

    return () => {
      overlayLayerSubscribers.delete(update);
    };
  }, []);

  return count;
}

export function useGlobalKeyboardDismissHandler(handler: () => void) {
  useEffect(() => {
    keyboardDismissHandlers.add(handler);

    return () => {
      keyboardDismissHandlers.delete(handler);
    };
  }, [handler]);
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: BUTTON_EDGE_OFFSET,
    zIndex: 1000,
    elevation: 1000,
  },
});

export const GLOBAL_KEYBOARD_DISMISS_ROOT_CLEARANCE = ROOT_FOOTER_CLEARANCE;
