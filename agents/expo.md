# Expo — Agent Instructions

## Package Management

- **Always use `npx expo install`** instead of `npm install` or `yarn add` for installing packages. `expo install` automatically selects versions compatible with the current Expo SDK version.
- **Run `npx expo install --fix`** to resolve version conflicts when packages are incompatible with the current SDK.
- **Use `npx expo check`** to validate that all installed packages are compatible with the current Expo SDK version.
- **Do not use `react-native link`** — Expo handles native module linking automatically. If a package requires manual native configuration, use a **Config Plugin** instead.
- **When in doubt about compatibility**, check the package's npm page for Expo SDK version requirements. Use `npx expo install <package>@latest` for the latest compatible version.

## app.json / app.config.js Configuration

- **Use `app.config.js` (dynamic)** instead of `app.json` (static) when configuration depends on environment variables or build-time values. Use `app.json` when all values are static.
- **Always declare the app's scheme** under `expo.scheme` for deep linking support. Use an environment-specific scheme if running multiple environments on the same device.
- **Configure app icons** under `expo.icon` (iOS/Android fallback), `expo.ios.icon`, and `expo.android.icon`. Provide multiple resolutions: 48x48, 72x72, 96x96, 144x144, 192x192, 512x512 for Android; 1024x1024 for iOS.
- **Set `expo.version`** as the human-readable version (e.g., "1.2.3"). Set `expo.ios.buildNumber` and `expo.android.versionCode` for build metadata. Increment `versionCode` for every Android build.
- **Use `expo.extra`** to expose runtime configuration (API URLs, feature flags). Access via `Constants.expoConfig.extra`.
- **Configure `expo.plugins`** array for all config plugins. Order matters — plugins run in sequence.
- **Set `expo.ios.supportsTablet`** to `true` unless the app is intentionally phone-only.
- **Define permissions** in `expo.ios.infoPlist` and `expo.android.permissions` arrays, not in native project files directly.

## SDK Compatibility

- **Pin the Expo SDK version** in `package.json` (e.g., `"expo": "~52.0.0"`). Minor updates are safe; major version bumps require testing all config plugins and native modules.
- **Before upgrading the Expo SDK**, consult the upgrade guide at `https://docs.expo.dev/workflow/upgrading-expo-sdk/`. Run `npx expo install --fix` after upgrading.
- **Run `npx expo-doctor`** after any SDK upgrade to detect compatibility issues.
- **Keep `expo-updates`** configured for OTA update support. Set `expo.updates.url` to the update server endpoint and `expo.updates.enabled` appropriately per environment.

## Config Plugins

- **Use Config Plugins** (not `react-native link` or manual native project edits) for any native module configuration. This ensures native changes are reproducible and survive `expo prebuild`.
- **Write custom config plugins** in a `plugins/` directory at the project root. Follow the pattern: a function that receives a `ConfigPlugin` and returns a modified `ExpoConfig`.
- **Always test config plugins** by running `npx expo prebuild --clean` and verifying the generated native project files.
- **Use community-provided plugins** (e.g., `expo-dev-client`, `expo-build-properties`) for common configurations. List them in the `expo.plugins` array.
- **Use `expo-build-properties`** plugin for setting build-time properties like `android.compileSdkVersion`, `ios.deploymentTarget`, `android.packagingOptions`.

## Environment Variables

- **Use `EXPO_PUBLIC_*` prefix** for environment variables that should be exposed to the client. These are inlined at build time and accessible via `process.env.EXPO_PUBLIC_*`.
- **Do not use `EXPO_PUBLIC_*`** for secrets (API keys, tokens). Use the Expo server-side environment system (`eas secret:create`) and read them server-side or in `app.config.js`.
- **Use `.env` files** for local development. Use `.env.production`, `.env.staging` for per-environment config. Read them in `app.config.js` with `require('dotenv').config({ path: ... })`.
- **Validate required env vars** at build time in `app.config.js`. Throw a descriptive error if a required variable is missing.

## Platform-Specific Code

- **Use `.ios.tsx` and `.android.tsx` file extensions** for platform-specific implementations. Expo's Metro config resolves these automatically. Place shared logic in `.tsx` files and override in platform-specific files.
- **Use `Platform.OS`** from `react-native` for small inline differences. Prefer platform-specific files for larger differences.
- **Use `Platform.select()`** for value-level differences: `const padding = Platform.select({ ios: 16, android: 12 })`.
- **Do not use `expo-platform`** or other third-party platform detection packages. React Native's `Platform` API is sufficient.

## Building

- **Use `npx expo run:ios`** and **`npx expo run:android`** for development builds that include native modules. These require `expo-dev-client`.
- **Use `npx expo start`** for Expo Go development (limited to Expo SDK APIs only).
- **Use EAS Build** (`eas build`) for production builds. Configure credentials in `eas.json`.
- **Set `expo.runtimeVersion`** in `app.config.js` to control OTA update targeting. Use a hash of the app's JavaScript bundle source, or a semver string.
- **Use `expo-dev-client`** when the app uses custom native modules. Configure it with `npx expo install expo-dev-client`.
