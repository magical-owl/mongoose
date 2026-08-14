/** Keys owned by application features in Expo SecureStore. */
export const secureStorageKeys = {
  currentProfile: 'meadow.current-profile',
  diaryEntries: 'meadow.diary-entries',
} as const;

export const managedSecureStorageKeys = Object.values(secureStorageKeys);
