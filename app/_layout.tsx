import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppProviders } from '@/providers/AppProviders';
import { AppLockGate } from '@/shared/components/AppLockGate';
import {
  GLOBAL_KEYBOARD_DISMISS_ROOT_CLEARANCE,
  GlobalKeyboardDismissButton,
} from '@/shared/components/GlobalKeyboardDismissButton';

export default function RootLayout() {
  return (
    <AppProviders>
      <AppLockGate>
        <View style={styles.root}>
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
          <GlobalKeyboardDismissButton
            layer="root"
            bottomClearance={GLOBAL_KEYBOARD_DISMISS_ROOT_CLEARANCE}
          />
        </View>
      </AppLockGate>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
