# Meadow Testing Strategy

## Overview

Meadow follows a comprehensive testing strategy that covers all architectural layers. Tests are organized by type and follow the same clean architecture dependency rules as the source code. The testing approach emphasizes behavior verification over implementation details, with mocking only at architectural boundaries.

**Testing Stack:**
- **Jest** — test runner and assertions
- **@testing-library/react-native** — React Native component testing
- **@testing-library/jest-native** — custom jest matchers for React Native
- **jest-expo** — Expo-specific Jest configuration

**Source of Truth:** All test configuration is in `package.json` under the `jest` key and `jest.config.js`.

## Test Types and Coverage Requirements

### 1. Unit Tests

**Location:** Co-located with source files as `*.test.ts` files

**Target:** Pure functions, utilities, helpers, formatters, validation logic, error classes

**Coverage Requirement:** 100% of utility functions, helpers, constants, error classes

**What to Test:**
- Pure functions with well-defined inputs and outputs
- Edge cases (empty inputs, null/undefined, boundary values)
- Error paths and exception handling
- Data transformation and mapping functions
- Zod validation schemas

**What NOT to Test:**
- Third-party library internals
- Simple getters/setters
- Type definitions (trust TypeScript compiler)

**Example Pattern:**

```typescript
// src/shared/utils/format.test.ts
import { formatDate, truncateText } from './format';

describe('formatDate', () => {
  it('formats an ISO timestamp to readable date', () => {
    expect(formatDate('2024-01-15T10:30:00Z')).toBe('Jan 15, 2024');
  });

  it('returns null for invalid date input', () => {
    expect(formatDate('not-a-date')).toBeNull();
  });

  it('handles edge case of Unix epoch', () => {
    expect(formatDate('1970-01-01T00:00:00Z')).toBe('Jan 1, 1970');
  });
});
```

### 2. Service Tests

**Location:** Co-located with service files as `*.test.ts` files

**Coverage Requirement:** 100% of service methods (success paths + error paths)

**What to Test:**
- Business logic rules and validations
- Orchestration logic (calling multiple repositories in correct order)
- Error handling and error type conversions
- Authorization checks
- Complex conditional logic

**Mock Strategy:**
- Mock ONLY the repository layer (the next layer inward)
- Do NOT mock internal service methods
- Use typed mocks that conform to repository interfaces

**Example Pattern:**

```typescript
// src/services/implementations/AuthService.test.ts
import { AuthService } from './AuthService';
import { IRepository } from '@repositories/interfaces/IRepository';
import { User } from '@shared/types/architecture';
import { success, failure } from '@shared/utils/result';
import { NotFoundError, ValidationError } from '@shared/errors/AppError';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<IRepository<User>>;

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findPaginated: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
    };
    authService = new AuthService(mockUserRepo);
  });

  describe('login', () => {
    it('returns user when credentials are valid', async () => {
      const user = { id: '1', email: 'test@test.com', createdAt: '...', updatedAt: '...' };
      mockUserRepo.findById.mockResolvedValue(success(user));

      const result = await authService.login('test@test.com', 'password');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@test.com');
      }
    });

    it('returns failure when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(
        failure(new NotFoundError('User', '1').toArchitectureError())
      );

      const result = await authService.login('unknown@test.com', 'password');

      expect(result.success).toBe(false);
    });
  });
});
```

### 3. Repository Tests

**Location:** Co-located with repository files as `*.test.ts` files

**Coverage Requirement:** 100% of repository methods

**What to Test:**
- CRUD operations (findById, findAll, create, update, delete)
- Pagination and sorting logic
- Data mapping (DTO to entity transformation)
- Error handling (network errors, not found, duplicates)
- Multi-source coordination (API + cache fallback)

**Mock Strategy:**
- Mock the data source layer (API client, database client)
- Use a mock HTTP server (e.g., `nock` or `msw`) for API-based repositories
- Test against an in-memory database for local storage repositories

**Example Pattern:**

```typescript
// src/repositories/implementations/UserRepository.test.ts
import { UserRepository } from './UserRepository';
import { ApiDataSource } from '@api/clients/ApiDataSource';
import { success, failure } from '@shared/utils/result';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockApi: jest.Mocked<ApiDataSource>;

  beforeEach(() => {
    mockApi = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any;
    userRepository = new UserRepository(mockApi);
  });

  it('maps API DTO to domain entity on findById', async () => {
    const apiDto = { id: '1', email: 'test@test.com', created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' };
    mockApi.get.mockResolvedValue(success(apiDto));

    const result = await userRepository.findById('1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        id: '1',
        email: 'test@test.com',
      });
      // Ensure camelCase mapping
      expect(result.data.createdAt).toBeDefined();
    }
  });

  it('returns NotFound when API returns 404', async () => {
    mockApi.get.mockResolvedValue(
      failure({ code: 'NOT_FOUND', message: 'User not found' })
    );

    const result = await userRepository.findById('nonexistent');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});
```

