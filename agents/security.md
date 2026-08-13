# AI Agent Security Instructions

## Never Commit Secrets
- Never hardcode API keys, tokens, passwords, or certificates in source code.
- Never commit `.env` files, `*.p12`, `*.jks`, `*.key`, or credential files.
- Use environment variables for all secrets; reference them at build or runtime.
- If a secret is detected in code, immediately flag it and remove it from version history.
- Add sensitive file patterns to `.gitignore` (`.env`, `.env.local`, `*.pem`, `secrets/**`).

## Use SecureStore & Encryption at Rest for Sensitive Data
- Store authentication tokens, refresh tokens, and master encryption keys in `expo-secure-store` (platform-native iOS Keychain / Android Keystore).
- All sensitive user entries (journal content, financial transactions, private notes, health/habit history) must be encrypted at rest using AES-256 before persistence in local SQLite or MMKV.
- Never store plain-text sensitive data in `AsyncStorage`, Redux, Zustand, or plain JS objects.
- Retrieve SecureStore values asynchronously and handle missing/expired entries gracefully.

## Biometric App Lock & Inactivity Lock
- Protect sensitive apps (Diary, Journal, Finance, Notes) with local biometric authentication (FaceID, TouchID, Android Biometrics) using `expo-local-authentication`.
- Re-trigger biometric authentication when the app resumes from background after the lock timeout.
- Prevent screenshot capture or task switcher preview leaks on iOS/Android where required by compliance policy.

## Clipboard & Sensitive Input Safety
- Disable auto-copy of sensitive text to OS clipboard without user interaction.
- Set `secureTextEntry` for password inputs and mark sensitive text inputs appropriately to prevent OS auto-fill or keyboard dictionary learning of private journal content.


## Validate All Inputs
- Validate all external input at the boundary (API responses, user forms, deep links, push notification payloads).
- Use Zod schemas to parse and validate data before processing.
- Reject malformed or unexpected payloads immediately; do not pass raw input into business logic.
- Sanitize any data rendered as text to prevent XSS.

## Avoid PII in Logs
- Never log email addresses, phone numbers, real names, exact locations, or auth tokens.
- Strip or obfuscate PII before passing data to logging utilities (e.g., `console.warn`, external log services).
- Use anonymized identifiers (e.g., `user_abc123`) in logs when user context is needed.
- Tag log levels appropriately: use `error` for failures, `warn` for recoverable issues, `info` for high-level flow only.

## Use Least Privilege Principle
- Request only the minimum platform permissions required for a feature (camera, location, contacts, etc.).
- Scope API tokens to the minimum set of endpoints and actions needed.
- Avoid storing data that is not directly needed by the feature.
- Drop elevated permissions as soon as they are no longer needed.

## Prepare for Certificate Pinning
- Where possible, implement certificate or public-key pinning in the networking layer.
- Provide a mechanism to update pinned keys without requiring an app store release (e.g., remote config fallback).
- Handle pinning failures with clear, user-friendly error messages (not raw SSL errors).
- Test pinning in staging before deploying to production.

## Secure Error Messages
- Never expose stack traces, database error details, or internal paths in production error responses.
- Return user-safe error messages (e.g., "Something went wrong. Please try again.").
- Log full error details server-side or to a crash-reporting service (with PII stripped).
- Use typed error codes so the UI can display appropriate localized messages without leaking internals.
