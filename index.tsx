import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// https://docs.expo.dev/router/reference/exports/#exporoot
export function App() {
  // require.context is injected by Metro bundler at runtime for Expo Router
  const ctx = (require as { context: (path: string) => any }).context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);