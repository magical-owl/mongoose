import * as LocalAuthentication from 'expo-local-authentication';
import { CryptoDigestAlgorithm, CryptoEncoding, digestStringAsync, getRandomBytesAsync } from 'expo-crypto';
import { secureStorage, type ISecureStorageDataSource } from '@/database/SecureStorageDataSource';
import { secureStorageKeys } from '@/constants/secureStorageKeys';

const PASSCODE_LENGTH = 4;

interface StoredPasscodeRecord {
  readonly version: 1;
  readonly salt: string;
  readonly hash: string;
  readonly createdAt: string;
}

export class AppLockService {
  public constructor(
    private readonly storage: ISecureStorageDataSource = secureStorage,
  ) {}

  public async canUseBiometrics(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  public async enable(): Promise<boolean> {
    if (!(await this.canUseBiometrics())) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to protect your diary',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    if (!result.success) return false;
    return true;
  }

  public async setPasscode(passcode: string): Promise<boolean> {
    if (!isValidPasscode(passcode)) return false;
    const salt = bytesToHex(await getRandomBytesAsync(16));
    const record: StoredPasscodeRecord = {
      version: 1,
      salt,
      hash: await hashPasscode(passcode, salt),
      createdAt: new Date().toISOString(),
    };
    await this.storage.setItem(secureStorageKeys.appLockPasscode, JSON.stringify(record));
    return true;
  }

  public async hasPasscode(): Promise<boolean> {
    return Boolean(await this.storage.getItem(secureStorageKeys.appLockPasscode));
  }

  public async verifyPasscode(passcode: string): Promise<boolean> {
    if (!isValidPasscode(passcode)) return false;
    const record = parseStoredPasscodeRecord(await this.storage.getItem(secureStorageKeys.appLockPasscode));
    if (!record) return false;
    const hash = await hashPasscode(passcode, record.salt);
    return hash === record.hash;
  }

  public async clearPasscode(): Promise<void> {
    await this.storage.removeItem(secureStorageKeys.appLockPasscode);
  }

  public async authenticate(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your diary',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  }
}

export const appLockService = new AppLockService();

export function isValidPasscode(passcode: string): boolean {
  return new RegExp(`^\\d{${PASSCODE_LENGTH}}$`).test(passcode);
}

export function parseStoredPasscodeRecord(value: string | null): StoredPasscodeRecord | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)
      || parsed.version !== 1
      || typeof parsed.salt !== 'string'
      || typeof parsed.hash !== 'string'
      || typeof parsed.createdAt !== 'string'
      || !/^[a-f0-9]{32}$/i.test(parsed.salt)
      || !/^[a-f0-9]{64}$/i.test(parsed.hash)
    ) return null;
    return {
      version: 1,
      salt: parsed.salt,
      hash: parsed.hash,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

async function hashPasscode(passcode: string, salt: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, `${salt}:${passcode}`, {
    encoding: CryptoEncoding.HEX,
  });
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