### 4. Data Source Tests

**Location:** Co-located with data source files as `*.test.ts` files

**Coverage Requirement:** 100% of data source methods

**What to Test:**
- API client configuration and interceptors
- Request/response transformations
- Error handling and retry logic
- Authentication token refresh flows
- Cache hit/miss scenarios
- Network timeout and offline handling

**Mock Strategy:**
- For API data sources: use `msw` (Mock Service Worker) to intercept HTTP requests
- For database data sources: use an in-memory SQLite database
- For AI data sources: mock the AI provider client

### 5. AI Parser Tests

**Location:** `src/ai/parsers/*.test.ts`

**Coverage Requirement:** 100% coverage of all parser functions

**What to Test:**
- Parsing structured data from AI responses
- Handling malformed or incomplete responses
- Edge cases (empty responses, unexpected formats)
- Error recovery and fallback behaviors

**Example Pattern:**

```typescript
// src/ai/parsers/PromptResponseParser.test.ts
import { parseJournalEntry } from './PromptResponseParser';

describe('parseJournalEntry', () => {
  it('parses a valid AI response into a structured journal entry', () => {
    const aiResponse = `Title: My Day
Mood: happy
Content: Today was a great day.`;

    const result = parseJournalEntry(aiResponse);
    expect(result).toEqual({
      title: 'My Day',
      mood: 'happy',
      content: 'Today was a great day.',
    });
  });

  it('returns fallback values for missing fields', () => {
    const aiResponse = `Content: Just a note.`;

    const result = parseJournalEntry(aiResponse);
    expect(result.title).toBe('Untitled');
    expect(result.mood).toBe('neutral');
  });

  it('handles completely empty response', () => {
    const result = parseJournalEntry('');
    expect(result).toBeNull();
  });
});
```

### 6. Hook Tests

**Location:** Co-located with hook files as `*.test.ts` or `*.test.tsx` files

**Coverage Requirement:** 100% of hook return values and side effects

**What to Test:**
- Initial state and loading states
- Success state with expected data
- Error state with error messages
- Side effects (React Query calls, store updates)
- Form validation integration
- Cleanup on unmount

**Mock Strategy:**
- Mock service layer (the layer the hook calls)
- Use `renderHook` from `@testing-library/react-native`
- Wrap with necessary providers (QueryClientProvider, AuthProvider)
- Use `jest.spyOn` on service methods

**Example Pattern:**

```typescript
// src/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from './useAuth';
import { AuthService } from '@services/implementations/AuthService';
import { success, failure } from '@shared/utils/result';

jest.mock('@services/implementations/AuthService');

describe('useAuth', () => {
  const mockAuthService = jest.mocked(AuthService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('sets user on successful login', async () => {
    const user = { id: '1', email: 'test@test.com' };
    mockAuthService.prototype.login.mockResolvedValue(success(user));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@test.com', 'password');
    });

    expect(result.current.user).toEqual(user);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error on failed login', async () => {
    mockAuthService.prototype.login.mockResolvedValue(
      failure({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('bad@test.com', 'wrong');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.code).toBe('UNAUTHORIZED');
  });
});
```

### 7. Component Tests

**Location:** Co-located with component files as `*.test.tsx` files

**Coverage Requirement:** 90%+ of shared components, 80%+ of feature components

**What to Test:**
- Rendering with different props and states
- User interactions (press, type, swipe)
- Accessibility labels and roles
- Conditional rendering (loading, error, empty states)
- Form submission flows

**What NOT to Test:**
- Style values (trust the snapshots for style, or test behavior instead)
- Internal component state only (test user-facing behavior)
- Exact DOM structure (use `getByRole`, `getByText` instead)

**Mock Strategy:**
- Mock hooks (the layer above)
- Use `render` from `@testing-library/react-native`
- Use `userEvent` for simulating user interactions
- Wrap with necessary providers for context-dependent components

**Example Pattern:**

```typescript
// src/shared/components/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders with the given title', () => {
    const { getByText } = render(
      <Button title="Submit" onPress={() => {}} />
    );

    expect(getByText('Submit')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Submit" onPress={onPress} />
    );

    fireEvent.press(getByText('Submit'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Submit" onPress={onPress} disabled />
    );

    fireEvent.press(getByText('Submit'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { queryByTestId } = render(
      <Button title="Submit" onPress={() => {}} isLoading />
    );

    expect(queryByTestId('loading-indicator')).toBeTruthy();
  });
});
```

### 8. Integration Tests

**Location:** `src/features/*/__tests__/*.test.tsx`

