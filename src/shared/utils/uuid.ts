/**
 * Generates an RFC4122 v4 compliant UUID string.
 */
export function generateUUID(): string {
  const globalObj = typeof globalThis !== 'undefined' ? (globalThis as unknown as { crypto?: { randomUUID?: () => string } }) : {};
  if (globalObj.crypto && typeof globalObj.crypto.randomUUID === 'function') {
    return globalObj.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
