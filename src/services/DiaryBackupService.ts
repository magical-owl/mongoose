import { AESEncryptionKey, AESSealedData, CryptoDigestAlgorithm, CryptoEncoding, aesDecryptAsync, aesEncryptAsync, digestStringAsync, getRandomBytesAsync } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import forge from 'node-forge';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import type { Profile } from '@/features/profile/domain/Profile';
import { JournalExtrasSchema, type JournalExtras } from '@/features/journal/domain/JournalExtras';
import { CURRENT_DIARY_SCHEMA_VERSION, migrateDiaryStorage } from '@/features/diary/domain/DiaryMigrations';
import { APP_IDENTITY } from '@/config/appIdentity';

export const BACKUP_KEY_DERIVATION = 'PBKDF2-HMAC-SHA256';
export const LEGACY_BACKUP_KEY_DERIVATION = 'SHA-256(password + salt)';
export const BACKUP_KDF_ITERATIONS = 210_000;
const BACKUP_KEY_BYTE_LENGTH = 32;

export interface BackupPayload {
  readonly version: number;
  readonly exportedAt: string;
  readonly entries: DiaryEntry[];
  readonly profile?: Profile | null;
  readonly journalExtras?: JournalExtras;
}

type BackupKeyDerivation = typeof BACKUP_KEY_DERIVATION | typeof LEGACY_BACKUP_KEY_DERIVATION;

export interface EncryptedBackupFile {
  readonly algorithm: 'AES-256-GCM';
  readonly keyDerivation: BackupKeyDerivation;
  readonly iterations?: number;
  readonly salt: string;
  readonly ciphertext: string;
}

export class DiaryBackupService {
  public async exportJson(entries: DiaryEntry[], profile?: Profile | null, journalExtras?: JournalExtras): Promise<string> {
    const payload = this.createPayload(entries, profile, journalExtras);
    const file = new File(Paths.cache, `${APP_IDENTITY.exportFilePrefix}-diary-${Date.now()}.json`);
    file.create({ overwrite: true });
    file.write(JSON.stringify(payload, null, 2));
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
    return file.uri;
  }

  public async exportEncrypted(password: string, entries: DiaryEntry[], profile?: Profile | null, journalExtras?: JournalExtras): Promise<string> {
    assertPassword(password);
    const payload = this.createPayload(entries, profile, journalExtras);
    const salt = bytesToHex(await getRandomBytesAsync(16));
    const key = await this.getKey(password, {
      algorithm: 'AES-256-GCM',
      keyDerivation: BACKUP_KEY_DERIVATION,
      iterations: BACKUP_KDF_ITERATIONS,
      salt,
      ciphertext: '',
    });
    const plaintext = toBase64(JSON.stringify(payload));
    const sealed = await aesEncryptAsync(plaintext, key);
    const file = new File(Paths.cache, `${APP_IDENTITY.exportFilePrefix}-diary-${Date.now()}.mbackup`);
    file.create({ overwrite: true });
    file.write(JSON.stringify({
      algorithm: 'AES-256-GCM',
      keyDerivation: BACKUP_KEY_DERIVATION,
      iterations: BACKUP_KDF_ITERATIONS,
      salt,
      ciphertext: await sealed.combined('base64'),
    }));
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/octet-stream' });
    return file.uri;
  }

  public async importEncrypted(password: string): Promise<BackupPayload | null> {
    assertPassword(password);
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/octet-stream', copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return null;
    const file = new File(result.assets[0].uri);
    const parsed: unknown = JSON.parse(await file.text());
    const encryptedBackup = parseEncryptedBackupFile(parsed);
    const key = await this.getKey(password, encryptedBackup);
    const sealed = AESSealedData.fromCombined(encryptedBackup.ciphertext);
    const decrypted = await aesDecryptAsync(sealed, key, { output: 'base64' });
    const payload: unknown = JSON.parse(fromBase64(String(decrypted)));
    const migrated = migrateDiaryStorage(payload);
    return {
      version: migrated.version,
      exportedAt: isRecord(payload) && typeof payload.exportedAt === 'string' ? payload.exportedAt : new Date().toISOString(),
      entries: migrated.entries,
      profile: isRecord(payload) && isProfile(payload.profile) ? payload.profile : null,
      journalExtras: isRecord(payload) && payload.journalExtras ? JournalExtrasSchema.parse(payload.journalExtras) : undefined,
    };
  }

  private createPayload(entries: DiaryEntry[], profile?: Profile | null, journalExtras?: JournalExtras): BackupPayload {
    return { version: CURRENT_DIARY_SCHEMA_VERSION, exportedAt: new Date().toISOString(), entries, profile, journalExtras };
  }

