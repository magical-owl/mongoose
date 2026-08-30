# New App Starter Reference & Blueprint for AI Agents

## Overview

This guide serves as the mandatory point of reference for AI agents and human developers when creating a new application (e.g., Diary, Journal, Finance Tracker, Habit Tracker, Notes, AI Companion) built on top of Meadow.

---

## Phase 1: Project & App Initialization

### 0. Clone or Duplicate Meadow Template
Before starting a new app, clone or duplicate Meadow into a new repository directory:
```bash
# Option A: Local Copy
cp -r /path/to/meadow /path/to/my-new-app
cd /path/to/my-new-app
rm -rf .git && git init
npm install

# Option B: GitHub Template
# Click "Use this template" on GitHub -> git clone <new-repo-url> -> npm install
```

### 1. Update Application Identifiers (`app.json`)
Before writing app-specific code, update core configuration:
- **App Metadata**: Set `"name"`, `"slug"`, and `"scheme"`.
- **iOS Bundle Identifier**: Set `"ios.bundleIdentifier"` (e.g. `com.company.appname`).
- **Android Package**: Set `"android.package"` (e.g. `com.company.appname`).
- **Permissions InfoPlist**: Provide clear user-facing justification strings for OS permissions (Face ID, Camera, Photos).

### 2. Customize Theme System (`src/theme/`)
- Update color tokens in `@theme/colors` (`primary`, `surface`, `background`, `accent`).
- Adjust typography tokens in `@theme/typography`.
- **Strict Rule**: Use theme tokens in all components. Never hardcode hex colors or raw pixel values.

### 3. Establish Reusable UI Boundaries

Before adding app-specific screens, review [`agents/componentization.md`](componentization.md). Keep route files thin, place domain UI in `src/features/<feature>/components/`, and place domain-neutral controls in `src/shared/components/`. New screens should compose existing components instead of copying cards, filters, calendars, editors, or analytics layouts. Every extracted component must expose typed props, preserve accessibility behavior, and include focused component tests.

---

## Phase 2: Feature-First Clean Architecture Blueprint

Every new feature module must be created under `src/features/<feature-name>/` following strict Clean Architecture layering:

```
src/features/<feature-name>/
├── domain/                  # Data models, Zod validation schemas, domain types
│   └── <Entity>.ts
├── repositories/            # Data persistence implementations
│   ├── I<Entity>Repository.ts
│   └── <Entity>Repository.ts
├── services/                # Business logic & compliance validation
│   └── <Entity>Service.ts
└── hooks/                   # React Query & Zustand state hooks
    └── use<Entity>.ts
```

### Dependency Direction Rules
- **Presentation (`app/`)** → **Hooks** → **Services** → **Repositories** → **Data Sources / Storage**.
- **Screens & Components**: Cannot call repositories, storage, or APIs directly. Must use hooks/services.
- **Services**: Own business rules and compliance validation. Cannot access storage directly.
- **Repositories**: Own data persistence (MMKV, SecureStore, SQLite).

---

## Phase 3: Security & Sensitive App Guardrails

When initializing an app handling confidential user data (journals, financial records, health/habits, notes):

1. **Storage Encryption**:
   - Store master encryption keys in `expo-secure-store` (Keychain / Keystore).
   - Encrypt local database payloads at rest using AES-256.
2. **Biometric Security**:
   - Protect sensitive screens with `expo-local-authentication` (Face ID / Touch ID / Biometrics).
3. **AI Privacy (EU AI Act & Apple Guidelines)**:
   - Request Zero Data Retention (ZDR) on remote AI calls.
   - Prohibit sending user content for model training.
   - Provide an explicit AI opt-in toggle in Settings.
4. **Data Governance & Erasure**:
   - Provide a functional in-app **"Delete Account / Clear Data"** button that hard-purges local and server data (GDPR Art. 17).
   - Provide **Data Export** functionality in structured JSON format (GDPR Art. 20).
5. **Legal, Trademark & Asset Compliance**:
   - Verify app name against trademark databases (e.g. USPTO TESS) to prevent brand infringement.
   - Ensure all icons, fonts, and assets have commercial-use clearance (OFL Google Fonts, `@expo/vector-icons`).
   - Host public Privacy Policy and Terms of Use (EULA) links before release using the repository compliance documents when present.
   - Implement user reporting/blocking tools if the app includes public content (Guideline 1.2).


---

## Phase 4: Step-by-Step Implementation Roadmap

1. **Step 1 — Create Feature Folder**:
   - Initialize `src/features/<feature-name>/`.
2. **Step 2 — Define Domain Schema**:
   - Write Zod validation schema and TypeScript types in `domain/`.
3. **Step 3 — Build Repository & Encrypted Storage**:
   - Implement storage contract in `repositories/`. Add unit tests in `repositories/__tests__/`.
4. **Step 4 — Build Business Service**:
   - Implement business logic in `services/`. Add unit tests in `services/__tests__/`.
5. **Step 5 — Create React Hook**:
   - Connect TanStack Query / Zustand in `hooks/`.
6. **Step 6 — Build Screen UI**:
   - Add routes in `app/(tabs)/` or `app/<feature-name>/`. Apply `@theme` styles.

---

## Phase 5: Verification & Pre-Release Quality Audit

Before submitting or completing a new app build, execute these checks:

```bash
# 1. Type Safety Check
npm run typecheck

# 2. Code Style & Lint Audit
npm run lint

# 3. Unit & Integration Test Suite
npm test

# 4. Expo Health & Dependency Audit
npm run doctor
```

All 4 checks must pass cleanly with 0 errors before deploying to TestFlight or App Store.
