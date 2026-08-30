import { useEffect, useRef, useState } from 'react';
import { AppState, View, StyleSheet } from 'react-native';
import { AccentPillButton } from './AccentPillButton';
import { Text } from './Text';
import { useTheme } from '@/providers/ThemeProvider';
import { useAppStore } from '@/stores/useAppStore';
import { appLockService } from '@/services/AppLockService';
import { useTranslation } from '@/localization/i18n';

export function AppLockGate({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const enabled = useAppStore((state) => state.biometricLockEnabled);
  const locked = useAppStore((state) => state.isLocked);
  const setLocked = useAppStore((state) => state.setLocked);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const hasUnlocked = useRef(false);

  useEffect(() => {
    if (enabled && !useAppStore.getState().isLocked) setLocked(true);
    const subscription = AppState.addEventListener('change', (state) => {
      if (enabled && state !== 'active') setLocked(true);
    });
    return () => subscription.remove();
  }, [enabled, setLocked]);

  const unlock = async () => {
    setIsAuthenticating(true);
    const authenticated = await appLockService.authenticate();
    if (authenticated) {
      hasUnlocked.current = true;
      setLocked(false);
    }
    setIsAuthenticating(false);
  };

  if (!enabled || (!locked && hasUnlocked.current)) return <>{children}</>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.icon, { color: theme.colors.text }]}>🔒</Text>
      <Text preset="h2" color="text">{t('lockTitle')}</Text>
      <Text preset="body" color="textSecondary" style={styles.subtitle}>{t('lockMessage')}</Text>
      <AccentPillButton
        label={isAuthenticating ? t('lockAuthenticating') : t('lockUnlockButton')}
        onPress={() => { void unlock(); }}
        disabled={isAuthenticating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 16 },
  subtitle: { textAlign: 'center', marginTop: 8, marginBottom: 24 },
});
