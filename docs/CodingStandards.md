# Meadow Coding Standards

## TypeScript Coding Standards

### 1. Naming Conventions

#### 1.1 General Rules

- Use **PascalCase** for: types, interfaces, classes, enums, type aliases, React components, decorators
- Use **camelCase** for: variables, functions, methods, properties, parameters, hooks (prefixed with `use`)
- Use **UPPER_SNAKE_CASE** for: constants (primitive values that never change), environment variable keys
- Use **kebab-case** for: file names (except React components), directory names

#### 1.2 Specific Conventions

| Construct | Convention | Example |
|---|---|---|
| Interfaces | PascalCase, prefixed with `I` | `IRepository<T>`, `IService` |
| Types | PascalCase | `EntityId`, `ArchitectureError` |
| Enums | PascalCase, members UPPER_SNAKE | `ErrorCodes.NETWORK` |
| React Components | PascalCase | `Button`, `AuthScreen` |
| Custom Hooks | camelCase, prefixed with `use` | `useAuth`, `useForm` |
| Services | PascalCase, suffixed with `Service` | `AuthService`, `UserService` |
| Repositories | PascalCase, suffixed with `Repository` | `UserRepository`, `PostRepository` |
| Data Sources | PascalCase, suffixed with `DataSource` | `ApiDataSource`, `DatabaseDataSource` |
| Store Slices | camelCase, suffixed with `Store` | `authStore`, `uiStore` |
| Private Members | camelCase, prefixed with `_` | `_cache`, `_handleError` |
| Event Handlers | camelCase, prefixed with `handle` | `handleSubmit`, `handleChange` |
| Props Interfaces | PascalCase, suffixed with `Props` | `ButtonProps`, `CardProps` |
| State Interfaces | PascalCase, suffixed with `State` | `AuthState`, `UIState` |
| DTOs | PascalCase, suffixed with `DTO` | `CreateUserDTO`, `UpdatePostDTO` |

#### 1.3 File Naming

- **React components:** PascalCase, `.tsx` extension — `Button.tsx`, `AuthScreen.tsx`
- **Hooks:** camelCase, `.ts` extension — `useAuth.ts`, `useForm.ts`
- **Services/Repositories:** PascalCase, `.ts` extension — `AuthService.ts`, `UserRepository.ts`
- **Types/Interfaces:** camelCase, `.ts` extension — `architecture.ts`, `result.ts`
- **Utilities:** camelCase, `.ts` extension — `format.ts`, `validation.ts`
- **Test files:** match source file name with `.test.ts` or `.test.tsx` suffix — `useAuth.test.ts`, `Button.test.tsx`

### 2. File Organization

#### 2.1 File Structure (Top-Down Order)

Every source file MUST follow this structure:

```typescript
// 1. JSDoc block — file-level documentation
/**
 * File description
 *
 * Detailed explanation of purpose and usage.
 */

// 2. Import statements (grouped and ordered)
// Group 1: External dependencies (node_modules)
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';

// Group 2: Internal absolute imports (using @ path aliases)
import { IRepository } from '@repositories/interfaces/IRepository';
import { Result } from '@shared/types/architecture';
import { AppError } from '@shared/errors/AppError';

// Group 3: Relative imports (same directory or parent)
import { formatDate } from '../utils/format';
import { Button } from './Button';

// 3. Type definitions (interfaces, types, enums)
export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

// 4. Constants
const SESSION_KEY = 'auth_session';

// 5. Class/function/component implementation
export class AuthService implements IService {
  // ...
}

// 6. Default export (if applicable)
export default AuthScreen;
```

#### 2.2 Import Ordering Rules

1. **External dependencies** (npm packages) — first group
2. **Internal absolute imports** (using `@/`, `@features/`, `@shared/`, etc. path aliases) — second group
3. **Relative imports** (`./`, `../`) — third group
4. **Type-only imports** — use `import type` syntax for type-only imports
5. **No side-effect imports** — avoid `import 'module'` unless absolutely necessary
6. **No barrel imports for deep paths** — prefer direct imports over barrel files for better tree-shaking

