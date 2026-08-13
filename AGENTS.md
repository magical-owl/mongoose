# Meadow - Expo Enterprise Starter Platform

## Project Overview

Meadow is a production-grade Expo application platform built with Feature-First + Clean Architecture. It serves as a reusable foundation for future apps (Diary, Journal, Finance, Habit Tracker, AI Companion, Notes, etc.).

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
- **Google Play Data Safety Section**: Disclose all data types collected/processed, ensure transit encryption (HTTPS/TLS 1.3), and provide an explicit deletion mechanism URL/in-app flow.
- **Zero Third-Party Trackers**: No third-party ad networks, fingerprinting SDKs, or data brokers may be imported into sensitive app modules.


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

## Documentation

See `/docs/` for full documentation. See `/agents/` for AI agent instructions.

## Expo SDK 57

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.