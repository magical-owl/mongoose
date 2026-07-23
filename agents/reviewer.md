# AI Agent Code Review Instructions

## General Principles

- Review the diff as a whole first, then examine each changed file in detail.
- Verify the PR matches the description and fulfills the linked issue/requirement.
- Check that the PR is scoped appropriately: one logical change per PR. Flag PRs that mix unrelated refactors with feature work.
- Ensure the code follows the project's established patterns (see docs: Architecture.md, CodingStandards.md, FolderStructure.md).
- Do not approve PRs with failing CI, unresolved merge conflicts, or TODO/FIXME comments left unresolved.
- Verify that new dependencies are justified and vetted for security, license, and bundle size impact.
- Ensure the PR title and commit messages follow conventional commits format: `type(scope): description`.

## Layer-by-Layer Review

### 1. Repository Layer (`src/repositories/`)

- Verify the repository calls the correct API endpoint or data source method.
- Check that all repository methods return typed results (e.g., `Result<T, AppError>`) from `src/shared/utils/result.ts`.
- Ensure proper error mapping: network errors → `NetworkError`, server errors → `ServerError`, validation errors → `ValidationError`.
- Confirm that request/response transformation is handled by Axios interceptors (see agents/api.md), not inline in repository methods.
- Verify that repository methods do NOT contain business logic — they should be thin wrappers around data access.
- Check that pagination, filtering, and sorting parameters are passed correctly to the API.
- Verify that caching (MMKV or React Query) is used appropriately for read-heavy endpoints.

### 2. Service Layer (`src/services/`)

- Verify services implement the `IService` interface from `src/services/interfaces/IService.ts`.
- Check that business logic is in the service layer, NOT in repositories or components.
- Verify all service methods accept and return typed parameters/results.
- Confirm validation is performed using Zod schemas at the service boundary before processing.
- Check that services compose multiple repositories or data sources as needed.
- Verify error handling: services should catch, wrap, and rethrow typed errors, not let raw exceptions propagate.
- Ensure services are testable: dependencies are injected (via constructor or function parameters), not hardcoded.
- Check that async operations have proper timeout handling and cancellation support.

### 3. Store Layer (`src/stores/`) — Zustand

- Verify stores follow the Zustand pattern: `create<StoreType>()((set, get) => ({...}))`.
- Check that only serializable state is kept in stores — non-serializable values (functions, class instances) belong elsewhere.
- Verify that derived data is computed via selectors (passed to the `useStore` hook), not stored redundantly.
- Ensure store actions are pure functions that update state immutably.
- Check that side effects (API calls, timers) live in the service layer, not inside store actions. Use `useEffect` in components or React Query to trigger service calls.
- Verify that stores are scoped correctly: global app state vs. feature-level state vs. local component state.
- Confirm that Zustand `subscribe` / `subscribeWithSelector` is used for cross-store communication instead of importing stores directly into each other.

### 4. UI / Component Layer (`src/features/`, `src/shared/components/`)

- Verify components are functional components using hooks. No class components unless there is a specific reason.
- Check that components are split appropriately: container (logic + state) vs. presentational (pure UI) separation.
- Ensure styles use `StyleSheet.create()` at the component level — no inline styles.
- Verify animations use `react-native-reanimated` (`useSharedValue`, `useAnimatedStyle`), not the RN `Animated` API.
- Check that all user-facing strings are either hardcoded constants or from a centralized i18n system (not inline magic strings).
- Verify that components accept and use proper TypeScript types (no `any`, no implicit `any`).
- Ensure `key` props on mapped elements use stable IDs, not array indices.
- Confirm that `FlatList`/`FlashList` is used for lists, with `keyExtractor`, `windowSize`, and `getItemLayout` configured.
- Check that forms use `react-hook-form` with `zod` validation resolvers.
- Verify that async operations handle all states: loading, empty, error, success. No unhandled promise rejections.
- Ensure that navigation params are typed and validated.

### 5. Routing Layer (`app/` — expo-router)

- Verify file-based routing conventions are followed (see expo-router docs and FolderStructure.md).
- Check that route groups, tabs, and layouts are nested correctly.
- Ensure deep links are handled and validated.
- Verify that route params are typed using `useLocalSearchParams` with Zod validation.
- Check that layouts provide proper loading states, error boundaries, and analytics tracking.

### 6. API Layer (`src/api/`)

- Verify the Axios instance is created in a single module (`api/client.ts`) with base URL, timeout, and interceptors.
- Check that auth tokens are attached via the request interceptor (read from SecureStore).
- Verify that 401 response handling triggers token refresh (see agents/api.md).
- Check that retry logic with exponential backoff is in the response interceptor for transient errors.
- Ensure request cancellation is supported (AbortController) for component unmount scenarios.
- Verify that response envelope unwrapping (e.g., `{ data, meta }` → data) happens in the interceptor.

