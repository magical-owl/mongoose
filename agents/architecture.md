# AI Agent Architecture Instructions

## Overview

Meadow uses **Feature-First + Clean Architecture**. Every feature is self-contained within `src/features/<feature-name>/` and follows a strict layered structure. The architecture enforces unidirectional dependency: **Presentation → Hooks → Services → Repositories → Data Sources**.

## Layer Responsibilities

### 1. Presentation Layer (`src/features/<feature>/screens/`, `src/features/<feature>/components/`)

- **What it does:** Renders UI, handles user gestures, navigates between screens.
- **What it NEVER does:** Contains business logic, calls repositories directly, accesses storage, makes API calls.
- **Rules:**
  - Screens are thin: they compose components and pass props/handlers down.
  - Components are pure: they receive data via props, emit events via callbacks.
  - No `useEffect` for data fetching — that belongs in hooks.
  - No Zustand stores imported directly — use hooks to access state.
  - No `fetch`, `axios`, or API calls — delegate to hooks → services.
- **File naming:** `*.screen.tsx`, `*.component.tsx`, `*.ui.tsx` for atomic design system components.

### Componentization Requirement

Screens are composition roots, not reusable UI containers. Extract repeated visual modes and complete interaction surfaces into typed components under `src/features/<feature>/components/`. Keep navigation, hooks, service calls, repositories, and screen-level side effects in the route or screen. Components receive domain data and callbacks through props and must not call `router`, storage, APIs, or repositories directly.

Before adding a new screen-specific UI pattern, check [`agents/componentization.md`](componentization.md) and prefer an existing shared or feature component. A component used by two screens must have one source of truth and a component test.

### 2. Hooks Layer (`src/features/<feature>/hooks/`)

- **What it does:** Bridges services to React state. Manages component lifecycle, loading/error states, and side effects.
- **What it NEVER does:** Contains domain logic, calls repositories directly, performs data transformation.
- **Rules:**
  - Custom hooks call service methods and map results to React state.
  - Hooks manage `useState`/`useReducer` for UI state, `useQuery`/`useMutation` for server state.
  - Hooks do NOT contain `if/else` business rules — those belong in services.
  - Hooks do NOT import repositories — always go through services.
  - Hooks return plain data and callbacks, never service instances.
- **File naming:** `use<Feature>.ts`, `use<Feature>List.ts`, `use<Feature>Form.ts`.

### 3. Services Layer (`src/features/<feature>/services/`)

- **What it does:** Owns all business logic, validation, orchestration, and error translation.
- **What it NEVER does:** Accesses storage, makes API calls, imports React, imports UI code.
- **Rules:**
  - Every public method validates inputs with Zod before processing.
  - Every public method returns a typed `Result<T>` (discriminated union: `{ ok: true; data: T } | { ok: false; error: ServiceError }`).
  - Services receive repository dependencies via constructor injection (never instantiate repos internally).
  - Services translate low-level errors (network, DB) into domain-meaningful errors.
  - Services are pure TypeScript — no React imports, no side effects at module level.
  - Services are fully unit-testable with mocked repositories.
- **File naming:** `<Feature>Service.ts`.

### 4. Repositories Layer (`src/features/<feature>/repositories/` or `src/repositories/`)

- **What it does:** Owns data access — composes API calls, local storage, and cache. Determines where data comes from and how it's persisted.
- **What it NEVER does:** Contains business logic, validates domain rules, transforms data for UI.
- **Rules:**
  - Every repository implements `IRepository<T>` with standard CRUD: `getById`, `getAll`, `create`, `update`, `delete`.
  - Repositories compose multiple data sources (remote API + local cache) using offline-first strategy.
  - Repositories return domain models, not raw API responses or DB rows.
  - Repositories handle connectivity detection and offline queueing.
  - Repositories are fully unit-testable with mocked data sources.
- **File naming:** `<Feature>Repository.ts`, `I<Feature>Repository.ts` (interface).

### 5. Data Sources Layer (`src/api/`, `src/database/`, `src/ai/`)

- **What it does:** Raw I/O — HTTP calls via Axios, local DB queries via SQLite/MMKV, AI model inference.
- **What it NEVER does:** Contains business logic, transforms data into domain models, caches beyond raw responses.
- **Rules:**
  - API client is a singleton Axios instance with interceptors (auth, retry, logging, transformation).
  - Database layer uses typed queries and returns raw rows.
  - AI layer wraps model calls and returns raw inference results.
  - Data sources are stateless — all state lives in repositories or services.

## Dependency Rules (ENFORCED)

```
Screen → Hook → Service → Repository → Data Source (API/DB/AI)
  │        │        │           │
  └────────┴────────┴───────────┴──→ Shared (types, utils, theme, config)
```

- **UI NEVER imports** from `@services/`, `@repositories/`, `@api/`, `@database/`, `@ai/`, `@stores/` directly.
- **Hooks NEVER import** from `@repositories/`, `@api/`, `@database/`, `@ai/` directly.
- **Services NEVER import** from `@api/`, `@database/`, `@ai/`, `@stores/`, React, or UI modules.
- **Repositories NEVER import** from `@services/`, `@hooks/`, React, or UI modules.
- **Shared modules** (`@shared/`, `@utils/`, `@types/`, `@theme/`, `@config/`) can be imported by any layer but must remain generic — no feature-specific logic.

## Feature Folder Structure

```
src/features/<feature>/
├── screens/          # Screen components (thin, delegates to hooks)
│   └── <Feature>Screen.tsx
├── components/       # Feature-specific UI components
│   └── <Feature>Card.tsx
├── hooks/            # React hooks bridging services to state
│   └── use<Feature>.ts
├── services/         # Business logic, validation, orchestration
│   └── <Feature>Service.ts
├── repositories/     # Data access (optional — can live in src/repositories/)
│   └── <Feature>Repository.ts
├── types/            # Feature-specific types
│   └── index.ts
└── index.ts          # Public barrel exports (only what other features may consume)
```

## When to Extend the Architecture

If a new feature doesn't fit the existing architecture:
1. First, try to fit it within the existing patterns.
2. If impossible, create an ADR proposing the architectural change.
3. Never compromise architectural integrity for speed.

## Testing by Layer

| Layer | Test Type | What to Test |
|-------|-----------|-------------|
| Service | Unit | Business rules, validation, error translation, orchestration |
| Repository | Unit | Data source composition, offline behavior, CRUD |
| Hook | Unit + Component | State bridging, loading/error states, lifecycle |
| Screen/Component | Component | Rendering, user interactions, accessibility |
| Integration | Integration | Cross-layer flows (screen → hook → service → repo → mock API) |