Each group MUST be separated by a blank line. Within each group, imports MUST be alphabetically sorted.

#### 2.3 Maximum File Size

- **Components:** Prefer single component per file. Maximum 300 lines.
- **Services:** Maximum 400 lines. Split into multiple service files if exceeded.
- **Hooks:** Maximum 150 lines. Extract logic into sub-hooks if exceeded.
- **Utilities:** Maximum 200 lines per utility file.

### 3. TypeScript Configuration

The project uses strict TypeScript with the following enforced rules (from `tsconfig.json`):

- `strict: true` — enables all strict type-checking options
- `noUnusedLocals: true` — errors on unused local variables
- `noUnusedParameters: true` — errors on unused function parameters
- `noFallthroughCasesInSwitch: true` — errors on fallthrough in switch
- `noImplicitReturns: true` — errors on missing returns in all code paths
- `noUncheckedIndexedAccess: true` — adds `undefined` to indexed access types
- `isolatedModules: true` — ensures compatibility with transpilers

### 4. Comments and Documentation

#### 4.1 JSDoc Requirements

All public APIs MUST have JSDoc comments. Use the following format:

```typescript
/**
 * Brief description of the function/class/interface.
 *
 * Optional detailed description with additional context,
 * usage notes, and edge case information.
 *
 * @param paramName - Description of the parameter
 * @param options - Configuration options
 * @param options.option1 - Nested option description
 * @returns Description of the return value
 * @throws {AppError} When and why this throws
 *
 * @example
 * ```typescript
 * const result = await authService.login('email', 'password');
 * ```
 */
```

**JSDoc Requirements by Construct:**

| Construct | JSDoc Required | Notes |
|---|---|---|
| Public interfaces | Yes | Document purpose and usage |
| Public types/type aliases | Yes | Document what the type represents |
| Class declarations | Yes | Document class responsibility |
| Public methods | Yes | Document parameters and return values |
| Functions (exported) | Yes | Document parameters and return values |
| React components | Yes | Document props and behavior |
| Custom hooks | Yes | Document parameters and return values |
| Private methods | No | Use inline comments if complex |
| Internal variables | No | Use meaningful names instead |
| Constants | Yes (if exported) | Document purpose and unit |

#### 4.2 Inline Comments

- Use inline comments sparingly — prefer self-documenting code with meaningful names
- Use `//` for single-line comments, placed above the code they describe
- Use `// TODO:`, `// FIXME:`, `// HACK:`, `// NOTE:`, `// OPTIMIZE:` prefixes for action items
- TODO comments MUST include a ticket/issue reference: `// TODO(PLAT-123): Implement retry logic`

#### 4.3 Comment Style Guide

```typescript
// GOOD: Explains WHY, not WHAT
// Use cursor-based pagination to avoid offset drift in real-time data
const results = await queryWithCursor(cursor, limit);

// BAD: States the obvious
// Query with cursor
const results = await queryWithCursor(cursor, limit);
```

### 5. Linting Rules

#### 5.1 ESLint Configuration

The project uses ESLint 9.x with the following configurations:

- `@eslint/js` — base ESLint recommended rules
- `typescript-eslint` — TypeScript-specific linting
- `eslint-plugin-react` — React-specific linting
- `eslint-plugin-react-hooks` — React Hooks linting

#### 5.2 Enforced Rules

**Error-level rules (MUST fix):**

- `no-unused-vars` — error (with `argsIgnorePattern: "^_"`)
- `no-console` — error (use a logger utility instead)
- `@typescript-eslint/no-explicit-any` — error (use `unknown` instead of `any`)
- `@typescript-eslint/no-non-null-assertion` — error (avoid `!` operator)
- `react-hooks/rules-of-hooks` — error (hooks must follow rules)
- `react-hooks/exhaustive-deps` — error (dependencies must be complete)
- `no-var` — error (use `const` or `let`)
- `prefer-const` — error (use `const` when variable is never reassigned)

