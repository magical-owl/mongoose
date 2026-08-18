# Meadow Architecture

## Overview

Meadow follows a **Clean Architecture** pattern with strict dependency rules. The architecture enforces a unidirectional dependency flow from the outermost layers (Presentation) inward to the core infrastructure layers (Storage/API/AI). Data flows inward; dependencies flow outward.

```
Presentation → Hooks → Services → Repositories → Data Sources → Storage / API / AI
```

## Layer Descriptions

### 1. Presentation Layer

**Directory:** `src/features/`, `src/providers/`, `shared/components/`

The Presentation layer is the UI layer. It contains React Native screens, components, and navigation configuration.

**Responsibilities:**
- Render UI components using React Native primitives and shared component library
- Handle user input via forms, gestures, and touch events
- Navigate between screens using `expo-router`
- Display loading states, errors, and empty states
- Consume hooks that expose state and actions

**Rules:**
- Presentation MUST NOT import from Services, Repositories, Data Sources, or Infrastructure directly
- Presentation MUST NOT access storage, API, or any backend directly
- Presentation SHOULD only import from Hooks and shared types/components
- Components SHOULD be stateless where possible; delegate state management to hooks

#### Reusable Component Boundaries

Screens are route-level composition roots. Reusable visual modes and interaction surfaces belong in components, not in `app/` route files. A component should receive typed data and callbacks, use theme tokens, and expose accessibility behavior. It should not read storage, call services or repositories, own navigation, or contain feature orchestration.

Place components according to reuse scope:

- `src/shared/components/` for domain-neutral UI that can move between apps.
- `src/features/<feature>/components/` for reusable UI that understands one feature's domain.
- `app/` only for route composition and screen-specific wiring.

See [`agents/componentization.md`](../agents/componentization.md) for extraction criteria, the current extraction map, and the checklist used when extending the template.

### 2. Hooks Layer

**Directory:** `src/hooks/`, `src/shared/hooks/`

Custom React hooks that bridge the Presentation layer to the Services layer. Hooks encapsulate state management, side effects, and business logic orchestration.

**Responsibilities:**
- Consume services and expose simplified state + actions to components
- Manage component lifecycle (mount/unmount effects)
- Handle form state via `react-hook-form` with Zod validation schemas
- Integrate with `@tanstack/react-query` for server state caching and synchronization
- Integrate with Zustand stores for client-side global state
- Transform service-layer Result types into render-ready data

**Rules:**
- Hooks MUST NOT import from Repositories, Data Sources, or Infrastructure directly
- Hooks SHOULD import from Services to access business logic and data operations
- Hooks MAY import shared types, utilities, and constants
- Hooks SHOULD NOT contain JSX or render logic

### 3. Services Layer

**Directory:** `src/services/`

The Services layer contains business logic, validation, and orchestration. Services compose operations from repositories and implement business rules.

**Responsibilities:**
- Implement business logic and domain rules
- Validate input data using Zod schemas
- Coordinate operations across multiple repositories
- Map between DTOs and domain models
- Return `Result<T, ArchitectureError>` discriminated unions
- Enforce authorization and access control policies

**Rules:**
- Services MUST NOT import from Presentation or Hooks
- Services SHOULD import from Repositories to perform data operations
- Services MAY import from Data Sources directly for specialized operations
- Services SHOULD NOT depend on framework-specific modules (React Native, Expo)
- Services MUST use the Result type for all operations that can fail

### 4. Repositories Layer

**Directory:** `src/repositories/`

The Repository layer abstracts data access behind a clean interface. Repositories own the mapping between data source models and domain entities.

**Responsibilities:**
- Provide CRUD operations for domain entities via `IRepository<T>` interface
- Abstract whether data comes from API, local storage, or cache
- Map incoming DTOs to domain entities
- Combine multiple data sources (e.g., API-first with local fallback)
- Handle data source errors and convert to ArchitectureError

**Rules:**
- Repositories MUST NOT import from Presentation, Hooks, or Services
- Repositories SHOULD import from Data Sources to access storage/API/AI
- Repositories MUST implement the `IRepository<T>` interface
- Repositories MUST return `Result<T, ArchitectureError>` types
- Repositories SHOULD NOT contain business logic (that belongs in Services)

### 5. Data Sources Layer

**Directory:** `src/database/`, `src/api/`, `src/ai/`

