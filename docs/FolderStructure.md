# Meadow Folder Structure

```
meadow/
├── app.json                          # Expo app configuration
├── babel.config.js                   # Babel configuration with module-resolver
├── eas.json                          # EAS Build & Submit configuration
├── index.ts                          # App entry point
├── metro.config.js                   # Metro bundler configuration
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
│
├── docs/                             # Project documentation
│   ├── Architecture.md               # Clean Architecture documentation
│   ├── FolderStructure.md            # This file
│   ├── CodingStandards.md            # TypeScript coding standards
│   └── Testing.md                    # Testing strategy and guidelines
│
└── src/                              # Application source code
    │
    ├── ai/                           # AI/ML data source layer
    │   ├── clients/                  # AI provider clients (OpenAI, Anthropic, etc.)
    │   ├── parsers/                  # Response parsers for structured AI output
    │   ├── prompts/                  # Prompt templates and construction
    │   └── types/                    # AI-specific types and interfaces
    │
    ├── api/                          # API data source layer
    │   ├── clients/                  # HTTP client instances (axios, fetch wrappers)
    │   ├── endpoints/                # API endpoint definitions
    │   ├── interceptors/             # Request/response interceptors (auth, logging)
    │   └── types/                    # API-specific types and DTOs
    │
    ├── config/                       # Application configuration
    │   ├── env.ts                    # Environment variable definitions
    │   ├── app.ts                    # App-wide configuration
    │   └── feature-flags.ts          # Feature flag definitions
    │
    ├── constants/                    # App-wide constants and enums
    │   ├── index.ts                  # Re-exports all constants
    │   └── ...                       # Domain-specific constant files
    │
    ├── database/                     # Database data source layer
    │   ├── migrations/               # Database migration files
    │   ├── models/                   # Database model definitions
    │   ├── repositories/             # Database-specific repository implementations
    │   └── types/                    # Database-specific types
    │
    ├── features/                     # Feature modules (Presentation layer)
    │   ├── auth/                     # Authentication feature
    │   │   ├── components/           # Feature-specific components
    │   │   ├── screens/              # Feature screens
    │   │   └── index.ts              # Feature barrel export
    │   ├── home/                     # Home feature
    │   │   ├── components/
    │   │   ├── screens/
    │   │   └── index.ts
    │   └── ...                       # Additional features
    │
    ├── hooks/                        # Custom React hooks (feature-level)
    │   ├── useAuth.ts                # Authentication hook
    │   ├── useForm.ts                # Form handling hook
    │   └── ...                       # Feature-specific hooks
    │
    ├── providers/                    # React context providers
    │   ├── AuthProvider.tsx          # Authentication context provider
    │   ├── ThemeProvider.tsx         # Theme context provider
    │   └── QueryProvider.tsx         # React Query provider setup
    │
    ├── repositories/                 # Repository layer
    │   ├── interfaces/               # Repository interfaces
    │   │   └── IRepository.ts        # Base repository interface
    │   ├── implementations/          # Repository implementations
    │   └── mappers/                  # DTO-to-entity mappers
    │
    ├── services/                     # Service layer (business logic)
    │   ├── interfaces/               # Service interfaces
    │   │   ├── IDataSource.ts        # Base data source interface
    │   │   └── IService.ts           # Base service interface
    │   └── implementations/          # Service implementations
    │
    ├── shared/                       # Shared code across all layers
    │   ├── components/               # Reusable UI components
    │   │   ├── Button.tsx
    │   │   ├── TextInput.tsx
    │   │   ├── Card.tsx
    │   │   └── index.ts
    │   ├── constants/                # Shared constants
    │   ├── errors/                   # Error types and classes
    │   │   └── AppError.ts           # Base AppError and subclasses
    │   ├── hooks/                    # Shared custom hooks
    │   ├── types/                    # Shared TypeScript types
    │   │   └── architecture.ts       # Core architecture types
    │   └── utils/                    # Shared utility functions
    │       └── result.ts             # Result type helpers
    │
    ├── stores/                       # Zustand global state stores
    │   ├── authStore.ts              # Authentication state
    │   ├── uiStore.ts                # UI state (modals, toasts, etc.)
    │   └── ...                       # Additional stores
    │
    ├── theme/                        # Design system / theme
    │   ├── colors.ts                 # Color palette tokens
    │   ├── typography.ts             # Font sizes, weights, families
    │   ├── spacing.ts                # Spacing scale tokens
    │   └── index.ts                  # Theme barrel export
    │
    └── utils/                        # General utility functions
        ├── format.ts                 # Date, number, string formatters
        ├── validation.ts             # Validation helpers
        └── ...                       # Additional utilities
```

## Directory Purpose Summary

| Directory | Layer | Purpose |
|---|---|---|
| `src/ai/` | Data Source | AI provider integrations, prompt management, response parsing |
| `src/api/` | Data Source | HTTP client setup, API endpoint definitions, network interceptors |
| `src/config/` | Cross-cutting | Environment variables, app configuration, feature flags |
| `src/constants/` | Cross-cutting | App-wide constants and enumerated values |
| `src/database/` | Data Source | Local database setup, migrations, models |
| `src/features/` | Presentation | Feature modules containing screens and UI components |
| `src/hooks/` | Hooks | Custom React hooks bridging UI to services |
| `src/providers/` | Presentation | React context providers for global app state |
| `src/repositories/` | Repository | Data access abstraction, CRUD operations, DTO mapping |
| `src/services/` | Services | Business logic, validation, orchestration |
| `src/shared/` | Cross-cutting | Reusable components, types, utilities, errors, hooks |
| `src/stores/` | Hooks | Zustand stores for client-side global state |
| `src/theme/` | Cross-cutting | Design system tokens (colors, typography, spacing) |
| `src/utils/` | Cross-cutting | General-purpose utility functions |
| `docs/` | Documentation | Project documentation files |
