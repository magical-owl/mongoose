import type { ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import { AppLockService, isValidPasscode, parseStoredPasscodeRecord } from '../AppLockService';
import { digestStringAsync } from 'expo-crypto';

jest.mock('expo-local-authentication', () => ({
  authenticateAsync: jest.fn(async () => ({ success: true })),
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
}));

const mockDigestStringAsync = jest.mocked(digestStringAsync);

function createStorage() {
  const values = new Map<string, string>();
  const storage: ISecureStorageDataSource = {
    getItem: jest.fn(async (key) => values.get(key) ?? null),
    setItem: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key) => {
      values.delete(key);
    }),
  };
  return { storage, values };
}

describe('AppLockService passcode', () => {
  beforeEach(() => {
    mockDigestStringAsync.mockImplementation(async (_algorithm, value) => (
      value.includes(':1234') ? '1'.repeat(64) : '2'.repeat(64)
    ));
  });

  it('validates four digit passcodes only', () => {
    expect(isValidPasscode('1234')).toBe(true);
    expect(isValidPasscode('123')).toBe(false);
    expect(isValidPasscode('12345')).toBe(false);
    expect(isValidPasscode('12a4')).toBe(false);
  });

  it('stores a salted passcode hash instead of the raw passcode', async () => {
    const { storage, values } = createStorage();
    const service = new AppLockService(storage);

    await expect(service.setPasscode('1234')).resolves.toBe(true);

    const stored = values.get(secureStorageKeys.appLockPasscode);
    expect(stored).toBeTruthy();
    expect(stored).not.toContain('1234');
    expect(parseStoredPasscodeRecord(stored ?? null)).toMatchObject({
      version: 1,
      salt: '01010101010101010101010101010101',
    });
  });

  it('verifies matching passcodes and rejects mismatches', async () => {
    const { storage } = createStorage();
    const service = new AppLockService(storage);

    await service.setPasscode('1234');

    await expect(service.verifyPasscode('1234')).resolves.toBe(true);
    await expect(service.verifyPasscode('4321')).resolves.toBe(false);
  });

  it('rejects missing or malformed passcode records', async () => {
    const { storage, values } = createStorage();
    const service = new AppLockService(storage);

    await expect(service.verifyPasscode('1234')).resolves.toBe(false);

    values.set(secureStorageKeys.appLockPasscode, '{bad-json');

    await expect(service.verifyPasscode('1234')).resolves.toBe(false);
  });

  it('clears the stored passcode', async () => {
    const { storage } = createStorage();
    const service = new AppLockService(storage);

    await service.setPasscode('1234');
    await expect(service.hasPasscode()).resolves.toBe(true);

    await service.clearPasscode();

    await expect(service.hasPasscode()).resolves.toBe(false);
  });
});
