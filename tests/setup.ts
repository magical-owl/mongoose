import '@testing-library/jest-native/extend-expect';

// Mock MMKV
jest.mock('react-native-mmkv', () => {
  const mockStorage: Record<string, string> = {};

  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: jest.fn((key: string) => mockStorage[key] ?? null),
      set: jest.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      getBoolean: jest.fn((key: string) => {
        const val = mockStorage[key];
        return val === 'true' ? true : val === 'false' ? false : null;
      }),
      getNumber: jest.fn((key: string) => {
        const val = mockStorage[key];
        return val !== undefined ? Number(val) : null;
      }),
      delete: jest.fn((key: string) => {
        delete mockStorage[key];
      }),
      clearAll: jest.fn(() => {
        Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
      }),
      getAllKeys: jest.fn(() => Object.keys(mockStorage)),
      contains: jest.fn((key: string) => key in mockStorage),
    })),
    useMMKVStorage: jest.fn(),
  };
});

// Mock expo modules that may cause issues in test environment
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      },
    },
  },
  manifest: {
    extra: {
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-anon-key',
    },
  },
  executionEnvironment: 'jest',
  platform: 'ios',
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `exp://localhost:19000/${path}`),
  makeUrl: jest.fn((path: string) => `exp://localhost:19000/${path}`),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  openURL: jest.fn(),
  canOpenURL: jest.fn().mockResolvedValue(true),
  useURL: jest.fn(),
  useLinking: jest.fn(),
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn().mockResolvedValue(undefined),
  isLoaded: jest.fn().mockReturnValue(true),
  isLoading: jest.fn().mockReturnValue(false),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn().mockResolvedValue(''),
  setStringAsync: jest.fn().mockResolvedValue(true),
  hasStringAsync: jest.fn().mockResolvedValue(false),
}));

// Suppress noisy React Native warnings in test output
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (
    message.includes('Animated: `useNativeDriver`') ||
    message.includes('VirtualizedLists should never be nested') ||
    message.includes('Non-serializable values were found in the navigation state') ||
    message.includes('React does not recognize')
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};
