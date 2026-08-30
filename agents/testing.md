# Testing Reference

Start with [`agents/06-qa-engineer.md`](06-qa-engineer.md), [`agents/compliance-gates.md`](compliance-gates.md), and the relevant workflow before using this file. This document is the detailed test strategy reference.

## Test Types and When to Use Them

| Test Type | Scope | When to Write | Framework |
|-----------|-------|---------------|-----------|
| **Unit test** | Single function, method, or class in isolation | Every service method, every repository method, every utility function | Jest |
| **Component test** | Single React component with shallow rendering | Every screen, every feature component, every shared UI component | Jest + RNTL |
| **Hook test** | Custom hook in isolation | Every custom hook that contains logic beyond simple prop forwarding | Jest + RNTL renderHook |
| **Integration test** | Cross-layer flow (screen → hook → service → repo → mock data source) | Critical user flows (auth, checkout, data sync) | Jest + RNTL |
| **E2E test** | Full app with real backend | Critical paths before release (smoke tests) | Detox / Maestro |

## Test File Naming and Location

- **Co-locate tests** with the source file they test, in a `__tests__/` subdirectory:
  ```
  src/features/auth/services/__tests__/AuthService.test.ts
  src/features/auth/hooks/__tests__/useAuth.test.ts
  src/features/auth/screens/__tests__/LoginScreen.test.tsx
  ```
- **Shared utilities** are tested in `tests/` at the project root:
  ```
  tests/unit/utils/formatDate.test.ts
  tests/unit/hooks/useDebounce.test.ts
  ```
- **Test file naming:** `<ModuleName>.test.ts` or `<ModuleName>.test.tsx` (use `.tsx` for component tests).

## Test Structure

### Follow AAA (Arrange-Act-Assert)

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('returns a session when credentials are valid', async () => {
      // Arrange
      const mockRepo = createMockRepo({ login: jest.fn().mockResolvedValue({ ok: true, data: mockSession }) });
      const service = new AuthService(mockRepo);

      // Act
      const result = await service.login({ email: 'test@example.com', password: 'validPass123' });

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockSession);
      }
      expect(mockRepo.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'validPass123' });
    });
  });
});
```

### Describe Block Hierarchy

```
describe('<ModuleName>')
  describe('<methodName>')
    it('returns X when Y')
    it('throws Z when W')
