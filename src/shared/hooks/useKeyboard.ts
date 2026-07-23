/**
 * useKeyboard Hook
 *
 * Tracks keyboard visibility, height, and animation duration.
 */

import { useState, useEffect } from 'react';
import { Keyboard, Platform, KeyboardEvent } from 'react-native';

export interface KeyboardState {
  readonly keyboardHeight: number;
  readonly isKeyboardVisible: boolean;
  readonly keyboardAnimationDuration: number;
}

/**
 * Hook that provides keyboard state including height, visibility, and animation duration.
 */
export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    keyboardHeight: 0,
    isKeyboardVisible: false,
    keyboardAnimationDuration: 250,
  });

  useEffect(() => {
    const onShow = (event: KeyboardEvent) => {
      setState({
        keyboardHeight: event.endCoordinates.height,
        isKeyboardVisible: true,
        keyboardAnimationDuration: event.duration ?? 250,
      });
    };

    const onHide = (event: KeyboardEvent) => {
      setState({
        keyboardHeight: 0,
        isKeyboardVisible: false,
        keyboardAnimationDuration: event.duration ?? 250,
      });
    };

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return state;
}