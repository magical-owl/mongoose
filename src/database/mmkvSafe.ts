/**
 * Safe MMKV Factory
 *
 * Wraps react-native-mmkv so the app doesn't crash in Expo Go / CI environments
 * where NitroModules (the MMKV native module) isn't linked.
 *
 * In production (development build / EAS build), MMKV works as normal.
 * In Expo Go or Jest, an in-memory fallback is used transparently.
 */

import type { MMKV } from 'react-native-mmkv';

// ---------------------------------------------------------------------------
// In-memory fallback that implements the MMKV interface surface we use
// ---------------------------------------------------------------------------

function createMemoryMMKV(): MMKV {
  const store = new Map<string, string | number | boolean | Uint8Array>();

  return {
    getString: (key: string) => {
      const v = store.get(key);
      return typeof v === 'string' ? v : undefined;
    },
    getNumber: (key: string) => {
      const v = store.get(key);
      return typeof v === 'number' ? v : undefined;
    },
    getBoolean: (key: string) => {
      const v = store.get(key);
      return typeof v === 'boolean' ? v : undefined;
    },
    getBuffer: (key: string) => {
      const v = store.get(key);
      return v instanceof Uint8Array ? v : undefined;
    },
    set: (key: string, value: string | number | boolean | Uint8Array) => {
      store.set(key, value);
    },
    delete: (key: string) => {
      store.delete(key);
    },
    // Alias used by some older code paths
    remove: (key: string) => {
      store.delete(key);
    },
    contains: (key: string) => store.has(key),
    getAllKeys: () => Array.from(store.keys()),
    clearAll: () => store.clear(),
    // Stub out methods we don't use
    addOnValueChangedListener: () => ({ remove: () => {} }),
    recrypt: () => {},
    trim: () => {},
    // Required by the MMKV type — provide id/path stubs
    id: 'memory',
    path: undefined,
  } as unknown as MMKV;
}

// ---------------------------------------------------------------------------
// Safe factory — tries real MMKV, falls back to memory
// ---------------------------------------------------------------------------

export function createSafeMMKV(config: { id: string; encryptionKey?: string }): MMKV {
  try {
    // Dynamic require so Metro doesn't fail to bundle in unsupported envs
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const instance = createMMKV(config);
    // Eagerly verify native side is present (getString is a native call)
    instance.getString('__probe__');
    return instance;
  } catch {
    if (__DEV__) {
      console.warn(
        `[MMKV] Native module unavailable for "${config.id}" — using in-memory fallback. ` +
          'Run a development build for full MMKV support.'
      );
    }
    return createMemoryMMKV();
  }
}