```

- Outer `describe`: the module or class name.
- Inner `describe`: the method or function name.
- `it` statements: one per behavior/outcome. Use descriptive, sentence-like names.

## Naming Conventions

- **Test descriptions** read like sentences: `it('returns the user profile when the user exists')`.
- **Test file names** match the source file: `UserService.test.ts` tests `UserService.ts`.
- **Mock variables** are prefixed with `mock`: `mockUserRepo`, `mockSession`, `mockApiResponse`.
- **Test data factories** use `build` prefix: `buildUser()`, `buildSession()`.

## Mocking

### Repository Mocks

```typescript
const createMockUserRepo = (overrides: Partial<IRepository<User>> = {}): IRepository<User> => ({
  getById: jest.fn(),
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  ...overrides,
});
```

### Service Mocks (for hook tests)

```typescript
const createMockAuthService = (overrides: Partial<AuthService> = {}): AuthService => ({
  login: jest.fn(),
  logout: jest.fn(),
  getSession: jest.fn(),
  ...overrides,
} as AuthService);
```

### API/Network Mocks

- Mock Axios at the adapter level using `jest.mock('axios')` or `axios-mock-adapter`.
- Never make real network calls in unit or component tests.
- Use `MockAdapter` for Axios: `new MockAdapter(axiosInstance)`.

### What NOT to Mock

- Pure utility functions — test them directly.
- Zod schemas — test them directly with valid and invalid inputs.
- Theme tokens — they are static constants, not dependencies.

## Coverage Requirements

| Metric | Threshold |
|--------|-----------|
| Overall project coverage | ≥80% |
| Services layer coverage | ≥90% |
| Repositories layer coverage | ≥85% |
| Hooks layer coverage | ≥80% |
| Components/Screens coverage | ≥70% |
| New code coverage | ≥90% (enforced in CI) |

Coverage is measured per-file. If a file falls below threshold, add tests before merging.

## What to Test in Each Layer

### Services

| Scenario | Test |
|----------|------|
| Valid input → success | Assert correct return value, correct repo method called with correct args |
| Invalid input → validation error | Assert `ok: false` with `VALIDATION_ERROR` code |
| Repository returns error → mapped service error | Assert error is translated to domain error type |
| Repository throws → caught and wrapped | Assert no unhandled exceptions, error is returned as `ServiceError` |
| Offline scenario | Assert appropriate offline error is returned |
| Edge cases | Empty strings, null/undefined inputs, boundary values, duplicate submissions |

### Repositories

| Scenario | Test |
|----------|------|
| Data source returns data → returns domain model | Assert correct transformation from raw data to domain model |
| Data source returns empty → returns empty/null | Assert `null` or empty array as appropriate |
| Network error → returns network error result | Assert error type is `NetworkError` |
| Offline mode → reads from cache | Assert cache is queried, not API |
| Write while offline → queued | Assert mutation is stored in offline queue |
| Online after offline → queued mutations replayed | Assert queue is processed in order |

### Hooks

| Scenario | Test |
|----------|------|
| Initial state | Assert loading state, no data, no error |
| Successful data load | Assert data is set, loading is false, error is null |
| Error state | Assert error is set, loading is false, data is null |
| Loading state | Assert loading is true during async operation |
| Component unmount | Assert no state updates after unmount (no memory leaks) |
| Re-fetch on dependency change | Assert service is called again when deps change |

### Components/Screens

| Scenario | Test |
|----------|------|
| Renders with data | Assert all expected elements are visible |
| Renders loading state | Assert loading indicator is shown |
| Renders error state | Assert error message and retry button are shown |
| Renders empty state | Assert empty state message is shown |
| User interaction | Assert callback is called on button press, form submit, etc. |
| Accessibility | Assert `accessibilityLabel`, `accessibilityRole`, `testID` are set |
| Snapshot (use sparingly) | Assert UI doesn't change unexpectedly — only for stable components |

## Testing Patterns

### Testing Async Code

```typescript
it('resolves with data on success', async () => {
  const result = await service.getProfile('user-123');
  expect(result.ok).toBe(true);
});
```

### Testing Error Paths

```typescript
it('returns validation error for invalid email', async () => {
  const result = await service.login({ email: 'not-an-email', password: '123' });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe('VALIDATION_ERROR');
  }
});
```

### Testing Hooks with renderHook

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';

it('returns user data after successful fetch', async () => {
  const mockService = createMockUserService({
    getProfile: jest.fn().mockResolvedValue({ ok: true, data: mockUser }),
  });

  const { result } = renderHook(() => useUserProfile('user-123', mockService));

  expect(result.current.isLoading).toBe(true);

  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.user).toEqual(mockUser);
  expect(result.current.error).toBeNull();
});
```

### Testing Components with RNTL

```typescript
import { render, fireEvent, screen } from '@testing-library/react-native';

it('calls onLogin when the login button is pressed', () => {
  const onLogin = jest.fn();
  render(<LoginScreen onLogin={onLogin} />);

  fireEvent.press(screen.getByTestId('login-button'));

  expect(onLogin).toHaveBeenCalledTimes(1);
});
```

## What NOT to Test

- **Implementation details** — test behavior, not internal state or private methods.
- **Third-party library internals** — assume React, Axios, Zustand work correctly.
- **Static UI without logic** — trivial presentational components may not need tests.
- **Generated code** — do not test auto-generated files.
- **Configuration files** — do not test `.env`, `tsconfig.json`, etc.

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage

# Run a single test file
npm run test -- --testPathPattern="AuthService"

# Run tests matching a name
npm run test -- --testNamePattern="returns session when credentials are valid"
```

## CI Enforcement

- All tests must pass before merging.
- Coverage must meet thresholds (see above).
- New code must have ≥90% coverage — CI will fail if below.
- Snapshot changes require human review.
- Flaky tests must be fixed or removed — do not merge with flaky tests.
