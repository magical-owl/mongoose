import { useEffect, useRef, useState } from 'react';
import { AppState, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/providers/ThemeProvider';
import { useAppStore } from '@/stores/useAppStore';
import { appLockService } from '@/services/AppLockService';

export function AppLockGate({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  const theme = useTheme();
  const enabled = useAppStore((state) => state.biometricLockEnabled);
  const locked = useAppStore((state) => state.isLocked);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const hasUnlocked = useRef(false);

  useEffect(() => {
    if (enabled && !useAppStore.getState().isLocked) useAppStore.getState().setLocked(true);
    const subscription = AppState.addEventListener('change', (state) => {
      if (enabled && state !== 'active') useAppStore.getState().setLocked(true);
    });
    return () => subscription.remove();
  }, [enabled]);

  const unlock = async () => {
    setIsAuthenticating(true);
    const authenticated = await appLockService.authenticate();
    if (authenticated) hasUnlocked.current = true;
    setIsAuthenticating(false);
  };

  if (!enabled || (!locked && hasUnlocked.current)) return <>{children}</>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.icon, { color: theme.colors.text }]}>🔒</Text>
      <Text preset="h2" color="text">Diary Locked</Text>
      <Text preset="body" color="textSecondary" style={styles.subtitle}>Authenticate to access your private entries.</Text>
      <TouchableOpacity onPress={unlock} disabled={isAuthenticating} style={[styles.button, { backgroundColor: theme.colors.tint }]}>
        <Text preset="label" style={styles.buttonText}>{isAuthenticating ? 'Authenticating…' : 'Unlock Diary'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 16 },
  subtitle: { textAlign: 'center', marginTop: 8, marginBottom: 24 },
  button: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8 },
  buttonText: { color: '#fff' },
});