The Data Sources layer provides low-level access to external systems. Each data source type has its own subdirectory with a consistent interface pattern.

**Responsibilities:**
- **Database (`src/database/`):** SQLite/MMKV persistence, local storage operations
- **API (`src/api/`):** HTTP client configuration, request/response interceptors, API endpoint definitions
- **AI (`src/ai/`):** AI/ML service integrations, prompt construction, response parsing

**Rules:**
- Data Sources MUST NOT import from Presentation, Hooks, Services, or Repositories
- Data Sources MAY import shared types, errors, and utilities
- Data Sources SHOULD expose a clean, testable interface
- Data Sources SHOULD handle their own error types and convert to ArchitectureError

### 6. Storage / API / AI (Infrastructure)

**Directory:** Various infrastructure directories and external services

The outermost layer represents the actual infrastructure: file system, network, AI providers, secure storage, and other external concerns.

**Responsibilities:**
- **Storage:** MMKV key-value store, Expo SecureStore, file system access
- **API:** REST/GraphQL endpoints, WebSocket connections, third-party APIs
- **AI:** OpenAI/Anthropic API clients, model configuration, streaming responses

**Rules:**
- Infrastructure code MUST NOT be imported directly by any layer above Data Sources
- All infrastructure access MUST go through the Data Sources layer

## Dependency Rules

### Strict Dependency Direction

Dependencies MUST only point inward. A layer may depend on any layer below it but MUST NOT depend on any layer above it.

```
Presentation
    ↓
Hooks
    ↓
Services
    ↓
Repositories
    ↓
Data Sources (Database / API / AI)
    ↓
Storage / API / AI (Infrastructure)
```

### What This Means in Practice

| Layer | Can Import From |
|---|---|
| Presentation | Hooks, shared/types, shared/components, theme |
| Hooks | Services, shared/types, shared/utils, shared/hooks, stores |
| Services | Repositories, Data Sources, shared/types, shared/utils, shared/errors |
| Repositories | Data Sources, shared/types, shared/errors |
| Data Sources | shared/types, shared/errors, config |
| Infrastructure | Nothing (or external libraries only) |

## Data Flow

### Read Flow (Displaying Data)

```
User Action
    ↓
Screen Component (Presentation) — calls hook
    ↓
Hook — calls service method, manages loading/error state
    ↓
Service — applies business rules, calls repository
    ↓
Repository — queries data source(s), maps to domain entity
    ↓
Data Source — fetches from API / reads from storage
    ↓
Data returned as Result<T, ArchitectureError> propagates back up
    ↓
Hook — unwraps Result, updates component state
    ↓
Component — re-renders with data
```

### Write Flow (Creating/Updating Data)

```
User fills form → submits
    ↓
Screen Component — calls hook action
    ↓
Hook — validates with Zod schema, calls service
    ↓
Service — validates business rules, calls repository
    ↓
Repository — persists via data source(s)
    ↓
Data Source — sends API request / writes to storage
    ↓
Result returned back up the chain
    ↓
Hook — invalidates React Query cache, updates Zustand store
    ↓
Component — shows success/error feedback
```

The Profile feature is the reference implementation: its screen consumes
`useProfileForm`, which coordinates React Hook Form and TanStack Query; the
hook calls `ProfileService`; and the service delegates local persistence to
`ProfileRepository`.

## Error Handling

All layers use the `Result<T, ArchitectureError>` discriminated union type for operations that can fail. This eliminates try/catch at architectural boundaries and provides type-safe error handling.

- **ArchitectureError** contains `code`, `message`, `details`, and optional `cause`
- **AppError** is the base error class with layer-specific subclasses
- Error codes are organized by layer in `src/shared/errors/AppError.ts`
- The `src/shared/utils/result.ts` utility provides `success()`, `failure()`, `tryCatch()`, `unwrap()`, `map()`, `mapError()`, and `chain()` helpers

## Cross-Cutting Concerns

- **Configuration:** `src/config/` — environment variables, app settings, feature flags
- **Theme:** `src/theme/` — colors, typography, spacing tokens
- **Constants:** `src/constants/` — app-wide constants and enums
- **Shared Types:** `src/shared/types/` — base entity types, DTOs, Result type, pagination
- **Shared Utilities:** `src/shared/utils/` — helper functions, formatters, result utilities
- **Shared Components:** `src/shared/components/` — reusable UI primitives
- **Stores:** `src/stores/` — Zustand global state stores
