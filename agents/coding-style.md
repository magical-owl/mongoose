# AI Agent Coding Style Instructions

## TypeScript Configuration

- **Strict mode is mandatory.** `tsconfig.json` sets `strict: true`. Never disable strict checks.
- No `any` type is permitted. Use `unknown` and type narrowing instead. If you must escape type safety, use a documented `ts-expect-error` with a reason comment.
- Prefer `interface` over `type` for object shapes. Use `type` for unions, intersections, and utility types.
- Use `as const` for literal constants and enum-like objects.
- Use branded types for domain primitives (e.g., `UserId` instead of `string`).
- Enable `noUncheckedIndexedAccess` — always handle `| undefined` when accessing indexed values.
- Use `satisfies` operator to validate types without widening.

## Naming Conventions

| Construct | Convention | Example |
|-----------|-----------|---------|
| Files | kebab-case | `user-service.ts`, `use-auth.ts` |
| React components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase, prefixed `use` | `useUserProfile` |
| Services | PascalCase | `UserService` |
| Repositories | PascalCase | `UserRepository` |
| Interfaces | PascalCase, prefixed `I` | `IUserRepository` |
| Types | PascalCase | `UserProfile`, `ServiceResult<T>` |
| Functions | camelCase | `formatDate`, `validateEmail` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Enums (avoid) | PascalCase | Prefer `as const` objects + union types |
| Private members | Prefix `_` only for unused params | `_unusedParam` |

## File Structure & Organization

### Within a file, order items as:

1. Imports (grouped: external → internal → type-only)
2. Constants
3. Types/Interfaces
4. Pure functions
5. Class/component definition
6. Exports (named exports only — no default exports)

### Import ordering — grouped with blank lines between:

```
// 1. External dependencies (npm packages)
import React, { useCallback } from 'react';
import { View, Text } from 'react-native';

// 2. Internal path aliases (grouped by layer)
import { useTheme } from '@theme/hooks';
import { Button } from '@shared/components/ui';
import { UserService } from '@features/profile/services/UserService';
import { IUserRepository } from '@features/profile/repositories/IUserRepository';

// 3. Relative imports (only when path alias is impractical)
import { formatDate } from '../../utils/date';
```

### Within each group:
- React/React Native imports first.
- Alphabetical by module source.
- Type-only imports use `import type { ... }`.

## Imports

- **Always use path aliases** (`@features/`, `@shared/`, `@services/`, etc.) — never deep relative paths like `../../../`.
- **Named exports only.** No `export default` — this enables consistent refactoring and explicit imports.
- Use `import type` for type-only imports to avoid bundler inclusion.
- Barrel exports (`index.ts`) should only re-export what other features may consume. Internal modules import directly.

## Comments

- **JSDoc/TSDoc** for every public function, service method, interface, and type.
- **Inline comments** for non-obvious logic, edge cases, and performance considerations.
- **No commented-out code.** Delete it. If you need it back, use version control.
- **No trailing comments** on the same line as code — place above the relevant line.
- **`TODO` comments** must include an issue reference: `// TODO(#123): handle pagination`.

## Strict Types — Never `any`

- Replace `any` with:
  - `unknown` + type guards for dynamic data (API responses, JSON parse).
  - `Record<string, unknown>` for dictionaries.
  - Proper union types for constrained values.
  - Generics for reusable utilities.
- Use Zod schemas to validate and infer types for external data.
- Avoid type assertions (`as`) — prefer type guards and narrowing.
- If `as` is unavoidable, add a comment explaining why the assertion is safe.

## Patterns

### Result Type Pattern

```typescript
type Result<T, E = ServiceError> =
  | { ok: true; data: T }
  | { ok: false; error: E };
```

### Dependency Injection

```typescript
class UserService {
  constructor(private readonly userRepo: IUserRepository) {}
  // No repository instantiation inside methods
}
```

### Zod Validation at Boundaries

```typescript
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});
type CreateUserInput = z.infer<typeof CreateUserSchema>;

class UserService {
  async create(input: unknown): Promise<Result<User>> {
    const parsed = CreateUserSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: { code: 'VALIDATION_ERROR', details: parsed.error } };
    }
    // ... proceed with parsed.data
  }
}
```

### Avoid These Anti-Patterns

| Anti-Pattern | Instead Do |
|-------------|-----------|
| `const x: any = ...` | `const x: unknown = ...` + type guard |
| `export default Component` | `export function Component() {}` |
| `import X from './X'` (default) | `import { X } from './X'` |
| Deep relative imports | `@features/auth/services/AuthService` |
| `enum Direction { ... }` | `const Direction = { Up: 'up', Down: 'down' } as const; type Direction = (typeof Direction)[keyof typeof Direction];` |
| `interface Props { ... }` in same file as component | Extract to `types.ts` if shared, or keep co-located if small |
| `// @ts-ignore` | `// @ts-expect-error <reason>` |
| `console.log` | Use the project's logger utility |

## React Component Style

- Functional components only — no class components.
- Destructure props in the function signature.
- Define `StyleSheet.create()` outside the component (not inside render).
- Use `useCallback` for handlers passed as props to child components.
- Use `useMemo` for expensive computations.
- Accessibility attributes on every interactive element (`accessibilityLabel`, `accessibilityRole`, `accessibilityState`).
- Test IDs on elements that tests interact with: `testID="user-profile-submit-button"`.