**Target:** Full feature flows across multiple layers

**Coverage Requirement:** Critical user flows (login, signup, data creation)

**What to Test:**
- Complete user flows spanning multiple screens
- Navigation between screens with correct data passing
- Form submission through hooks to services to repositories
- Error handling end-to-end
- State persistence across navigation

**Mock Strategy:**
- Mock the outermost layer only (data sources / API)
- Use real implementations for hooks, services, and repositories
- Wrap with all providers (QueryClient, Auth, Theme, Navigation)
- Use `msw` to mock API responses at the network level

## Coverage Targets

| Test Type | Minimum Coverage | Target Coverage |
|---|---|---|
| Unit tests (utilities) | 100% | 100% |
| Service tests | 100% | 100% |
| Repository tests | 100% | 100% |
| Data Source tests | 100% | 100% |
| AI Parser tests | 100% | 100% |
| Hook tests | 90% | 100% |
| Component tests (shared) | 90% | 95% |
| Component tests (features) | 80% | 90% |
| Integration tests | Key flows only | All critical flows |

**Overall Project Coverage Target:** 90%+

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npx jest src/services/implementations/AuthService.test.ts

# Run tests matching a pattern
npx jest --testPathPattern="hook" --testPathPattern="auth"

# Run tests with verbose output
npx jest --verbose
```

## Mock Strategy Summary

| Layer Under Test | What to Mock | Mock Method |
|---|---|---|
| Utility functions | Nothing (pure functions) | — |
| Services | Repositories | `jest.mock()` with typed mocks |
| Repositories | Data Sources | `jest.mock()` or `msw` for API |
| Data Sources (API) | HTTP responses | `msw` (Mock Service Worker) |
| Data Sources (DB) | Database client | In-memory database |
| Data Sources (AI) | AI provider client | `jest.mock()` on provider SDK |
| Hooks | Services | `jest.spyOn()` on service methods |
| Components | Hooks | `jest.mock()` on hook modules |
| Integration | Data Sources / API | `msw` at network level |

### Mock Guidelines

1. **Mock at the architectural boundary** — mock the layer directly below the one being tested
2. **Use typed mocks** — mocks should conform to the interface they're replacing
3. **Reset mocks between tests** — use `beforeEach` with `jest.clearAllMocks()`
4. **Prefer `jest.spyOn()` over `jest.mock()`** when you need to mock a specific method while keeping others real
5. **Avoid mocking internals** — mock interfaces, not implementation details
6. **Use factory functions** for creating mock data objects
7. **Never mock what you don't own** (third-party libraries) — use adapter patterns instead

```typescript
// GOOD: Mock factory function
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-id',
    email: 'test@test.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// GOOD: Typed mock repository
const mockRepo: jest.Mocked<IRepository<User>> = {
  findById: jest.fn().mockResolvedValue(success(createMockUser())),
  findAll: jest.fn().mockResolvedValue(success([createMockUser()])),
  // ... all required methods
};
```

## Test File Organization

```
src/
├── services/
│   ├── implementations/
│   │   ├── AuthService.ts
│   │   └── AuthService.test.ts       # Co-located
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts               # Co-located
├── shared/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx           # Co-located
│   └── utils/
│       ├── format.ts
│       └── format.test.ts            # Co-located
├── features/
│   └── auth/
│       ├── screens/
│       │   ├── LoginScreen.tsx
│       │   └── LoginScreen.test.tsx  # Co-located
│       └── __tests__/
│           └── LoginFlow.test.tsx     # Integration test
```

## Test Data Management

- Use **factory functions** for creating test data (avoid static fixtures)
- Place **shared test factories** in a `__tests__/factories/` directory
- Place **shared test utilities** in a `__tests__/utils/` directory
- Use **inline data** for test-specific cases (keeps tests readable)

```typescript
// __tests__/factories/user.ts
export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    displayName: faker.person.fullName(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}
```

## Naming Conventions for Tests

- **File names:** `{sourceFile}.test.ts` or `{sourceFile}.test.tsx`
- **Describe blocks:** name the unit under test
- **Test cases:** use present tense, describe behavior
- **Nested describe:** group by method or scenario

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('returns user when credentials are valid', () => { });
    it('returns failure when user is not found', () => { });
    it('returns failure when password is incorrect', () => { });
  });

  describe('logout', () => {
    it('clears the current session', () => { });
  });
});
```

## Quality Gates

The following conditions MUST be met before merging to main:

1. All tests pass (zero failures)
2. Coverage meets minimum thresholds per layer
3. No skipped tests (`.skip`) — use `.only` only for debugging locally
4. No `console.log` in test output
5. No flaky tests — each test MUST be deterministic
6. New features include corresponding tests
7. Bug fixes include a regression test
