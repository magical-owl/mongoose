# Meadow — Expo Enterprise Starter Platform

Meadow is a production-grade Expo application platform built with **Feature-First + Clean Architecture** (Expo SDK 57, React 19, TypeScript 6). It serves as a reusable foundation and starter template for privacy-sensitive, data-heavy, and AI-assisted mobile applications (Diary, Journal, Finance, Habit Tracker, AI Companion, Notes, etc.).

---

## 🚀 Starter Protocol: How to Build a New App with Meadow

Meadow is designed to be cloned or copied when initializing a new application:

### Option A: Use as GitHub Template
1. Click **Use this template** on GitHub ➔ **Create a new repository**.
2. Clone your new app repository locally:
   ```bash
   git clone https://github.com/your-username/my-new-app.git
   cd my-new-app
   npm install
   ```

### Option B: Local Directory Copy
```bash
# 1. Copy meadow to your new app directory
cp -r meadow my-new-app
cd my-new-app

# 2. Reset git repository history
rm -rf .git && git init
npm install
```

---

## 📋 New App Execution Blueprint

Follow the step-by-step sequence in [`agents/new-app.md`](agents/new-app.md) when developing your new application:

1. **Configure Identity ([`app.json`](app.json))**: Set `"name"`, `"slug"`, `"scheme"`, `"ios.bundleIdentifier"`, and `"android.package"`.
2. **Customize Theme ([`src/theme/`](src/theme/))**: Set brand palette in `colors.ts` and typography scale in `typography.ts`.
3. **Build Feature Modules ([`src/features/`](src/features/))**:
   - **Domain**: Data models & Zod schemas.
   - **Repositories**: Encrypted storage handlers (AES-256 in SecureStore / MMKV).
   - **Services**: Business rules & Zero Data Retention AI calls.
   - **Hooks & Presentation**: React Query hooks & screens in `app/(tabs)/`.
4. **Enforce Security & Compliance**: Enable biometric app lock (`expo-local-authentication`), in-app account deletion (Guideline 5.1.1), and AI transparency tags (EU AI Act & Guideline 2.5.18).
5. **Run Verification**: `npm run typecheck && npm run lint && npm test && npm run doctor`.

---

## 🛡️ Security & Compliance Infrastructure

Meadow comes pre-configured with security and privacy guardrails for sensitive applications:

| Protection Domain | Implementation & Guardrail | Reference |
| :--- | :--- | :--- |
| **Encryption at Rest** | AES-256 local database encryption using keys stored in `expo-secure-store` (Keychain / Keystore). | [`COMPLIANCE/PRIVACY.md`](COMPLIANCE/PRIVACY.md) |
| **Biometric Security** | Inactivity auto-lock and Face ID / Touch ID authentication (`expo-local-authentication`). | [`agents/security.md`](agents/security.md) |
| **Zero PII Leakage** | Strict log sanitization preventing entry text, prompt data, or PII in logs or crash tools. | [`AGENTS.md`](AGENTS.md#L73-L75) |
| **AI Data Privacy** | Zero Data Retention (ZDR) configuration preventing user content from training AI models. | [`COMPLIANCE/AI_COMPLIANCE.md`](COMPLIANCE/AI_COMPLIANCE.md) |
| **User Rights** | Functional in-app "Delete Account" / "Clear Data" (GDPR Art. 17) & JSON Data Export (GDPR Art. 20). | [`COMPLIANCE/GDPR.md`](COMPLIANCE/GDPR.md) |
| **Monetization & IAP** | Native StoreKit In-App Purchases with mandatory "Restore Purchases" button on paywalls. | [`agents/release.md`](agents/release.md#L38-L42) |
| **Legal & IP Safeguards** | Trademark clearance checks, commercial-use asset licensing (Google Fonts, `@expo/vector-icons`), and live Privacy Policy/EULA hosting templates. | [`AGENTS.md`](AGENTS.md#L91-L97) |

---

## 🏛️ Architecture & Layering Rules

```
Presentation (app/) ➔ Hooks ➔ Services ➔ Repositories ➔ Storage / API / AI
```

- **No Business Logic in UI**: Screens & components render presentation state only.
- **No Direct Storage/API in Screens**: Screens consume custom hooks; services own business logic; repositories own persistence.
- **Layer Isolation**: Shared modules (`@shared/`) remain generic; features do not create circular cross-imports.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Expo SDK 57 |
| **Routing** | Expo Router (file-based) |
| **UI Library** | React 19 + React Native 0.86 |
| **Language** | TypeScript 6 (strict mode) |
| **State (Client)** | Zustand 5 |
| **State (Server)** | TanStack Query 5 |
| **Forms & Validation** | React Hook Form + Zod |
| **Networking** | Axios HTTP Client |
| **Secure Keys** | Expo Secure Store (iOS Keychain / Android Keystore) |
| **Local Storage** | MMKV (AES-256 encrypted) |
| **Animations & Gestures** | React Native Reanimated 3 + Gesture Handler |
| **Testing** | Jest + React Native Testing Library |
| **CI/CD & Builds** | GitHub Actions + EAS Build |

---

## 💻 Developer Quick Start & Scripts

```bash
# Install dependencies
npm install

# Start local dev server
npm run web           # Web dev server
npm run ios           # iOS simulator
npm run android       # Android emulator

# Code Quality & Testing
npm run typecheck     # TypeScript strict check
npm run lint          # ESLint code style audit
npm test              # Jest test suite (unit & integration)
npm run doctor        # Expo SDK health check

# Cloud Builds
npm run eas:build     # Build binary via EAS
```

---

## 📂 Directory Structure

```
meadow/
├── app/              # Expo Router (file-based navigation)
├── src/
│   ├── features/     # Feature-First modules (domain, repositories, services, hooks)
│   ├── shared/       # Reusable components, hooks, utilities
│   ├── services/     # Cross-cutting business services
│   ├── repositories/ # Abstracted data access layer
│   ├── api/          # HTTP data sources
│   ├── ai/           # AI proxy & provider abstractions
│   ├── stores/       # Zustand client stores
│   ├── hooks/        # Shared React hooks
│   ├── providers/    # React Context providers
│   ├── theme/        # Design system tokens (colors, spacing, typography)
│   ├── config/       # Environment & feature flag config
│   ├── constants/    # Global constants & prompts
│   ├── database/     # Database schemas & migrations
│   └── utils/        # Utility helpers
├── docs/             # Technical architecture documentation
├── agents/           # AI Agent blueprints & starter guides (new-app.md, security.md, release.md)
├── COMPLIANCE/       # Privacy, GDPR, Apple App Store & legal frameworks
└── tests/            # Test setups & mocks
```

---

## 📖 Documentation & Guidelines

- **New App Starter Guide**: [`agents/new-app.md`](agents/new-app.md)
- **AI Agent Rules & Compliance**: [`AGENTS.md`](AGENTS.md)
- **Architecture Guide**: [`docs/Architecture.md`](docs/Architecture.md)
- **Security Guide**: [`docs/Security.md`](docs/Security.md)
- **App Store & Google Play Release**: [`agents/release.md`](agents/release.md)
- **Privacy & GDPR Framework**: [`COMPLIANCE/PRIVACY.md`](COMPLIANCE/PRIVACY.md)

---

## 📄 License

See [LICENSE](LICENSE).
