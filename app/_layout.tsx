import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/AppProviders';
import { AppLockGate } from '@/shared/components/AppLockGate';

export default function RootLayout() {
  return (
    <AppProviders>
      <AppLockGate>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '',
            }}
          />
        </Stack>
      </AppLockGate>
    </AppProviders>
  );
}
