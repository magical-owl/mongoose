import * as LocalAuthentication from 'expo-local-authentication';

export class AppLockService {
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
