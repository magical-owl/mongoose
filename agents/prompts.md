# AI Agent Prompt Library

This file contains reusable prompts for AI coding agents working on the Meadow project. Each prompt is structured as a complete instruction block that can be copied and adapted for specific tasks.

---

## Table of Contents

1. [Architecture Prompts](#architecture-prompts)
2. [Feature Prompts](#feature-prompts)
3. [Testing Prompts](#testing-prompts)
4. [Documentation Prompts](#documentation-prompts)
5. [Review Prompts](#review-prompts)
6. [Refactoring Prompts](#refactoring-prompts)
7. [Debugging Prompts](#debugging-prompts)

---

## Architecture Prompts

### Evaluate a Proposed Architecture Change

```
You are reviewing a proposed architecture change for the Meadow project.

Context:
- Current architecture: Layered (Repository → Service → Store → Component) with expo-router for navigation.
- Each layer has a specific responsibility: repositories handle data access, services handle business logic, stores handle client state, components handle UI.
- Dependencies flow inward: components depend on stores/services, services depend on repositories.
- Cross-cutting concerns (auth, logging, error handling) are handled at the infrastructure layer.

Review the proposed change [DESCRIBE CHANGE] and evaluate:
1. Does it fit within the existing layered architecture? If not, what would need to change?
2. Does it introduce any circular dependencies? (Run `npx madge --circular src/` to verify.)
3. Is the change properly scoped to a single layer, or does it blur layer boundaries?
4. Are cross-cutting concerns (auth, logging, error handling) handled at the infrastructure layer, not sprinkled across features?
5. Does it introduce new global state or singletons? If so, can it be avoided?
6. Does it follow the dependency injection pattern (services receive repositories via constructor/params)?
7. Are feature modules self-contained (all related code under `src/features/<feature>/`)?
8. Does the change require updates to existing interfaces (IService, IRepository, IDataSource)?
9. What is the migration path for existing code that depends on the changed interfaces?

Provide a clear recommendation: APPROVE, APPROVE WITH CHANGES, or REJECT. If REJECT, explain exactly what must change.
```

### Design a New Feature Module

```
You are designing a new feature module for the Meadow project.

Feature: [DESCRIBE FEATURE]
Location: `src/features/<feature-name>/`

Requirements:
- Follow the project's layered architecture: Repository → Service → Store → Component.
- All feature files should be colocated under `src/features/<feature-name>/`.
- Shared/ reusable components go in `src/shared/components/`.

Define the following:

1. **Data Types (types.ts)**: Define the Zod schemas and TypeScript types for the feature's domain objects. Use Zod for runtime validation and TypeScript for compile-time safety. Export both the Zod schema and the inferred type.

2. **Repository (repository.ts)**: Create a repository class/function that implements the data access layer. Use the Axios client from `src/api/client.ts` for HTTP calls. Return `Result<T, AppError>` from `src/shared/utils/result.ts`.

3. **Service (service.ts)**: Create a service that implements business logic. Accept the repository as a dependency (constructor injection). Validate all inputs with Zod before processing. Compose multiple repositories if needed.

4. **Store (store.ts)**: Create a Zustand store for client-side state. Keep only serializable state. Use selectors for derived data. Do NOT put side effects (API calls) in store actions — those belong in the service layer.

5. **Screen(s) (screens/)**: Create the UI screens. Use `react-hook-form` with Zod resolvers for forms. Use `FlatList`/`FlashList` for lists. Handle all states: loading, empty, error, success.

6. **Navigation**: Define the route(s) using expo-router file-based routing under `app/`.

7. **Tests (__tests__/)**: Create tests for repository (mocked Axios), service (mocked repository), store (state transitions), and components (rendering, interactions).

Output the complete file contents for each of the above. Ensure all imports use the project's path aliases.
```

---

## Feature Prompts

### Implement a New Screen

```
You are implementing a new screen for the Meadow project.

Screen: [SCREEN NAME]
Route: [FILE PATH under app/]
Feature module: `src/features/<feature-name>/`

Context:
- The app uses expo-router for file-based routing.
- Navigation params should be typed using `useLocalSearchParams` with Zod validation.
- Screens should handle three states: loading, error, and success (with empty state if applicable).

Instructions:
1. Create the screen file under the appropriate `app/` directory.
2. Create a feature module under `src/features/<feature-name>/` with:
   - `types.ts`: Zod schemas and TypeScript types for the screen's data.
   - `repository.ts`: Data access layer using the Axios client.
   - `service.ts`: Business logic layer.
   - `store.ts`: Zustand store for screen-level state (if needed).
   - Components colocated in the feature folder.
3. Use `@tanstack/react-query` for server state (data fetching, caching, mutations).
4. Use `react-hook-form` with `@hookform/resolvers/zod` for forms.
5. Use `react-native-reanimated` for animations.
6. Ensure all touchable elements have `accessibilityLabel`.
7. Add tests for the screen's repository, service, store, and components.

Output the complete code for all files.
```

### Add an API Endpoint Integration

```
You are adding integration for a new API endpoint in the Meadow project.

Endpoint: [METHOD] /api/v1/[PATH]
Response shape: [DESCRIBE RESPONSE]
Error scenarios: [LIST ERROR CODES]

Instructions:
1. Add the endpoint call in the appropriate repository under `src/repositories/`. If no repository exists for this domain, create one implementing `IRepository<T>`.
2. Define Zod schemas for request parameters and response payloads in the repository file or a co-located `types.ts`.
3. Use the Axios client from `src/api/client.ts` — do NOT create a new Axios instance.
4. Return `Result<T, AppError>` from `src/shared/utils/result.ts`.
5. Add request/response transformation in the Axios interceptors if this endpoint uses a different wire format.
6. Add error mapping: map HTTP status codes to typed errors (NetworkError, ServerError, ValidationError, NotFoundError, etc.).
7. If the endpoint requires authentication, ensure the token is attached via the request interceptor (it should be automatic).
8. Add retry logic consideration: should this endpoint retry on failure? (Typically only GET endpoints should retry; mutating endpoints should not unless specified.)
9. Add tests: mock Axios, test success and error responses.

Output the complete repository code and tests.
```

### Add Form Validation with Zod

```
You are adding form validation for a feature in the Meadow project.

Feature: [FEATURE NAME]
Form fields: [LIST FIELDS WITH TYPES AND VALIDATION RULES]

Instructions:
1. Define a Zod schema for the form data in the feature's `types.ts`.
2. Use `z.object()` with refinements for cross-field validation.
3. Apply the schema using `@hookform/resolvers/zod` with `react-hook-form`.
4. Display validation errors inline next to each form field using the `errors` object from `react-hook-form`.
5. Disable the submit button while the form is submitting.
6. Show a loading indicator during submission.
7. On success, navigate to the next screen or show a success toast.
8. On error, display a user-friendly error message (not the raw Zod error).

Example schema pattern:
```typescript
import { z } from 'zod';

export const myFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type MyFormData = z.infer<typeof myFormSchema>;
```

Output the schema definition and the form component code.
```

---

## Testing Prompts

### Write Unit Tests for a Repository

```
You are writing unit tests for a repository in the Meadow project.

Repository: [REPOSITORY PATH]
API endpoint(s): [ENDPOINTS]

Instructions:
1. Use Jest as the test runner. Test files go in `__tests__/` co-located with the source file or under `tests/` at the project root.
2. Mock Axios using `jest.mock('axios')` or a helper that provides a mock Axios instance.
3. Test each repository method:
   - Success response: mock Axios to return a successful response, verify the repository returns the correct typed data.
   - Network error: mock Axios to throw a network error, verify the repository returns `NetworkError`.
   - Server error (4xx/5xx): mock Axios to return an error status, verify the repository returns the correct typed error.
   - Empty response: mock Axios to return an empty list/object, verify the repository handles it gracefully.
4. Verify that the repository calls the correct URL, HTTP method, headers, and request body.
5. Use `beforeEach` to reset mocks between tests.
6. Use descriptive test names following the pattern: `"should [expected behavior] when [condition]"`.
7. Aim for 100% coverage of repository methods (lines and branches).

Example test structure:
```typescript
import { myRepository } from '../repositories/myRepository';
import { apiClient } from '../api/client';

jest.mock('../api/client');

describe('MyRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getItems', () => {
    it('should return items when API responds successfully', async () => {
      // ...
    });

    it('should return NetworkError when network fails', async () => {
      // ...
    });
  });
});
```

Output the complete test file.
```

### Write Unit Tests for a Service

```
You are writing unit tests for a service in the Meadow project.

Service: [SERVICE PATH]
Repository dependencies: [LIST DEPENDENT REPOSITORIES]

Instructions:
1. Use Jest. Mock all repository dependencies.
2. Test each service method:
   - Success path: mock repositories to return success, verify the service returns the correct result (transformed/aggregated).
   - Validation error: pass invalid input, verify the service returns a `ValidationError` with the correct message.
   - Repository error: mock a repository to return an error, verify the service propagates or wraps the error correctly.
   - Edge cases: empty data from repositories, missing optional fields, boundary values.
3. Verify that the service calls the repository methods with the correct arguments.
4. Verify that business logic (transformations, calculations, filtering) produces the correct output.
5. Use dependency injection: create the service with mock repositories in the test setup.

Output the complete test file.
```

### Write Component Tests

```
You are writing component tests for the Meadow project.

Component: [COMPONENT PATH]
Props: [PROPS TYPE DEFINITION]
Rendering conditions: [DESCRIBE DIFFERENT STATES]

Instructions:
1. Use `@testing-library/react-native` for rendering and interaction.
2. Test each state the component can be in:
   - Default/initial render: verify the component renders with expected text and elements.
   - Loading state: verify a loading indicator or placeholder is shown.
   - Error state: verify the error message and retry action are rendered.
   - Empty state: verify the empty state message is shown.
   - Populated state: verify data is displayed correctly.
3. Test user interactions:
   - Tap/press: use `fireEvent.press()` and verify the expected callback is called.
   - Text input: use `fireEvent.changeText()` and verify the value updates.
   - Form submission: fill in fields and submit, verify the onSubmit handler is called with the correct data.
4. Test accessibility:
   - Check `accessibilityLabel` is set on touchable elements.
   - Check `accessibilityHint` where appropriate.
   - Verify form inputs have proper labels.
5. Use `jest.fn()` for callbacks and verify they are called with the correct arguments.
6. Use `React.memo` wrapped components may need `rerender` from the testing library.
7. Do not test internal implementation details (state values, method calls on the component instance).

Output the complete test file.
```

---

## Documentation Prompts

### Update Architecture Documentation

```
You are updating the architecture documentation for the Meadow project.

Change: [DESCRIBE THE ARCHITECTURE CHANGE]
Affected files: `docs/Architecture.md`, `docs/FolderStructure.md`, and potentially `docs/<others>.md`

Instructions:
1. Open `docs/Architecture.md` and find the sections that describe the changed component/module.
2. Update the description to reflect the new design. Keep the tone technical and precise.
3. Update any diagrams (ASCII or Mermaid) to reflect the new structure.
4. Open `docs/FolderStructure.md` and verify the folder tree matches the new file organization.
5. If a new module was added, add it to the folder structure tree and add a brief description of its purpose.
6. If interfaces changed (IService, IRepository, IDataSource), update the interface documentation.
7. Check for cross-references in other docs (e.g., `docs/Deployment.md`, `docs/Testing.md`) that may reference the changed component.
8. Ensure the docs follow the existing format and style.

Output the updated file contents for each affected documentation file.
```

### Write a README for a Feature Module

```
You are writing a README for a feature module in the Meadow project.

Feature: [FEATURE NAME]
Path: `src/features/<feature-name>/`

Include the following sections in `README.md` inside the feature folder:

1. **Overview**: 1-2 sentences describing what this feature does.
2. **Architecture**: Describe how the feature follows the layered architecture. List the repository, service, store, and screen files.
3. **Data Flow**: Diagram or description of how data flows from API → repository → service → store → component.
4. **Key Types**: List the main Zod schemas and TypeScript types defined for this feature.
5. **Dependencies**: List other features, services, or external APIs this feature depends on.
6. **Configuration**: Any feature flags, environment variables, or build-time configuration needed.
7. **Testing**: How to run tests for this feature (`npx jest src/features/<feature-name>`).
8. **Accessibility**: Any accessibility considerations specific to this feature.
9. **Known Limitations**: Any known issues, edge cases not handled, or planned improvements.

Output the complete README content.
```

### Generate API Documentation from Zod Schemas

```
You are generating API documentation from Zod schemas for the Meadow project.

Source files: [LIST FILES CONTAINING ZOD SCHEMAS]
Output: Markdown documentation describing the API request/response contracts.

For each Zod schema found:

1. Extract the schema name and its fields.
2. For each field, document:
   - Field name (camelCase).
   - Type (string, number, boolean, array, object, enum, etc.).
   - Required vs. optional.
   - Validation rules (min, max, regex, email, etc.).
   - Description (if a `.describe()` call is attached; otherwise infer from the field name).
3. For request schemas, note the HTTP method and path (if discernible from context or a nearby comment).
4. For response schemas, note the success status code and envelope structure (e.g., `{ data, meta }`).

Output the documentation in Markdown format, organized by domain/endpoint.
```

---

## Review Prompts

### Review a Pull Request

```
You are reviewing a pull request for the Meadow project.

PR: [PR URL or DESCRIPTION]
Changed files: [LIST OF FILES]

Follow the full code review process in `agents/reviewer.md`. Address each layer affected by the changes:

1. General Principles: [Check each item]
2. Layer-by-Layer Review: [Check each affected layer]
3. Architecture Compliance: [Check each item]
4. Security Review: [Check each item]
5. Accessibility Review: [Check each item]
6. Performance Review: [Check each item]
7. Testing Review: [Check each item]
8. Final Checks: [Check each item]

For each item, state:
- ✅ PASS: [brief justification]
- ⚠️ WARNING: [issue description + suggested fix]
- ❌ FAIL: [issue description + required change]

Provide a final recommendation: APPROVE, APPROVE WITH MINOR CHANGES (list them), or REQUEST CHANGES (list everything that must be fixed before approval).
```

### Security-Focused Code Review

```
You are performing a security-focused review of code changes for the Meadow project.

PR/Changes: [DESCRIPTION]
Changed files: [LIST OF FILES]

Follow the security review checklist in `agents/security.md`:

1. **Secrets**: Scan all changed files for hardcoded API keys, tokens, passwords, certificates, or credentials. Check for `.env` file inclusion.
2. **Input Validation**: Verify that all external input (API responses, user forms, deep links, notification payloads) is validated with Zod schemas before use.
3. **Data Storage**: Check that auth tokens, refresh tokens, and sensitive user data are stored in `expo-secure-store`, not `AsyncStorage`, Zustand, or plain JS objects.
4. **Logging**: Check that no PII (email, phone, exact location) is logged. Obfuscated or anonymized identifiers only.
5. **Permissions**: Verify any new platform permissions (camera, location, etc.) are scoped to the minimum needed and requested at point of use.
6. **Error Messages**: Verify that production error messages do not leak internal details (stack traces, DB errors, file paths).
7. **Deep Links**: Check that deep link URLs are validated before processing.
8. **XSS**: Verify that rendered text is sanitized and `dangerouslySetInnerHTML` is not used (web builds).
9. **API Communication**: Verify that HTTPS is used (enforced by the Axios base URL), and certificate pinning considerations are in place.

For each finding:
- ✅ SECURE: [explanation]
- ❌ VULNERABILITY: [description + severity (CRITICAL/HIGH/MEDIUM/LOW) + recommended fix]

Provide an overall security rating: PASS, PASS WITH CAVEATS, or FAIL.
```

---

## Refactoring Prompts

### Extract a Component from a Screen

```
You are extracting a reusable component from an existing screen in the Meadow project.

Source screen: [SCREEN PATH]
Component to extract: [COMPONENT DESCRIPTION]
Target: `src/shared/components/<ComponentName>.tsx`

Instructions:
1. Identify the JSX, styles, and logic that belong to the new component.
2. Create the component file under `src/shared/components/` with:
   - Proper TypeScript props interface (no `any`).
   - `StyleSheet.create()` for styles (no inline styles).
   - Accessibility labels on touchable elements.
   - React.memo if the component receives stable props and may re-render frequently.
3. Update the source screen to import and use the new component.
4. Remove the duplicated/extracted code from the screen.
5. Add tests for the new component (see "Write Component Tests" prompt).
6. Update any other screens that had duplicated code to use the new component.
7. Verify nothing is broken: run `npm run typecheck` and `npm test`.

Output the new component file, the updated screen file, and the test file.
```

### Migrate from AsyncStorage to SecureStore

```
You are migrating sensitive data storage from AsyncStorage to SecureStore for the Meadow project.

Files to scan: [DIRECTORY or GLOB PATTERN]

Instructions:
1. Search for all uses of `@react-native-async-storage/async-storage` or `AsyncStorage` in the codebase.
2. For each usage, determine if the stored data is sensitive:
   - Auth tokens, refresh tokens, user credentials → MUST migrate to `expo-secure-store`.
   - App preferences, theme, onboarding status → can stay in MMKV or Zustand with persist.
   - Cache data → can stay in MMKV or React Query cache.
3. For each migration candidate:
   - Replace `AsyncStorage.getItem()` with `SecureStore.getItemAsync()`.
   - Replace `AsyncStorage.setItem()` with `SecureStore.setItemAsync()`.
   - Replace `AsyncStorage.removeItem()` with `SecureStore.deleteItemAsync()`.
   - Update the import statement.
   - Handle the case where SecureStore is unavailable (e.g., simulator without keychain).
4. Update tests to mock `expo-secure-store` instead of `AsyncStorage`.
5. Verify no remaining references to AsyncStorage for sensitive data: search for `AsyncStorage` in the changed files.
6. Run `npm run typecheck` and `npm test` to verify nothing is broken.

Output the diff or list of changed files.
```

---

## Debugging Prompts

### Investigate a Crash

```
You are investigating a crash in the Meadow project.

Crash report: [SENTRY/CRASHLYTICS LINK OR STACK TRACE]
Version: [APP VERSION]
Frequency: [CRASH RATE, USER COUNT AFFECTED]
Steps to reproduce (if known): [STEPS]

Instructions:
1. Symbolicate the stack trace (ensure source maps are uploaded and matched to the version).
2. Identify the component, module, or function where the crash occurs.
3. Read the source code around the crash location.
4. Identify the root cause:
   - Null/undefined value being accessed? → Check for missing optional chaining or default values.
   - Type mismatch? → Verify Zod validation or API response shape.
   - Race condition? → Check for async operations without proper synchronization.
   - Native module crash? → Check for missing native dependency or Expo module compatibility.
   - Memory pressure? → Check for memory leaks (setInterval, subscriptions, large images).
5. Write a fix:
   - Add null checks and optional chaining.
   - Improve type validation at the boundary.
   - Add proper cleanup in `useEffect` return.
   - Guard against concurrent operations.
6. Add a regression test that reproduces the crash scenario.
7. Verify the fix with `npm run typecheck` and `npm test`.

Output the root cause analysis, the fix code, and the regression test.
```

### Performance Bottleneck Analysis

```
You are analyzing a performance bottleneck in the Meadow project.

Issue: [DESCRIPTION, e.g., "List scroll jank on the home screen"]
Device/OS: [DEVICE MODEL, OS VERSION]
Profiling data (if available): [FLIPPER/REACT DEVTOOLS PROFILER LINK OR SCREENSHOT]

Instructions:
1. Identify the likely cause:
   - Unnecessary re-renders? → Check for inline functions as props, missing `useMemo`/`useCallback`, improper Zustand selectors.
   - Expensive computations in render? → Move to `useMemo` or web worker.
   - Large lists without virtualization? → Use `FlatList`/`FlashList` with proper config.
   - Large images? → Optimize image resolution and caching.
   - Excessive bridge traffic? → Move animations to UI thread (Reanimated), avoid `setState` in animation loops.
2. Apply the fix:
   - Add `React.memo`, `useMemo`, `useCallback` as needed.
   - Memoize Zustand selectors with `useShallow` or `shallow` equality.
   - Configure list virtualization parameters.
   - Optimize image loading.
   - Move heavy work off the main thread.
3. Verify the fix:
   - Profile before and after using React DevTools profiler or Flipper.
   - Confirm frame rate improvement (target: 60 FPS).
   - Run `npm test` to ensure no regressions.

Output the changes made, the expected performance improvement, and before/after profiling metrics (if available).
```
