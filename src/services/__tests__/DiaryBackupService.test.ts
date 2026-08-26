import {
  BACKUP_KEY_DERIVATION,
  deriveBackupKeyHex,
  LEGACY_BACKUP_KEY_DERIVATION,
  parseEncryptedBackupFile,
} from '../DiaryBackupService';

describe('DiaryBackupService', () => {
  it('accepts the production PBKDF2 encrypted backup envelope', () => {
    const parsed = parseEncryptedBackupFile({
      algorithm: 'AES-256-GCM',
      keyDerivation: BACKUP_KEY_DERIVATION,
      iterations: 210_000,
      salt: '000102030405060708090a0b0c0d0e0f',
      ciphertext: 'ciphertext',
    });

    expect(parsed.keyDerivation).toBe(BACKUP_KEY_DERIVATION);
    expect(parsed.iterations).toBe(210_000);
  });

  it('keeps legacy SHA-256 encrypted backup envelopes importable', () => {
    const parsed = parseEncryptedBackupFile({
      algorithm: 'AES-256-GCM',
      keyDerivation: LEGACY_BACKUP_KEY_DERIVATION,
      salt: '000102030405060708090a0b0c0d0e0f',
      ciphertext: 'ciphertext',
    });

    expect(parsed.keyDerivation).toBe(LEGACY_BACKUP_KEY_DERIVATION);
    expect(parsed.iterations).toBeUndefined();
  });

  it('rejects PBKDF2 envelopes with weak iteration counts', () => {
    expect(() => parseEncryptedBackupFile({
      algorithm: 'AES-256-GCM',
      keyDerivation: BACKUP_KEY_DERIVATION,
      iterations: 10_000,
      salt: '000102030405060708090a0b0c0d0e0f',
      ciphertext: 'ciphertext',
    })).toThrow('Invalid encrypted diary backup');
  });

  it('derives deterministic PBKDF2-HMAC-SHA256 backup keys', async () => {
    const parsed = parseEncryptedBackupFile({
      algorithm: 'AES-256-GCM',
      keyDerivation: BACKUP_KEY_DERIVATION,
      iterations: 100_000,
      salt: '000102030405060708090a0b0c0d0e0f',
      ciphertext: 'ciphertext',
    });

    await expect(deriveBackupKeyHex('correct horse battery staple', parsed))
      .resolves
      .toBe('49d49c25f597846209f0d92e7770ab64e1c75e94b4ce6c509265ee67175d2a1e');
  });
});
