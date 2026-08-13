import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// https://docs.expo.dev/router/reference/exports/#exporoot
export function App() {
  // @ts-expect-error require.context is provided by Metro bundler at runtime
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);