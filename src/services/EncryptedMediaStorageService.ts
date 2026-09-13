import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
  getRandomBytesAsync,
} from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { secureStorageKeys } from '@/constants/secureStorageKeys';
import { secureStorage, type ISecureStorageDataSource } from '@/database/SecureStorageDataSource';

const ENCRYPTED_EXTENSION = '.enc';
const RENDER_CACHE_DIRECTORY_NAME = 'media-render-cache';

export class EncryptedMediaStorageService {
  public constructor(
    private readonly storage: ISecureStorageDataSource = secureStorage,
  ) {}

  public getEncryptedFilename(filename: string): string {
    return filename.endsWith(ENCRYPTED_EXTENSION) ? filename : `${filename}${ENCRYPTED_EXTENSION}`;
  }

  public isEncryptedUri(uri: string): boolean {
    return uri.endsWith(ENCRYPTED_EXTENSION);
  }

  public async writeEncryptedCopy(source: File, destination: File): Promise<void> {
    const key = await this.getOrCreateKey();
    const sealed = await aesEncryptAsync(await source.bytes(), key);
    destination.create({ overwrite: true });
    destination.write(await sealed.combined('base64'));
    await this.writeRenderCache(source, destination.uri);
  }

  public getRenderCacheUri(encryptedUri: string): string {
    const encryptedFile = new File(encryptedUri);
    const filename = encryptedFile.name.endsWith(ENCRYPTED_EXTENSION)
      ? encryptedFile.name.slice(0, -ENCRYPTED_EXTENSION.length)
      : encryptedFile.name;
    return new File(this.getRenderCacheDirectory(), filename).uri;
  }

  public async ensureRenderCache(encryptedUri: string): Promise<string> {
    if (!this.isEncryptedUri(encryptedUri)) return encryptedUri;

    const renderFile = new File(this.getRenderCacheUri(encryptedUri));
    if (renderFile.exists) return renderFile.uri;

    const encryptedFile = new File(encryptedUri);
    if (!encryptedFile.exists) return renderFile.uri;

    const key = await this.getOrCreateKey();
    const sealed = AESSealedData.fromCombined(await encryptedFile.text());
    const decrypted = await aesDecryptAsync(sealed, key);
    this.getRenderCacheDirectory().create({ idempotent: true, intermediates: true });
    renderFile.create({ overwrite: true });
    renderFile.write(decrypted);
    return renderFile.uri;
  }

  public async deleteEncryptedMedia(uri: string): Promise<void> {
    const encryptedFile = new File(uri);
    if (encryptedFile.exists) encryptedFile.delete();

    if (!this.isEncryptedUri(uri)) return;
    const renderFile = new File(this.getRenderCacheUri(uri));
    if (renderFile.exists) renderFile.delete();
  }

  public clearRenderCache(): void {
    const directory = this.getRenderCacheDirectory();
    if (directory.exists) directory.delete();
  }

  private async writeRenderCache(source: File, encryptedUri: string): Promise<void> {
    this.getRenderCacheDirectory().create({ idempotent: true, intermediates: true });
    await source.copy(new File(this.getRenderCacheUri(encryptedUri)), { overwrite: true });
  }

  private getRenderCacheDirectory(): Directory {
    return new Directory(Paths.cache, RENDER_CACHE_DIRECTORY_NAME);
  }

  private async getOrCreateKey(): Promise<AESEncryptionKey> {
    const stored = await this.storage.getItem(secureStorageKeys.mediaEncryptionKey);
    if (stored) return AESEncryptionKey.import(stored, 'hex');

    const keyHex = bytesToHex(await getRandomBytesAsync(32));
    await this.storage.setItem(secureStorageKeys.mediaEncryptionKey, keyHex);
    return AESEncryptionKey.import(keyHex, 'hex');
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const encryptedMediaStorageService = new EncryptedMediaStorageService();