  private async getKey(password: string, encryptedBackup: EncryptedBackupFile): Promise<AESEncryptionKey> {
    const digest = await deriveBackupKeyHex(password, encryptedBackup);
    return AESEncryptionKey.import(digest, 'hex');
  }
}

function assertPassword(password: string): void {
  if (password.trim().length < 12) throw new Error('Backup password must be at least 12 characters.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseEncryptedBackupFile(value: unknown): EncryptedBackupFile {
  if (!isRecord(value)
    || value.algorithm !== 'AES-256-GCM'
    || (value.keyDerivation !== BACKUP_KEY_DERIVATION && value.keyDerivation !== LEGACY_BACKUP_KEY_DERIVATION)
    || typeof value.ciphertext !== 'string'
    || typeof value.salt !== 'string'
    || !/^[a-f0-9]{32}$/i.test(value.salt)
  ) {
    throw new Error('Invalid encrypted diary backup');
  }

  if (value.keyDerivation === BACKUP_KEY_DERIVATION) {
    const iterations = value.iterations;
    if (typeof iterations !== 'number' || !Number.isInteger(iterations) || iterations < 100_000) {
      throw new Error('Invalid encrypted diary backup');
    }
    return {
      algorithm: value.algorithm,
      keyDerivation: value.keyDerivation,
      iterations,
      salt: value.salt,
      ciphertext: value.ciphertext,
    };
  }

  return {
    algorithm: value.algorithm,
    keyDerivation: value.keyDerivation,
    salt: value.salt,
    ciphertext: value.ciphertext,
  };
}

export async function deriveBackupKeyHex(password: string, encryptedBackup: EncryptedBackupFile): Promise<string> {
  if (encryptedBackup.keyDerivation === LEGACY_BACKUP_KEY_DERIVATION) {
    return digestStringAsync(CryptoDigestAlgorithm.SHA256, `${password}:${encryptedBackup.salt}`, { encoding: CryptoEncoding.HEX });
  }

  const iterations = encryptedBackup.iterations ?? BACKUP_KDF_ITERATIONS;
  const derivedBytes = forge.pkcs5.pbkdf2(
    password,
    forge.util.hexToBytes(encryptedBackup.salt),
    iterations,
    BACKUP_KEY_BYTE_LENGTH,
    forge.md.sha256.create()
  );
  return forge.util.bytesToHex(derivedBytes);
}

function isProfile(value: unknown): value is Profile {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.displayName === 'string'
    && (value.email === undefined || typeof value.email === 'string')
    && (value.bio === undefined || typeof value.bio === 'string')
    && (value.avatarUri === undefined || typeof value.avatarUri === 'string')
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string';
}

function toBase64(value: string): string {
  const encoded = encodeURIComponent(value);
  const bytes: number[] = [];
  for (let index = 0; index < encoded.length; index += 1) {
    if (encoded[index] === '%') {
      bytes.push(Number.parseInt(encoded.slice(index + 1, index + 3), 16));
      index += 2;
    } else {
      bytes.push(encoded.charCodeAt(index));
    }
  }
  return encodeBase64(bytes);
}

function fromBase64(value: string): string {
  const bytes = decodeBase64(value);
  let encoded = '';
  bytes.forEach((byte) => { encoded += `%${byte.toString(16).padStart(2, '0')}`; });
  return decodeURIComponent(encoded);
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function encodeBase64(bytes: number[]): string {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    output += BASE64_ALPHABET[first >> 2];
    output += BASE64_ALPHABET[((first & 3) << 4) | ((second ?? 0) >> 4)];
    output += second === undefined ? '=' : BASE64_ALPHABET[((second & 15) << 2) | ((third ?? 0) >> 6)];
    output += third === undefined ? '=' : BASE64_ALPHABET[third & 63];
  }
  return output;
}

function decodeBase64(value: string): number[] {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 4) {
    const first = BASE64_ALPHABET.indexOf(value[index] ?? 'A');
    const second = BASE64_ALPHABET.indexOf(value[index + 1] ?? 'A');
    const thirdChar = value[index + 2] ?? '=';
    const fourthChar = value[index + 3] ?? '=';
    const third = thirdChar === '=' ? 0 : BASE64_ALPHABET.indexOf(thirdChar);
    const fourth = fourthChar === '=' ? 0 : BASE64_ALPHABET.indexOf(fourthChar);
    bytes.push((first << 2) | (second >> 4));
    if (thirdChar !== '=') bytes.push(((second & 15) << 4) | (third >> 2));
    if (fourthChar !== '=') bytes.push(((third & 3) << 6) | fourth);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const diaryBackupService = new DiaryBackupService();