## Architecture Compliance

- Verify the change follows the layered architecture (Repository → Service → Store → Component).
- Check that dependencies flow inward: components depend on stores and services, services depend on repositories.
- No circular dependencies. Run `npx madge --circular src/` if unsure.
- Verify that feature modules are self-contained: all related components, hooks, and types are colocated under `src/features/<feature>/`.
- Confirm that cross-cutting concerns (auth, logging, error handling) are handled at the infrastructure layer, not sprinkled across features.
- Check that the feature flag system is used for incomplete or experimental code paths.
- Verify that the change does not introduce new global state or singletons unnecessarily.

## Security Review

- Run through the security checklist from `agents/security.md`:
  - [ ] No secrets, credentials, or tokens hardcoded in source.
  - [ ] All external input is validated with Zod schemas.
  - [ ] No PII is logged (email, phone, exact location, auth tokens).
  - [ ] Data stored in SecureStore, not AsyncStorage or plain JS objects.
  - [ ] Deep link URLs are validated before processing.
  - [ ] API responses are validated before being used in business logic.
  - [ ] No XSS vectors (sanitize rendered text, avoid `dangerouslySetInnerHTML` in web).
- Verify that permission requests (camera, location, etc.) are scoped to the minimum needed and prompted at point of use.
- Check that error messages returned to the UI do not leak internal details (stack traces, DB errors, file paths).

## Accessibility Review

- Verify all touchable elements have accessible labels (`accessibilityLabel`, `accessibilityHint`).
- Check that images have `accessibilityRole="image"` and `accessibilityLabel` where meaningful.
- Verify that form inputs have proper `accessibilityLabel` and are associated with their labels.
- Check color contrast for any new UI elements (minimum 4.5:1 for normal text, 3:1 for large text).
- Ensure that custom components (e.g., buttons, cards) expose the correct `accessibilityRole`.
- Verify that navigation changes are announced (screen headers, route changes).
- Check that animations respect `ReduceMotion` accessibility setting.
- Test with VoiceOver/TalkBack on physical device if possible.

## Performance Review

- Run through the performance checklist from `agents/performance.md`:
  - [ ] Animations use `react-native-reanimated`, not RN `Animated`.
  - [ ] Styles use `StyleSheet.create()` — no inline styles.
  - [ ] Lists use `FlatList`/`FlashList` with proper configuration.
  - [ ] Images use `expo-image`/`fast-image` with explicit dimensions.
  - [ ] Heavy components are lazy-loaded or code-split.
  - [ ] Re-renders are minimized: `useMemo`, `useCallback`, `React.memo`, Zustand selectors with shallow equality.
  - [ ] No expensive computations in render functions.
- Check that images are served at the correct resolution (no 4K images in thumbnails).
- Verify that the change does not introduce unnecessary re-renders in parent components.
- Check for memory leaks: subscriptions cleaned up in `useEffect` return, `AbortController.abort()` on unmount.
- Flag any new `setTimeout`/`setInterval` that isn't cleaned up.

## Testing Review

- Verify that new code has corresponding tests:
  - **Repository layer**: Mock Axios, test response mapping, error handling, pagination.
  - **Service layer**: Test business logic with mocked repositories. Cover success and error paths.
  - **Store layer**: Test state transitions, selectors, and action purity.
  - **Component layer**: Use `@testing-library/react-native`. Test rendering, user interactions, state states.
  - **Integration tests**: Test critical user flows (auth, checkout, sync).
- Check that existing tests still pass (run `npm test` or `npm run test:coverage`).
- Verify that tests are deterministic: no reliance on timers, network, or shared state without proper mocking.
- Ensure test descriptions are meaningful and follow the pattern: `"should [expected behavior] when [condition]"`.
- Check that mocks are scoped per-test and cleaned up in `afterEach`.
- Verify that snapshot tests are included only for stable UI components; update snapshots if the change is intentional.
- Flag tests that are too broad, too narrow, or test implementation details instead of behavior.

## Final Checks Before Approval

- [ ] PR description clearly states what and why.
- [ ] All CI checks pass (lint, typecheck, test, build).
- [ ] No unresolved TODO/FIXME/HACK comments in changed files.
- [ ] No commented-out code left in the diff.
- [ ] Debugging statements (`console.log`, `console.warn` not for production) removed.
- [ ] Feature flags are used for incomplete work.
- [ ] Migration plan exists for breaking changes (data migrations, API contract changes).
- [ ] Documentation updated if the change affects public APIs, architecture, or user-facing behavior.
- [ ] Changelog updated if the change is user-facing.
- [ ] Review checklist items above are all satisfied.
