import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

interface MetroRequireContext {
  readonly keys: () => string[];
  readonly resolve: (id: string) => string;
  readonly id: string;
  (id: string): unknown;
}

interface MetroRequire {
  readonly context: (path: string) => MetroRequireContext;
}

// https://docs.expo.dev/router/reference/exports/#exporoot
export function App() {
  // require.context is injected by Metro bundler at runtime for Expo Router
  const ctx = (require as unknown as MetroRequire).context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
