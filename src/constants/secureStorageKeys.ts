/** Keys owned by application features in Expo SecureStore. */
export const secureStorageKeys = {
  currentProfile: 'meadow.current-profile',
  diaryEntries: 'meadow.diary-entries',
  diaryDraft: 'meadow.diary-draft',
  backupEncryptionKey: 'meadow.backup-encryption-key',
  journalExtras: 'meadow.journal-extras',
} as const;

export const managedSecureStorageKeys = Object.values(secureStorageKeys);
