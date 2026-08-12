/**
 * Secure Storage Data Source
 *
 * Use exclusively for small secrets such as session tokens. Do not use MMKV
 * or EXPO_PUBLIC_ configuration for credentials or other sensitive values.
 */

import * as SecureStore from 'expo-secure-store';

export interface ISecureStorageDataSource {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class SecureStorageDataSource implements ISecureStorageDataSource {
  public async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  }

  public async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  public async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
}

export const secureStorage = new SecureStorageDataSource();
