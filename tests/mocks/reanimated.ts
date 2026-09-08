const ReactNative = jest.requireActual<typeof import('react-native')>('react-native');

type AnimationCallback = (finished: boolean) => void;

const cancelAnimation = jest.fn();
const withSpring = jest.fn((toValue: number, _config?: unknown, callback?: AnimationCallback) => {
  callback?.(true);
  return toValue;
});
const withTiming = jest.fn((toValue: number, _config?: unknown, callback?: AnimationCallback) => {
  callback?.(true);
  return toValue;
});

function runOnJS<T extends (...args: never[]) => unknown>(callback: T): T {
  return callback;
}

function useAnimatedStyle<T extends Record<string, unknown>>(callback: () => T): T {
  return callback();
}

function useSharedValue(initialValue: number): {
  get: () => number;
  set: (nextValue: number) => void;
} {
  let currentValue = initialValue;
  return {
    get: () => currentValue,
    set: (nextValue: number) => {
      currentValue = nextValue;
    },
  };
}

function resetReanimatedMocks(): void {
  cancelAnimation.mockClear();
  withSpring.mockClear();
  withTiming.mockClear();
}

module.exports = {
  __esModule: true,
  default: {
    View: ReactNative.View,
  },
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  __resetReanimatedMocks: resetReanimatedMocks,
};