**Warning-level rules (SHOULD fix):**

- `@typescript-eslint/explicit-function-return-type` — warn (prefer explicit return types)
- `@typescript-eslint/no-unnecessary-condition` — warn
- `max-lines` — warn (max 300 per file)
- `max-depth` — warn (max 4 levels of nesting)
- `complexity` — warn (max 10 cyclomatic complexity)

#### 5.3 Prettier Integration

Code formatting is handled by Prettier. Key formatting rules:

- Single quotes (not double)
- Semicolons required
- Trailing commas (all)
- Print width: 100 characters
- Tab width: 2 spaces
- JSX single quotes
- Bracket spacing: true
- Arrow parens: always

### 6. Code Patterns and Best Practices

#### 6.1 Type System

```typescript
// GOOD: Use type unions for finite states
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ArchitectureError };

// BAD: Use boolean flags for state
// const { isLoading, isError, data, error } = useQuery(...);

// GOOD: Use discriminated unions for results
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

// BAD: Throw/catch at architectural boundaries
// try { ... } catch (e) { ... }
```

#### 6.2 Function Patterns

```typescript
// GOOD: Explicit return types on public functions
export async function getUser(id: EntityId): Promise<Result<User, ArchitectureError>> {
  return this.repository.findById(id);
}

// GOOD: Destructure props in component signature
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ title, onPress, variant = 'primary' }: ButtonProps) {
  // ...
}
```

#### 6.3 Error Handling

```typescript
// GOOD: Use Result type at architectural boundaries
const result = await service.operation();
if (!result.success) {
  // Handle error case
  showError(result.error.message);
  return;
}
// Use result.data safely

// GOOD: Use early returns for error cases
if (!isValid) {
  return failure(new ValidationError('Invalid input'));
}
```

#### 6.4 React Component Patterns

- Use functional components with hooks (no class components)
- Define prop types as interfaces in the same file (exported if reused)
- Use `React.memo` only when profiling shows a performance need
- Avoid inline function definitions in JSX props (extract to `useCallback`)
- Avoid inline style objects (use theme tokens or StyleSheet.create)

#### 6.5 Async Patterns

- Use `async/await` over `.then()` chains
- Use `@tanstack/react-query` for server state (not manual `useEffect` + `fetch`)
- Use Zustand for client-side global state
- Use `react-hook-form` for form state management
- All async operations at architectural boundaries MUST return `Result` types

### 7. Path Aliases

Use the following path aliases (defined in `tsconfig.json` and `babel.config.js`):

| Alias | Maps To |
|---|---|
| `@/` | `src/` |
| `@features/` | `src/features/` |
| `@shared/` | `src/shared/` |
| `@services/` | `src/services/` |
| `@repositories/` | `src/repositories/` |
| `@api/` | `src/api/` |
| `@ai/` | `src/ai/` |
| `@stores/` | `src/stores/` |
| `@hooks/` | `src/hooks/` |
| `@providers/` | `src/providers/` |
| `@theme/` | `src/theme/` |
| `@config/` | `src/config/` |
| `@constants/` | `src/constants/` |
| `@database/` | `src/database/` |
| `@utils/` | `src/utils/` |
| `@tests/` | `tests/` |

### 8. Prohibited Patterns

The following patterns are **strictly prohibited**:

- `any` type — use `unknown` and narrow with type guards
- Non-null assertion (`!`) — use proper type narrowing
- `as` type assertions — prefer type guards and proper narrowing
- `// @ts-ignore` / `// @ts-expect-error` — fix the underlying type issue
- `require()` — use ES module `import` syntax
- `console.log()` — use a logger utility
- Class components — use functional components with hooks
- Direct DOM manipulation — use React refs
- `setState` with object spread — use Zustand or `useReducer`
- Barrel files that re-export many modules — prefer direct imports
- Circular dependencies — use dependency injection
- `any` in generic constraints — use proper constraint types
