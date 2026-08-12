# Expo SDK Configuration

## Overview

Meadow is built on the Expo SDK. This document covers versioning, build profiles, update channels, config plugins, app configuration, environment variables, and native module management.

## SDK Versioning

The project pins a specific Expo SDK version in `package.json` under `expo` and all `expo-*` dependencies.

- SDK upgrades are tracked as explicit project milestones
- A dedicated branch (`chore/expo-sdk-NNN`) is used for each upgrade
- Breaking changes between SDK versions are documented inline and linked to the relevant Expo blog posts
- `expo-env.d.ts` is regenerated after each SDK bump

Check the current SDK version:

```
npx expo config --json | jq .sdkVersion
```

## EAS Build Profiles

Build profiles are defined in `eas.json`. Each profile targets a specific environment and output type.

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "distribution": "store",
      "android": { "buildType": "app-bundle" },
      "ios": { "autoIncrement": true }
    }
  }
}
```

Key conventions:

- `development` — Local dev and debugging, runs on simulator/emulator
- `preview` — Internal testing via TestFlight / internal distribution
- `production` — App Store / Play Store submission

Environment-specific env vars are injected at build time per profile using the `env` field or EAS secrets.

## EAS Update Channels

Updates are distributed via channels mapped to EAS Update branches.

```
Channel        Branch
───────────────────────────
production     main
staging        staging
qa             qa
dev            dev
```

Each channel is configured in `eas.json` under `submit.production.channel` or passed at publish time:

```
eas update --branch main --message "chore: deploy"
```

Clients receive updates based on the channel compiled into the build binary. This is set at build time, not runtime.

## Config Plugins

Custom native behavior is added via config plugins in `app.json` or `app.config.ts`.

```ts
import { withInfoPlist } from "expo/config-plugins"

export default function withMyPlugin(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.NSCustomKey = true
    return config
  })
}
```

All custom plugins live in `plugins/` and are registered in `app.config.ts` under the `plugins` array.

Plugins are preferred over bare `app.json` fields when the configuration requires logic, environment awareness, or native code generation.

## app.json / app.config.ts

### Runtime environment values

JavaScript runtime configuration uses statically referenced `EXPO_PUBLIC_*`
variables. They are client-visible and must contain only non-secret values.
Copy `.env.example` for local development. Staging and production require
`EXPO_PUBLIC_API_BASE_URL` with an HTTPS URL.

Configuration is defined in `app.config.ts` (not static JSON) to support environment variables and conditional logic.

```ts
export default ({ config }) => ({
  ...config,
  name: "Meadow",
  slug: "meadow",
  version: "1.0.0",
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  },
})
```

Sensitive or environment-specific values are not hardcoded. They are referenced via `process.env` variables or loaded from `.env` files.

The `extra` key provides runtime access via `Constants.expoConfig.extra`.

## Environment Variables

Environment variables use the `EXPO_PUBLIC_` prefix for client-exposed values.

```
EXPO_PUBLIC_API_URL=https://api.meadow.dev
EXPO_PUBLIC_SENTRY_DSN=...
```

- Variables without the prefix are only available in `app.config.ts` (build-time only)
- `.env`, `.env.production`, `.env.staging` files are git-ignored
- A `.env.example` file documents all expected variables with placeholder values

Runtime access:

```ts
import Constants from "expo-constants"
const apiUrl = Constants.expoConfig.extra.apiUrl
```

## Native Modules

Native modules that require bare workflow are avoided when an Expo-compatible alternative exists.

When a bare native module is unavoidable:

1. The module is added to `app.config.ts` via a config plugin or the `expo-build-properties` plugin
2. Any native code changes are documented in a `ios/` or `android/` patch file
3. `expo prebuild --clean` is run to regenerate native project files
4. The changes are verified on both platforms before commit

The `expo-build-properties` plugin manages most Gradle/Podfile settings without ejecting.
