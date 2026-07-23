# Deployment Guide

## EAS Build Profiles

This project uses Expo Application Services (EAS) Build with three profiles:

### Development Profile

Builds a development client with debugging tools.

```bash
eas build --platform all --profile development
```

Configuration in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true,
        "resourceClass": "m1-medium"
      },
      "android": {
        "buildType": "apk",
        "resourceClass": "medium"
      }
    }
  }
}
```

- Used for daily development and local testing.
- Includes Metro bundler dev tools.
- Distributed via internal channels (not TestFlight or Play Console).

### Preview Profile

Builds a standalone binary for QA and stakeholder review.

```bash
eas build --platform all --profile preview
```

Configuration in `eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      },
      "android": {
        "buildType": "apk",
        "resourceClass": "medium"
      },
      "env": {
        "APP_ENV": "staging"
      }
    }
  }
}
```

- Uses staging environment variables.
- Distributed via EAS Submit to TestFlight (internal) and Firebase App Distribution (Android).
- Enables pre-release feature flags.

### Production Profile

Builds the production binary for App Store and Play Store submission.

```bash
eas build --platform all --profile production
```

Configuration in `eas.json`:

```json
{
  "build": {
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m1-medium",
        "autoIncrement": true
      },
      "android": {
        "resourceClass": "medium",
        "autoIncrement": true
      },
      "env": {
        "APP_ENV": "production"
      }
    }
  }
}
```

- Uses production environment variables.
- Binary is signed with distribution certificates.
- Submitted directly to app stores via EAS Submit.

## EAS Update (OTA Updates)

Expo's over-the-air update system allows pushing JavaScript and asset updates without rebuilding the native binary.

### Channels

| Channel | Target | Update Strategy |
|---------|--------|-----------------|
| `production` | All production users | Roll out gradually with `--rollout` flag |
| `staging` | Internal testers | Immediate |
| `development` | Development team | Immediate |

### Creating an Update

```bash
# Production channel with 50% rollout
eas update --branch production --message "Fix checkout form validation" --rollout 0.5

# Staging channel (immediate)
eas update --branch staging --message "New payment flow iteration"

# Development channel (immediate)
eas update --branch development --message "WIP: dark mode toggle"
```

### Rollout Strategy

- Start at 10% rollout on production.
- Monitor crash reports and error metrics for 24 hours.
- Increment to 50%, then 100% if no issues detected.
- Use `--rollout 1` for full release after validation.

### Rollback

```bash
# Rollback to a specific update group
eas update --branch production --rollback --group <group-id>

# Republish a previous update
eas update:republish --branch production --group <group-id>
```

## TestFlight Distribution

### Prerequisites

1. Apple Developer Program membership ($99/year).
2. App Store Connect record created (App ID, bundle identifier).
3. Distribution certificate and provisioning profile configured in EAS credentials.

### Submit to TestFlight

```bash
# Build and submit in one step
eas build --platform ios --profile preview --auto-submit

# Or submit a previously built artifact
eas submit --platform ios --profile preview
```

### Internal Testing

- Add up to 100 internal testers (Apple Developer account members).
- No Beta App Review required.
- Builds available within minutes of processing.

### External Testing

- Submit for Beta App Review.
- Supports up to 10,000 external testers.
- Requires export compliance documentation.
- Review typically takes 1-2 business days.

## Production App Store / Play Store Submission

### App Store Submission

```bash
# Build production binary
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

#### Pre-submission Checklist

- [ ] Screenshots for all required device sizes (6.7", 6.5", 5.5" iPhones; 12.9" iPad).
- [ ] App description, keywords, and support URL.
- [ ] Privacy policy URL.
- [ ] Export compliance documentation.
- [ ] TestFlight internal testing completed with no critical issues.
- [ ] App Store Connect pricing and availability configured.
- [ ] App Review information (demo account, contact details).

#### App Review Guidelines

- Prepare a demo account and credentials for the reviewer.
- If reviewer-required features are behind a login, provide clear instructions.
- Ensure all content complies with Apple's Human Interface Guidelines.
- Disable or remove any hidden features, debug menus, or hardcoded API endpoints.

### Play Store Submission

```bash
# Build production AAB
eas build --platform android --profile production

# Submit to Play Console
eas submit --platform android --profile production
```

#### Pre-submission Checklist

- [ ] Feature graphic and store listing images.
- [ ] App description, short description, and promo text.
- [ ] Privacy policy URL.
- [ ] Content rating questionnaire completed.
- [ ] App pricing and distribution countries configured.
- [ ] In-app products and subscriptions configured (if any).
- [ ] Production keystore securely stored.

## Environment-Specific Builds

### Environment Configuration

Environment variables are managed via `.env` files and validated at build time.

| File | Purpose |
|------|---------|
| `.env.development` | Local development defaults |
| `.env.staging` | Staging/preview environment |
| `.env.production` | Production environment |

### Build-time Variables

Set in `eas.json` under the profile's `env` key:

```json
{
  "build": {
    "production": {
      "env": {
        "APP_ENV": "production",
        "API_URL": "https://api.meadowapp.com",
        "SENTRY_DSN": "https://...@o123456.ingest.sentry.io/123456"
      }
    }
  }
}
```

### Runtime Variables

Sensitive values are loaded from `expo-constants` at runtime and never committed:

```typescript
// src/config/env.ts
import Constants from 'expo-constants';

export const ENV = {
  appEnv: Constants.expoConfig?.extra?.appEnv ?? 'development',
  apiUrl: Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000',
};
```

## Versioning Strategy

### Semantic Versioning

We follow a modified semver: `MAJOR.MINOR.PATCH+BUILD`

| Component | Description | Increment When |
|-----------|-------------|----------------|
| MAJOR | Breaking changes | UI redesign, breaking API changes, significant feature removals |
| MINOR | Feature releases | New features, non-breaking API additions, significant improvements |
| PATCH | Bug fixes | Bug fixes, performance improvements, minor UI tweaks |
| BUILD | Auto-incremented | Each EAS Build (uses EAS auto-increment) |

### Version Configuration

Set in `app.json` or `app.config.ts`:

```typescript
// app.config.ts
export default {
  expo: {
    version: '1.2.3',
    ios: {
      buildNumber: '123',  // Auto-incremented by EAS
    },
    android: {
      versionCode: 123,     // Auto-incremented by EAS
    },
  },
};
```

### Branching Strategy

| Branch | Version | OTA Channel | Build Profile |
|--------|---------|-------------|---------------|
| `main` | Next release candidate | `staging` | `preview` |
| `production` | Current release | `production` | `production` |
| `release/X.Y.Z` | Specific release | `production` | `production` |

### Release Cadence

| Build Type | Cadence | Version Bump |
|------------|---------|--------------|
| Hotfix | As needed | PATCH |
| Bug fix release | Weekly/biweekly | PATCH |
| Feature release | Monthly | MINOR |
| Major release | Quarterly | MAJOR |

## EAS CLI Commands Reference

```bash
# Build
eas build --platform all --profile production
eas build --platform ios --profile preview
eas build --platform android --profile development

# Submit
eas submit --platform ios --profile production
eas submit --platform android --profile production

# Update
eas update --branch production --message "Release notes"
eas update:republish --branch production --group <group-id>

# Credentials
eas credentials --platform ios
eas credentials --platform android

# Devices
eas device:create
eas device:list

# Diagnostics
eas diagnostics
```
