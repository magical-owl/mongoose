# Meadow - Expo Enterprise Starter Platform

## Project Overview

Meadow is a production-grade Expo application platform built with Feature-First + Clean Architecture. It serves as a reusable foundation for future apps (Diary, Journal, Finance, Habit Tracker, AI Companion, Notes, etc.).

## Template Usage & Starter Protocol

Meadow is designed to be cloned or copied as a starter template repository when building new applications. When an AI agent or developer is instructed to create a new app using Meadow:
1. **Clone / Duplicate Repository**: Treat Meadow as the source template (via GitHub Template or `cp -r meadow my-new-app`).
2. **Initialize App Identity**: Run `npm run init-app -- --name "MyAppName" --slug "myapp" --bundle "com.mycompany.myapp"` to automatically update `app.json` and `package.json`.
3. **Follow New App Blueprint**: Strictly execute the sequence in [`agents/new-app.md`](file:///Users/louise/Desktop/meadow/agents/new-app.md) to configure theme tokens (`@theme`), feature layering (`src/features/`), compliance guardrails, and EAS deployment.

## Architecture

- **Feature-First + Clean Architecture**: Presentation → Hooks → Services → Repositories → Data Sources → Storage/API/AI
- **No business logic in UI**
- **No API calls in screens**
- **No storage access from components**
- **Repository owns persistence**
- **Services own business rules**
- **Shared modules remain generic**

## Tech Stack

- Expo SDK 57
- Expo Router (file-based routing)
- React 19 + TypeScript 6
- Zustand (state management)
- TanStack Query (server state)
- React Hook Form + Zod (forms + validation)
- Axios (HTTP client)
- Expo Secure Store + MMKV (storage)
- React Native Reanimated (animations)
- Gesture Handler (gestures)
- Jest + RNTL (testing)
- GitHub Actions + EAS (CI/CD)

## AI Rules

### Never:
- Use `any` type
- Bypass services layer
- Bypass repositories layer
- Duplicate logic
- Hardcode colors, spacing, or prompts
- Create circular dependencies
- Introduce unnecessary packages
- Log user entry text, personal notes, PII, or auth tokens to console or crash tools
- Store sensitive entries in unencrypted local storage (AsyncStorage/plain MMKV)
- Send sensitive user data to AI models without Zero-Data-Retention (ZDR) & opt-in consent

### Always:
- Write TypeScript with strict types
- Write tests for all new code
- Update documentation
- Reuse existing abstractions
- Follow the architecture pattern
- Use theme tokens from `@theme`
- Explain major architectural decisions
- Enforce AES-256 encryption at rest for sensitive data with keys in SecureStore/Keychain
- Follow Apple App Store Guideline 5.1.1 & Google Play Data Safety policies

## Sensitive App Compliance Standard

All modules and agents building on Meadow (Diary, Journal, Finance, Habit Tracker, AI Companion, Notes) must adhere to these compliance controls across development, storage, network, AI processing, and app store deployment:

### 1. Data Security & Storage (Encryption at Rest)
- **Data Classification**: Treat all user entries, journal text, notes, health/habit history, financial records, and AI conversation histories as **Highly Confidential Personal Data**.
- **Zero Plain-Text Persistence**: Plain-text storage in `AsyncStorage` or unencrypted `MMKV` for sensitive user entries is strictly prohibited.
- **AES-256 Local Encryption**: SQLite or MMKV instances holding sensitive payload data must be encrypted with AES-256 keys generated and stored in `expo-secure-store` (iOS Keychain / Android Keystore).
- **Biometric App Protection**: Sensitive features must support local biometric authentication (FaceID/TouchID/Biometrics via Expo LocalAuthentication).

### 2. Zero PII & Payload Leakage
- **No PII in Logs or Telemetry**: Never pass journal entries, prompts, credentials, or PII into `console.log`, Sentry crash reports, or analytics trackers.
- **Log Sanitization**: Obfuscate or strip user identifiers in debug outputs.

### 3. AI Safety & Privacy Compliance (EU AI Act & Apple 2.5.18)
- **Zero Data Retention (ZDR)**: Network AI proxies (OpenAI, Anthropic, Gemini) must explicitly request Zero Data Retention header/config. User content must **never** be used for model training.
- **AI Content Transparency & Labeling**: All AI-generated suggestions, summaries, or content must be clearly tagged and labeled to satisfy EU AI Act and Apple App Store AI Guidelines.
- **Granular User Opt-In/Opt-Out**: AI processing of personal entries must be strictly opt-in with an instant toggle to disable remote AI features.

### 4. User Rights & Data Governance (GDPR / CCPA / DPA)
- **Data Portability (GDPR Art. 20)**: Provide full export functionality (JSON / encrypted backup) for all user-generated entries.
- **Right to Erasure (GDPR Art. 17)**: "Delete Account" / "Clear Data" must perform a hard purge across local SecureStore, MMKV, SQLite databases, and remote server caches.

### 5. App Store & Google Play Release Compliance
- **Apple App Store Review Guidelines**: Comply with Guideline 5.1.1 (Data Collection & Storage), 5.1.2 (Data Use & Sharing), and 2.5.18 (AI Generated Content & Safety).
- **In-App Purchase & Monetization (Guideline 3.1.1)**: Digital subscriptions or paid features must use native Apple IAP / StoreKit with a mandatory "Restore Purchases" button on paywalls. In-app web credit card checkouts (Stripe/PayPal) are prohibited.
- **Google Play Data Safety Section**: Disclose all data types collected/processed, ensure transit encryption (HTTPS/TLS 1.3), and provide an explicit deletion mechanism URL/in-app flow.
- **Zero Third-Party Trackers**: No third-party ad networks, fingerprinting SDKs, or data brokers may be imported into sensitive app modules.


### 6. Legal, Trademark & Intellectual Property (IP) Compliance
- **Trademark Clearance**: Verify app names and branding against trademark databases (e.g. USPTO TESS) to prevent trademark infringement.
- **Asset Licensing**: All fonts, icons, and media must have verified commercial-use licenses (OFL Google Fonts, `@expo/vector-icons`, royalty-free assets). Never use unlicensed images or graphics.
- **Public Legal Links**: Maintain live, publicly hosted Privacy Policy and Terms of Use (EULA) URLs (using [`COMPLIANCE/PRIVACY.md`](file:///Users/louise/Desktop/meadow/COMPLIANCE/PRIVACY.md)).
- **User Content Moderation (Guideline 1.2)**: If apps include public user-generated content or social sharing, implement a mandatory "Block / Report User" mechanism and standard EULA terms.

### 7. Accessibility (a11y) & Offline Resilience
- **Dynamic Type & Font Scaling (Guideline 2.5.5)**: UI components must support OS Dynamic Type scaling gracefully without text truncation or broken container bounds.
- **Offline Network Resilience**: All network operations must fail gracefully with offline fallbacks (`src/services/OfflineService.ts`). Unsaved local entries must never be lost during connection drops.



## Path Aliases

- `@/*` → `src/*`
- `@features/*` → `src/features/*`
- `@shared/*` → `src/shared/*`
- `@services/*` → `src/services/*`
- `@repositories/*` → `src/repositories/*`
- `@api/*` → `src/api/*`
- `@ai/*` → `src/ai/*`
- `@stores/*` → `src/stores/*`
- `@hooks/*` → `src/hooks/*`
- `@providers/*` → `src/providers/*`
- `@theme/*` → `src/theme/*`
- `@config/*` → `src/config/*`
- `@constants/*` → `src/constants/*`
- `@database/*` → `src/database/*`
- `@utils/*` → `src/utils/*`
- `@tests/*` → `tests/*`

## Documentation & Reference Guides

- Full Documentation: See `/docs/`
- AI Agent Instructions: See `/agents/`
- **New App Starter Guide**: See [`agents/new-app.md`](file:///Users/louise/Desktop/meadow/agents/new-app.md) when initializing a new app or feature on Meadow platform.


## Expo SDK 57

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.