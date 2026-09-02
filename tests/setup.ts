import '@testing-library/jest-native/extend-expect';

// Mock MMKV
jest.mock('react-native-mmkv', () => {
  const mockStorage: Record<string, string> = {};

  return {
    createMMKV: jest.fn(() => ({
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
      remove: jest.fn((key: string) => {
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
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

jest.mock('expo-crypto', () => ({
  AESEncryptionKey: {
    import: jest.fn(async (value: string) => ({ value })),
  },
  AESSealedData: {
    fromCombined: jest.fn((value: string) => ({ value })),
  },
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
  CryptoEncoding: {
    HEX: 'hex',
  },
  aesEncryptAsync: jest.fn(async () => ({
    combined: jest.fn(async () => 'encrypted-payload'),
  })),
  aesDecryptAsync: jest.fn(async () => ''),
  digestStringAsync: jest.fn(async () => '0'.repeat(64)),
  getRandomBytesAsync: jest.fn(async (length: number) => new Uint8Array(length).fill(1)),
}));

jest.mock('expo-file-system', () => {
  const deletedUris: string[] = [];
  class Directory {
    public readonly uri: string;
    public exists = true;

    public constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts
        .map((part) => (typeof part === 'string' ? part : part.uri))
        .join('/')
        .replace(/\/+/g, '/')
        .replace('file:/', 'file://');
    }

    public create(): void {}

    public delete(): void {
      deletedUris.push(this.uri);
      this.exists = false;
    }
  }

  class File {
    public readonly uri: string;
    public exists = true;

    public constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts
        .map((part) => (typeof part === 'string' ? part : part.uri))
        .join('/')
        .replace(/\/+/g, '/')
        .replace('file:/', 'file://');
    }

    public async copy(): Promise<void> {}

    public create(): void {}

    public write(): void {}

    public async text(): Promise<string> {
      return '';
    }

    public delete(): void {
      deletedUris.push(this.uri);
      this.exists = false;
    }
  }

  return {
    Directory,
    File,
    Paths: {
      document: new Directory('file:///document'),
      cache: new Directory('file:///cache'),
    },
    __deletedUris: deletedUris,
  };
});

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

jest.mock('expo-iap', () => ({
  endConnection: jest.fn().mockResolvedValue(undefined),
  fetchProducts: jest.fn().mockResolvedValue([]),
  finishTransaction: jest.fn().mockResolvedValue(undefined),
  getAvailablePurchases: jest.fn().mockResolvedValue([]),
  initConnection: jest.fn().mockResolvedValue(true),
  requestPurchase: jest.fn().mockResolvedValue(null),
  restorePurchases: jest.fn().mockResolvedValue(undefined),
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
  useFonts: jest.fn(() => [true, null]),
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

jest.mock('react-native-webview', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockWebView = (props: Record<string, unknown>) => React.createElement(View, props);
  MockWebView.displayName = 'MockWebView';
  return {
    __esModule: true,
    default: MockWebView,
  };
});

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
