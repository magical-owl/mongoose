# Meadow Engineering Playbook

> **Version:** 1.0.0
> **Last Updated:** 2025-01-08
> **Owner:** Platform Engineering Team

---

## Table of Contents

1. [Development Workflow](#1-development-workflow)
2. [Code Review Checklist](#2-code-review-checklist)
3. [Architecture Decision Records (ADR)](#3-architecture-decision-records-adr)
4. [Release Process](#4-release-process)
5. [Environment Configuration](#5-environment-configuration)
6. [Debugging and Troubleshooting](#6-debugging-and-troubleshooting)
7. [Performance Monitoring](#7-performance-monitoring)
8. [Security Review Process](#8-security-review-process)
9. [Dependency Management](#9-dependency-management)
10. [Onboarding Guide](#10-onboarding-guide)

---

## 1. Development Workflow

### 1.1 Branch Strategy

We follow **GitFlow** with adaptations for continuous delivery.

| Branch Type | Naming Convention | Source | Merge Target | Lifetime |
|---|---|---|---|---|
| `main` | `main` | — | — | Permanent |
| `develop` | `develop` | — | `main` | Permanent |
| Feature | `feature/<issue-number>-<short-description>` | `develop` | `develop` | Ephemeral |
| Bugfix | `bugfix/<issue-number>-<short-description>` | `develop` | `develop` | Ephemeral |
| Hotfix | `hotfix/<issue-number>-<short-description>` | `main` | `main` + `develop` | Ephemeral |
| Release | `release/<version>` | `develop` | `main` + `develop` | Ephemeral |
| Experiment | `experiment/<short-description>` | `develop` | Discarded or `develop` | Ephemeral |

**Rules:**

- Never commit directly to `main` or `develop`.
- Feature branches should be short-lived (ideally < 3 days).
- Always rebase feature branches onto the latest `develop` before opening a PR.
- Delete the remote branch after merging.

### 1.2 Commit Message Convention

We enforce **Conventional Commits** (v1.0.0).

```
<type>(<scope>): <short-description>

<body>

<footer>
```

**Types:**

| Type | Usage |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `chore` | Maintenance, tooling, config changes |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code restructuring (no feature/fix) |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `ci` | CI/CD pipeline changes |
| `build` | Build system or dependency changes |
| `revert` | Reverting a previous commit |

**Scope Examples:** `api`, `ui`, `auth`, `notifications`, `database`, `ci`, `config`, `docs`

**Examples:**

```
feat(auth): add biometric login support

Implements Face ID and fingerprint authentication for the login flow.
Closes #142
```

```
fix(api): handle network timeout on token refresh

The token refresh endpoint was not catching connection timeouts,
causing unhandled promise rejections on slow networks.

Fixes #189
```

```
chore(deps): upgrade expo SDK from 50 to 51
```

### 1.3 Pull Request Process

#### PR Lifecycle

1. **Create a Draft PR** as early as possible to signal work-in-progress.
2. **Move to Ready for Review** when all the following are true:
   - Code compiles and lint passes (`npm run lint && npm run typecheck`).
   - All existing tests pass (`npm run test`).
   - New tests cover the changes (unit + integration as appropriate).
   - PR description follows the template (see below).
   - Screenshots or video recordings are attached for UI changes.
3. **Request reviewers** from the CODEOWNERS file.
4. **Address all feedback** with fixup commits — do *not* squash until merge.
5. **Merge** using the **Squash and Merge** strategy. The squashed commit message must follow the Conventional Commits standard.

#### PR Template

```markdown
## Description

<!-- Briefly describe what this PR does and why. -->

Closes #<issue-number>

## Type of Change

- [ ] feat (new feature)
- [ ] fix (bug fix)
- [ ] refactor (no functional change)
- [ ] chore (maintenance)
- [ ] docs (documentation)
- [ ] test (testing)
- [ ] perf (performance)

## How Has This Been Tested?

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing on iOS
- [ ] Manual testing on Android
- [ ] Manual testing on Web

## Screenshots / Recordings

<!-- If applicable. -->

## Checklist Before Requesting Review

- [ ] My code follows the project style guidelines.
- [ ] I have performed a self-review of my own code.
- [ ] I have commented complex or non-obvious code.
- [ ] I have updated the documentation accordingly.
- [ ] My changes generate no new warnings or lint errors.
- [ ] New and existing unit tests pass locally.
- [ ] Any dependent changes have been merged.

## Additional Context

<!-- Any other information reviewers should know. -->
```

#### Merge Requirements

| Requirement | Description |
|---|---|
| ✅ Approvals | At least **2** for feature PRs, **1** for bugfix PRs |
| ✅ CI Pipeline | All checks must pass (Lint, Typecheck, Test, Build) |
| ✅ No Merge Conflicts | Branch must be up to date with `develop` |
| ✅ Conventional Commit | Squashed commit message must be valid |
| ✅ Label Applied | One of: `feature`, `bugfix`, `hotfix`, `release`, `chore` |

---

## 2. Code Review Checklist

### 2.1 General

- [ ] Does the code solve the problem described in the issue?
- [ ] Is the code easy to understand and maintain?
- [ ] Are there any edge cases not handled?
- [ ] Does the PR include tests for the new logic?
- [ ] Do the existing tests still pass?
- [ ] Are there any hardcoded values that should be configurable?
- [ ] Are error states handled gracefully?
- [ ] Is there any commented-out code or debugging artifacts leftover?

### 2.2 Architecture & Design

- [ ] Does the change follow the project's established architecture patterns?
- [ ] Are concerns properly separated (UI, business logic, data access)?
- [ ] Does the change introduce unnecessary coupling?
- [ ] Is the change backward-compatible? If not, is a migration plan documented?
- [ ] Are platform-specific files appropriately used (`.ios.ts`, `.android.ts`, `.web.ts`)?
- [ ] Is the code location consistent with the existing folder structure?

### 2.3 TypeScript & Types

- [ ] Are all function parameters and return types explicitly typed?
- [ ] Are there any `any` types that could be replaced with proper types?
- [ ] Are generics used appropriately?
- [ ] Are discriminated unions or branded types used where they add safety?
- [ ] Are `as` casts justified or avoidable?
- [ ] Are `!` non-null assertions justified?
- [ ] Is `eslint-disable` or `ts-expect-error` accompanied by a comment explaining why?

### 2.4 React / Expo Specific

- [ ] Are hooks used correctly (rules of hooks, dependency arrays)?
- [ ] Are expensive computations memoized with `useMemo` or `useCallback`?
- [ ] Are list items properly keyed?
- [ ] Are effects clean (no missing dependencies, cleanup functions for subscriptions)?
- [ ] Are React Native performance best practices followed (`FlatList` over `ScrollView` for long lists, `Image` optimizations)?
- [ ] Are Expo APIs used correctly with appropriate permissions handling?
- [ ] Are platform-specific features properly guarded (e.g., using `Platform.OS` checks)?

### 2.5 State Management

- [ ] Is the state placed at the correct level (no prop drilling, no over-centralization)?
- [ ] Are side effects handled in a predictable way (e.g., Zustand actions, TanStack Query mutations)?
- [ ] Is asynchronous logic properly handled (loading states, error boundaries, race conditions)?

### 2.6 Styling & UI

- [ ] Does the UI respect the design system tokens (spacing, colors, typography)?
- [ ] Are styles consistent across platforms (iOS, Android, Web)?
- [ ] Are accessibility attributes set (`accessibilityLabel`, `accessibilityRole`, etc.)?
- [ ] Does the UI handle dynamic type / font scaling?
- [ ] Are dark mode and light mode both accounted for?

### 2.7 Testing

- [ ] Are unit tests written for critical business logic?
- [ ] Do component tests cover key user interactions?
- [ ] Are API mocks accurate and maintained?
- [ ] Are there integration tests for critical flows (auth, checkout, etc.)?
- [ ] Do tests avoid testing implementation details (prefer testing behavior)?

### 2.8 Performance

- [ ] Are large lists rendered using `FlatList` / `SectionList` with proper `getItemLayout`?
- [ ] Are images properly sized, cached, and lazy-loaded?
- [ ] Are there any unnecessary re-renders?
- [ ] Are heavy computations offloaded to workers or deferred where appropriate?
- [ ] Are navigation screens lazy-loaded?

### 2.9 Security

- [ ] Are secrets and tokens never hardcoded or committed?
- [ ] Is user input properly validated and sanitized?
- [ ] Are deep links validated against allow-lists?
- [ ] Are authentication tokens stored securely (SecureStore / Keychain)?
- [ ] Are HTTPS-only connections enforced?
- [ ] Are third-party SDKs reviewed for data-privacy compliance?

---

## 3. Architecture Decision Records (ADR)

### 3.1 Purpose

ADRs capture important architectural decisions and their context, consequences, and rationale. They serve as the historical record for why the system is built the way it is.

### 3.2 When to Write an ADR

An ADR is required when:

- Introducing a new major dependency or library.
- Changing the project's architecture or folder structure.
- Deciding between competing implementation approaches.
- Adding a new integration (external API, service, SDK).
- Changing the database schema or storage layer.
- Modifying the build or deployment pipeline.
- Adopting or deprecating a design pattern.

### 3.3 ADR Format

Each ADR is a Markdown file stored in `docs/adr/` with the naming convention `NNNN-title-with-hyphens.md`.

```markdown
# ADR-0023: Title

## Status

[Proposed | Accepted | Deprecated | Superseded]

*Superseded by [ADR-0030](0030-new-title.md) if applicable.*

## Context

<!-- Describe the problem, constraints, and forces at play. -->

## Decision

<!-- State the decision clearly. -->

## Consequences

<!-- Positive, negative, and neutral consequences of this decision. -->

## Alternatives Considered

### Alternative 1: <Brief description>

**Pros:**
- ...

**Cons:**
- ...

### Alternative 2: <Brief description>

**Pros:**
- ...

**Cons:**
- ...

## References

- Links to relevant issues, discussions, or documents.
- Link to related ADRs.
```

### 3.4 ADR Lifecycle

1. **Proposal:** Author creates a branch `adr/NNNN-title`, writes the ADR, and opens a PR.
2. **Review:** The ADR is reviewed by at least 2 senior engineers.
3. **Decision:** The team lead or architect approves or rejects.
4. **Accepted:** Merged to `develop`; the decision is now part of the project's permanent record.
5. **Amendment:** If a decision needs to change, a *new* ADR is created superseding the old one. Do not edit accepted ADRs.

### 3.5 ADR Index

Maintain an `INDEX.md` in `docs/adr/` that lists all ADRs in chronological order:

| ADR | Title | Status | Date |
|---|---|---|---|
| 0023 | State Management with Zustand | Accepted | 2025-01-05 |
| 0022 | Expo SDK 51 Upgrade | Accepted | 2024-12-20 |
| ... | ... | ... | ... |

---

## 4. Release Process

### 4.1 Versioning

We follow **Semantic Versioning** (SemVer 2.0.0): `MAJOR.MINOR.PATCH`

| Increment | When |
|---|---|
| MAJOR | Breaking API or behavioral changes |
| MINOR | New features (backward compatible) |
| PATCH | Bug fixes (backward compatible) |

Additionally, we use pre-release tags for staging: `MAJOR.MINOR.PATCH-staging.N`.

The app version is defined in a single source of truth: `app.config.ts` (or `app.json`).

### 4.2 Changelog

A `CHANGELOG.md` is maintained at the project root following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

**Categories:**

| Category | Description |
|---|---|
| `Added` | New features |
| `Changed` | Changes in existing functionality |
| `Deprecated` | Features soon to be removed |
| `Removed` | Removed features |
| `Fixed` | Bug fixes |
| `Security` | Vulnerability fixes |

Each entry references the PR or issue number:

```
## [1.5.0] - 2025-01-08

### Added
- Biometric authentication support (#142)

### Fixed
- Token refresh timeout on slow networks (#189)

### Changed
- Upgrade Expo SDK from 50 to 51 (#176)
```

### 4.3 Release Steps

#### 4.3.1 Standard Release (Minor / Patch)

1. **Create Release Branch:** `release/<version>` from `develop`.
2. **Version Bump:** Update version in `app.config.ts` and `package.json`.
3. **Changelog:** Add the new version entry to `CHANGELOG.md`.
4. **Finalize:** Commit with message `chore(release): bump version to <version>`.
5. **Open PR:** Merge `release/<version>` into `main`.
6. **Tag:** Once merged to `main`, tag the merge commit: `git tag v<version>`.
7. **Deploy:** CI picks up the tag and executes the deployment pipeline.
8. **Back-Merge:** Merge `main` back into `develop` to keep them in sync.

#### 4.3.2 Hotfix Release

1. **Branch:** `hotfix/<issue-number>-<short-description>` from `main`.
2. **Fix:** Apply the fix and bump the PATCH version.
3. **Changelog:** Add a `Fixed` entry.
4. **PR:** Open PR into `main` with expedited review (1 approval minimum).
5. **Tag & Deploy:** Same as standard release.
6. **Back-Merge:** Merge `main` into `develop`.

#### 4.3.3 EAS Build for Stores

For mobile app store submissions, use EAS Build:

```bash
# Production build for iOS
eas build --platform ios --profile production

# Production build for Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

OTA updates via EAS Update for critical fixes between store releases:

```bash
eas update --branch production --message "fix: resolve login crash"
```

### 4.4 Release Cadence

| Type | Cadence | Review Required |
|---|---|---|
| Patch | As needed (bug fixes) | 1 engineer |
| Minor | Every 2 weeks | 2 engineers + QA |
| Major | Every 6–8 weeks | Full team review + QA cycle |

---

## 5. Environment Configuration

### 5.1 Environment Breakdown

| Environment | Purpose | API Base URL | EAS Branch | App Variant |
|---|---|---|---|---|
| `development` | Local development | `http://localhost:3000/api` | N/A (local) | `dev` |
| `staging` | Pre-production testing | `https://api.staging.meadow.app` | `staging` | `staging` |
| `production` | Live app | `https://api.meadow.app` | `production` | `release` |

### 5.2 Configuration Management

We use **Expo's built-in environment variables** with `app.config.ts` and `.env` files.

**File hierarchy (in order of precedence):**

| File | Scope | Committed? |
|---|---|---|
| `.env.local` | Local overrides (never committed) | ❌ |
| `.env.development` | Dev environment defaults | ✅ |
| `.env.staging` | Staging environment | ✅ |
| `.env.production` | Production environment | ✅ (no secrets) |
| `.env` | Default values | ✅ |

**Example `.env` files:**

```
# .env (default)
EXPO_PUBLIC_APP_NAME=Meadow
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_SENTRY_DSN=
```

```
# .env.production
EXPO_PUBLIC_APP_NAME=Meadow
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://api.meadow.app
EXPO_PUBLIC_SENTRY_DSN=https://sentry.io/...
```

**Important:** Secrets that should never leak (API keys, tokens) are stored in:

- **EAS Secrets** for CI/CD: `eas secret:push --scope project --name MY_SECRET`
- **1Password** for local development access.

### 5.3 Accessing Config in Code

```typescript
import { Constants } from 'expo-constants';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl;
```

Or via the typed config module:

```typescript
// src/config/env.ts
export const env = {
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'Meadow',
  environment: process.env.EXPO_PUBLIC_ENV ?? 'development',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
} as const;

export const isDev = env.environment === 'development';
export const isStaging = env.environment === 'staging';
export const isProd = env.environment === 'production';
```

### 5.4 Platform-Specific Build Config

Native app configuration (per environment) is defined in `app.config.ts`:

```typescript
// app.config.ts
export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME ?? 'Meadow',
  ios: {
    bundleIdentifier: `com.meadow.app.${process.env.EXPO_PUBLIC_ENV}`,
    buildNumber: '1.0.0',
  },
  android: {
    package: `com.meadow.app.${process.env.EXPO_PUBLIC_ENV}`,
    versionCode: 1,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    eas: {
      projectId: 'your-project-id',
    },
  },
});
```

### 5.5 Feature Flags

Feature flags are managed via a remote config service (e.g., Firebase Remote Config or a custom endpoint):

```typescript
// src/config/feature-flags.ts
export const featureFlags = {
  enableNewCheckout: remoteConfig.getBoolean('enable_new_checkout'),
  showOnboardingV2: remoteConfig.getBoolean('show_onboarding_v2'),
  // ...
};
```

For development, flags can be overridden via `app.config.ts` `extra.featureFlags`.

---

## 6. Debugging and Troubleshooting

### 6.1 Local Development

#### Common Scenarios

| Problem | Likely Cause | Solution |
|---|---|---|
| Metro bundler not starting | Port conflict | `npx expo start --port 8082` |
| Module not found | Missing install or cache | `npx expo install <package>` then `npx expo start -c` |
| iOS build fails | CocoaPods out of sync | `cd ios && pod deintegrate && pod install` |
| Android build fails | Gradle cache stale | `cd android && ./gradlew clean` |
| "Cannot find module" after git pull | New dependencies added | `npm ci` |
| Environment variables not loaded | Wrong `.env` file or cache | Restart Metro with `npx expo start -c` |

#### Debugging Tools

```bash
# Clear all caches
npx expo start -c

# Run with verbose Metro logging
npx expo start --verbose

# Debug React Navigation
npx expo start --logs

# Run ESLint with auto-fix
npm run lint -- --fix

# TypeScript diagnostics
npm run typecheck
```

#### React Native Debugger

1. Install [React Native Debugger](https://github.com/jhen0409/react-native-debugger).
2. In the app, shake the device to open the dev menu.
3. Select "Open JS Debugger" (Flipper) or "Debug with React Native Debugger".

#### React DevTools (for web target)

```bash
npx expo start --web
# Open React DevTools via the browser extension
```

### 6.2 Remote Debugging (Staging / Production)

- **Sentry:** All errors are logged to Sentry. Use the `Sentry.captureException` or `Sentry.captureMessage` APIs.
- **Console logs:** Console output from staging builds can be viewed via **LogCat** (Android) or **Console.app** (iOS) for physical device testing.
- **Network requests:** Use a proxy tool like **Charles** or **Proxyman** to inspect API traffic.

### 6.3 Crash and Error Triage

1. Check **Sentry** for the error group.
2. Identify the affected version, platform, and device.
3. Look at the breadcrumbs to trace user actions before the crash.
4. Reproduce locally if possible.
5. Write a regression test.
6. If the crash is production-critical, proceed with a **hotfix** (see [Section 4.3.2](#432-hotfix-release)).

### 6.4 Logging Best Practices

Use the logging utility (never `console.log` directly):

```typescript
// src/lib/logger.ts
import * as Sentry from 'sentry-expo';

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

function shouldLog(level: LogLevel): boolean {
  const currentLevel = process.env.EXPO_PUBLIC_LOG_LEVEL ?? 'info';
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(currentLevel as LogLevel);
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => {
    if (shouldLog('debug')) console.debug(`[DEBUG] ${message}`, data);
  },
  info: (message: string, data?: Record<string, unknown>) => {
    if (shouldLog('info')) console.info(`[INFO] ${message}`, data);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    if (shouldLog('warn')) console.warn(`[WARN] ${message}`, data);
    Sentry.captureMessage(message, 'warning');
  },
  error: (error: Error, context?: Record<string, unknown>) => {
    console.error(`[ERROR] ${error.message}`, context);
    Sentry.captureException(error, { extra: context });
  },
};
```

---

## 7. Performance Monitoring

### 7.1 Key Metrics

| Metric | Target | Tool |
|---|---|---|
| App launch time (cold) | < 2 seconds | Sentry Performance / React Native Startup Trace |
| App launch time (warm) | < 500 ms | Sentry Performance |
| Time to interactive | < 3 seconds | Sentry Performance / Lighthouse (web) |
| JS bundle size | < 3 MB (prod) | `npx expo export --platform web --output-dir dist` + `npx serve dist` |
| Screen render time | < 300 ms | React Profiler |
| FPS (scroll) | 60 FPS | Flipper / React Native Perf Logger |
| Network request latency (p95) | < 500 ms | Sentry Performance |
| Crash-free session rate | > 99.5% | Sentry |

### 7.2 Monitoring Tools

#### Sentry Performance

Sentry Performance Tracing is configured at the app root:

```typescript
// App.tsx
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: env.isProd ? 0.2 : 1.0, // Sample 20% in production
  profilesSampleRate: env.isProd ? 0.2 : 1.0,
  enableAutoPerformanceTracking: true,
});
```

#### Manual Trace Instrumentation

```typescript
const transaction = Sentry.startTransaction({ name: 'Checkout Flow' });
const span = transaction.startChild({ op: 'api.payment', description: 'Create Payment Intent' });

try {
  await createPaymentIntent();
  span.setStatus('ok');
} catch (error) {
  span.setStatus('internal_error');
  Sentry.captureException(error);
} finally {
  span.finish();
  transaction.finish();
}
```

#### React Profiler

For investigating component re-renders:

```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number,
) {
  logger.debug(`[Profiler] ${id} (${phase}): ${actualDuration.toFixed(2)}ms`);
}

<Profiler id="ProductList" onRender={onRenderCallback}>
  <ProductList />
</Profiler>
```

### 7.3 Bundle Analysis

```bash
# Analyze the production JS bundle
npx expo export --platform web --output-dir dist
npx source-map-explorer dist/_expo/static/js/web/*.js

# Or use expo's built-in analyzer
npx expo export --dump-sourcemap
npx react-native-bundle-analyzer sourcemap.json
```

### 7.4 Performance Budgets

CI enforces the following budgets via Lighthouse CI (web) and custom checks (native):

| Asset | Budget |
|---|---|
| Main JS bundle (gzipped) | < 800 KB |
| Total initial JS (gzipped) | < 1.2 MB |
| Image per screen | < 200 KB |
| Font file (per family) | < 100 KB (subsetted) |

### 7.5 Performance Review in CI

Every PR runs a performance check:

```bash
# Web: Lighthouse CI
lhci autorun --collect.staticDistDir=./dist

# Native: custom performance test suite
npx expo start --no-dev --minify
# Run E2E tests with FPS monitoring
```

---

## 8. Security Review Process

### 8.1 Threat Modeling

Every new feature or integration requires a lightweight threat model using the **STRIDE** framework:

| Category | Consideration |
|---|---|
| **S**poofing | Authentication bypass, token forgery |
| **T**ampering | Data modification in transit or at rest |
| **R**epudiation | Missing audit logs for critical actions |
| **I**nformation Disclosure | Leaking PII, tokens, secrets |
| **D**enial of Service | Rate limiting, resource exhaustion |
| **E**levation of Privilege | Accessing admin features without proper roles |

### 8.2 Security Checklist for All PRs

- [ ] No secrets, API keys, or tokens committed.
- [ ] All API calls use HTTPS (`https://` only).
- [ ] Deep link URLs are validated against an allow-list.
- [ ] User input is sanitized (avoid XSS in WebViews).
- [ ] Authentication tokens stored in SecureStore (iOS Keychain / Android EncryptedSharedPreferences).
- [ ] Biometric authentication falls back to PIN/password.
- [ ] Network requests use certificate pinning for production builds.
- [ ] Third-party SDKs are reviewed for data collection and privacy compliance.
- [ ] Logs do not contain PII (personally identifiable information).
- [ ] File downloads are scanned or restricted to safe MIME types.

### 8.3 Sensitive Data Handling

| Data Type | Handling Requirement |
|---|---|
| Passwords | Never stored locally; transmitted over TLS only |
| Auth tokens | SecureStore (iOS) / EncryptedSharedPreferences (Android) |
| Credit card info | Never stored; use Stripe Elements or similar tokenization |
| PII (email, phone) | Encrypted at rest; masked in logs |
| Location data | Requested with `requestForegroundPermissionsAsync` only when needed |

### 8.4 Security Review Cadence

| Review Type | Frequency | Participants |
|---|---|---|
| Automated SAST (ESLint security plugin) | Every commit | CI pipeline |
| Dependency vulnerability scan | Every PR (Dependabot) | CI pipeline |
| Manual code review for security-sensitive features | Every PR touching auth/payments/data | 2 senior engineers |
| Penetration testing | Bi-annual | External security firm |
| Dependency audit (`npm audit`) | Weekly | Rotating engineer |

### 8.5 Incident Response

1. **Detect:** Monitoring alert or user report.
2. **Triage:** Determine severity (Critical / High / Medium / Low).
3. **Contain:** If critical, disable the affected feature or revert the deploy.
4. **Investigate:** Root cause analysis (RCA) document.
5. **Remediate:** Deploy fix, rotate any leaked credentials.
6. **Post-Mortem:** Document lessons learned within 48 hours.

---

## 9. Dependency Management

### 9.1 Adding a New Dependency

**Approval process:**

1. Open a **Discussion** in the repo describing:
   - What problem the library solves.
   - Why existing solutions are insufficient.
   - Bundle size impact estimate.
   - Maintenance status (last commit, stars, weekly downloads).
2. After discussion approval, add the dependency.

**Installation commands:**

```bash
# Expo-compatible packages (preferred)
npx expo install <package-name>

# Non-Expo packages
npm install <package-name>

# Dev dependencies
npm install --save-dev <package-name>
```

### 9.2 Dependency Policy

| Aspect | Policy |
|---|---|
| **Source** | Prefer maintained, widely-used packages from the Expo ecosystem. |
| **Lockfile** | `package-lock.json` must be committed and kept in sync. |
| **Peer dependencies** | Must be resolved without warnings. |
| **Duplicate packages** | Run `npm dedupe` after installing; check with `npm ls <package>`. |
| **Deprecated packages** | No new project should use deprecated packages. Existing ones must have a migration plan. |
| **Native modules** | Must support the current Expo SDK version. |

### 9.3 Regular Maintenance

```bash
# Weekly: audit for known vulnerabilities
npm audit

# Monthly: check for outdated packages
npx npm-check-updates

# Quarterly: upgrade Expo SDK (when new versions are released)
npx expo install --fix
```

### 9.4 CI Enforcement

| Check | Tool | Action |
|---|---|---|
| License compliance | `license-checker` | Block PRs with GPL / AGPL without legal review |
| Vulnerability scan | `npm audit` / Dependabot | Block PRs with critical or high CVEs |
| Bundle size regression | `size-limit` | Block PRs that exceed budget |
| Duplicate package check | `npm dedupe --dry-run` | Warn on PR |

### 9.5 Expo SDK Upgrades

When upgrading the Expo SDK:

1. Create a branch `chore/expo-sdk-XY-upgrade`.
2. Run `npx expo install --fix` to update compatible packages.
3. Run `npx expo-doctor` to verify compatibility.
4. Run the full test suite and E2E tests on both platforms.
5. Create an ADR documenting the upgrade.
6. Open a PR with a comprehensive changelog.

---

## 10. Onboarding Guide

### 10.1 Prerequisites

| Tool | Version | Installation |
|---|---|---|
| Node.js | ^20.x | [nvm](https://github.com/nvm-sh/nvm) — `nvm install 20` |
| npm | ^10.x | Bundled with Node.js |
| Expo CLI | Latest | `npm install -g expo-cli` |
| EAS CLI | Latest | `npm install -g eas-cli` |
| Xcode | Latest (Mac) | Mac App Store |
| Android Studio | Latest | [developer.android.com/studio](https://developer.android.com/studio) |
| CocoaPods | Latest | `sudo gem install cocoapods` |
| Watchman | Latest | `brew install watchman` |
| 1Password CLI | Latest | `brew install 1password-cli` |

### 10.2 Initial Setup Steps

```bash
# 1. Clone the repository
git clone git@github.com:meadow/meadow.git
cd meadow

# 2. Install Node.js version
nvm use

# 3. Install dependencies
npm ci

# 4. Install Expo-compatible packages
npx expo install --fix

# 5. Set up environment variables
cp .env.development .env.local
# Edit .env.local with your local overrides

# 6. Install EAS CLI and log in
npm install -g eas-cli
eas login

# 7. Start the Metro bundler
npx expo start

# 8. Run on a simulator / device
# iOS: Press 'i' in the Metro terminal
# Android: Press 'a' in the Metro terminal
# Web: Press 'w' in the Metro terminal
```

### 10.3 First Week Checklist

- [ ] Set up local development environment (see above).
- [ ] Run the app successfully on iOS simulator, Android emulator, and web.
- [ ] Read the project README.md and CONTRIBUTING.md.
- [ ] Learn the project's folder structure (see [Section 10.5](#105-project-folder-structure)).
- [ ] Install recommended VS Code extensions (see [Section 10.6](#106-recommended-vs-code-extensions)).
- [ ] Walk through a small bug fix end-to-end (find issue → branch → PR → merge).
- [ ] Set up Sentry and verify error reporting locally.
- [ ] Review the last 5 merged ADRs for architectural context.
- [ ] Set up 1Password and retrieve shared secrets.
- [ ] Get added to the team's communication channels (Slack, GitHub, Sentry).

### 10.4 Essential Scripts

```bash
npm run start       # Start the Expo development server
npm run ios        # Start iOS simulator
npm run android    # Start Android emulator
npm run web        # Start web version
npm run test       # Run all tests
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
npm run format     # Format code with Prettier
npm run validate   # Run lint + typecheck + test sequentially
npx expo doctor    # Verify Expo setup
eas build          # Production build via EAS
eas submit         # Submit to app stores
```

### 10.5 Project Folder Structure

```
meadow/
├── .vscode/                  # Editor settings, extensions, debug configs
├── android/                  # Android native project (generated, do not edit directly)
├── ios/                      # iOS native project (generated, do not edit directly)
├── assets/                   # Static assets (images, fonts, icons)
├── docs/
│   ├── adr/                  # Architecture Decision Records
│   ├── api/                  # API documentation
│   └── guides/               # Developer guides
├── src/
│   ├── app/                  # App entry point, navigation, providers
│   │   ├── App.tsx           # Root component
│   │   ├── providers.tsx     # Context providers wrapping the app
│   │   └── navigation/       # React Navigation configuration
│   ├── features/             # Feature-based modules
│   │   ├── auth/             # Authentication (login, signup, biometrics)
│   │   ├── onboarding/       # Onboarding flow
│   │   ├── home/             # Home screen
│   │   ├── profile/          # User profile
│   │   └── settings/         # App settings
│   ├── components/           # Shared UI components (design system)
│   │   ├── ui/               # Atomic components (Button, Text, Input)
│   │   └── layouts/          # Layout components (Screen, Modal)
│   ├── config/               # Environment config, feature flags
│   ├── lib/                  # Core utilities (API client, logger, storage)
│   ├── hooks/                # Shared React hooks
│   ├── services/             # External service integrations (Sentry, analytics)
│   ├── store/                # Global state (Zustand stores)
│   ├── types/                # Shared TypeScript type definitions
│   └── utils/                # Pure utility functions
├── __tests__/                # Test setup and global mocks
├── e2e/                      # E2E tests (Detox / Maestro)
├── .env                      # Default environment variables
├── .env.development          # Development overrides
├── .env.staging              # Staging overrides
├── .env.production           # Production overrides
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── tsconfig.json             # TypeScript configuration
├── app.config.ts             # Expo app configuration
├── babel.config.js           # Babel configuration
├── metro.config.js           # Metro bundler configuration
├── tailwind.config.js        # Tailwind CSS configuration (if applicable)
├── package.json
├── CHANGELOG.md
├── CONTRIBUTING.md
├── ENGINEERING_PLAYBOOK.md   # This document
├── LICENSE
└── README.md
```

### 10.6 Recommended VS Code Extensions

| Extension | Purpose |
|---|---|
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | Linting |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) | Code formatting |
| [Expo Tools](https://marketplace.visualstudio.com/items?itemName=byCedric.vscode-expo) | Expo config intellisense |
| [Jest Runner](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner) | Run individual tests |
| [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) | Git history and blame |
| [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) | Tailwind CSS support |
| [TypeScript + JavaScript](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next) | TypeScript language features |
| [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens) | Inline error highlighting |
| [Pretty TypeScript Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors) | Human-readable TS errors |
| [Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced) | Preview `.md` files |

### 10.7 Getting Help

| Resource | Contact / Link |
|---|---|
| Engineering Slack | #meadow-eng |
| PR Reviews | Tag `@meadow/engineering` |
| Bug Reports | GitHub Issues |
| Security Concerns | security@meadow.app |
| Architecture Questions | ADR PRs or team design sessions |

### 10.8 Code of Conduct

All contributors are expected to adhere to the project's [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, constructive, and inclusive in all interactions.

---

## Appendix

### A. Quick Reference Cards

| Action | Command |
|---|---|
| Start dev server | `npx expo start` |
| Clear cache + start | `npx expo start -c` |
| Run tests | `npm run test` |
| Run lint | `npm run lint` |
| Type-check all files | `npm run typecheck` |
| Run all validations | `npm run validate` |
| Build for production | `eas build --platform all --profile production` |
| Submit to stores | `eas submit --platform all` |
| Create EAS update | `eas update --branch <branch> --message "<message>"` |
| Check Expo setup | `npx expo doctor` |
| Install Expo pkg | `npx expo install <package>` |
| Audit dependencies | `npm audit` |

### B. Document History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | 2025-01-08 | Platform Engineering | Initial creation |

---

*© 2025 Meadow. This playbook is maintained by the Platform Engineering team and reviewed quarterly.*
