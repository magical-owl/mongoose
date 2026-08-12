/** Keys owned by application features in Expo SecureStore. */
export const secureStorageKeys = {
  currentProfile: 'meadow.current-profile',
} as const;

export const managedSecureStorageKeys = Object.values(secureStorageKeys);
