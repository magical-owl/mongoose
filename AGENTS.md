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

### Always:
- Write TypeScript with strict types
- Write tests for all new code
- Update documentation
- Reuse existing abstractions
- Follow the architecture pattern
- Use theme tokens from `@theme`
- Explain major architectural decisions

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