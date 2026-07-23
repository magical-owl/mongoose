# Meadow

A production-grade Expo application platform built with Feature-First + Clean Architecture.

## Overview

Meadow serves as a reusable foundation for future apps: Diary, Journal, Finance, Habit Tracker, AI Companion, Notes, and more.

## Architecture

**Feature-First + Clean Architecture**: Presentation → Hooks → Services → Repositories → Data Sources → Storage/API/AI

- No business logic in UI
- No API calls in screens
- No storage access from components
- Repository owns persistence
- Services own business rules
- Shared modules remain generic

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Expo SDK 57 |
| Routing | Expo Router (file-based) |
| UI | React 19 + React Native 0.86 |
| Language | TypeScript 6 (strict mode) |
| State (client) | Zustand 5 |
| State (server) | TanStack Query 5 |
| Forms | React Hook Form + Zod |
| HTTP | Axios |
| Secure Storage | Expo Secure Store |
| Local Storage | MMKV |
| Animations | Reanimated 3 |
| Gestures | Gesture Handler |
| Testing | Jest + RNTL |
| CI/CD | GitHub Actions + EAS |

## Getting Started

```bash
# Install dependencies
npm install

# Start development
npx expo start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run tests
npm test
```

## Project Structure

```
meadow/
├── app/              # Expo Router (file-based routing)
├── src/
│   ├── features/     # Feature modules (Profile, etc.)
│   ├── shared/       # Shared components, hooks, types
│   ├── services/     # Business logic layer
│   ├── repositories/ # Persistence layer
│   ├── api/          # API data sources
│   ├── ai/           # AI service integrations
│   ├── stores/       # Zustand stores
│   ├── hooks/        # Shared hooks
│   ├── providers/    # React context providers
│   ├── theme/        # Design system tokens
│   ├── config/       # App configuration
│   ├── constants/    # App constants
│   ├── database/     # Database layer
│   └── utils/        # Shared utilities
├── docs/             # Documentation
├── agents/           # AI agent instructions
├── COMPLIANCE/       # Compliance documentation
└── tests/            # Test utilities
```

## Documentation

See the `/docs/` directory for complete documentation:

- [Architecture](docs/Architecture.md)
- [Folder Structure](docs/FolderStructure.md)
- [Coding Standards](docs/CodingStandards.md)
- [Testing](docs/Testing.md)
- [Deployment](docs/Deployment.md)
- [Security](docs/Security.md)
- [Accessibility](docs/Accessibility.md)
- [Performance](docs/Performance.md)

## AI Agent Instructions

See the `/agents/` directory for AI coding agent instructions.

## Compliance

See the `/COMPLIANCE/` directory for compliance documentation.

## License

See [LICENSE](LICENSE).