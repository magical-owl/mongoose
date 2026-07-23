# AI Agent Service Instructions

## Implement Business Logic in Services, Not in Hooks or Components
- All business logic must live in service classes/functions, never in React hooks, custom hooks, or UI components.
- Services receive inputs, apply domain rules, call repositories, and return results.
- Hooks should only bridge service results into React state; they should not contain domain logic.
- Components should only handle rendering and user interaction; they delegate to hooks or services.

## Use Dependency Injection for Repositories
- Inject repository dependencies into service constructors or function parameters—never instantiate repositories inside a service.
- Use a container or factory pattern to wire up services with their repository dependencies.
- This makes services testable: repositories can be mocked or replaced without changing service code.
- Example pattern:
  ```typescript
  class UserService {
    constructor(private userRepo: IRepository<User>) {}
    async getProfile(userId: string): Promise<Result<UserProfile>> { ... }
  }
  ```

## Validate Input with Zod
- Every public service method must validate its inputs using a Zod schema before processing.
- Define Zod schemas for each method's expected payload, possibly reusing shared schemas.
- Return a typed validation error if inputs are invalid—do not proceed with malformed data.
- Example:
  ```typescript
  const CreateUserSchema = z.object({ email: z.string().email(), name: z.string().min(1) });
  type CreateUserInput = z.infer<typeof CreateUserSchema>;
  ```

## Return Typed Results
- Use a discriminated union `Result<T>` type for all service method return values.
- This forces callers to handle both success and failure paths exhaustively.
- Include typed error codes so the UI can map errors to localized messages without string parsing.
- Never return raw data that could be `undefined` or `null` without wrapping it in a Result type.
- Example:
  ```typescript
  type ServiceResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: ServiceError };
  ```

## Handle Errors Properly
- Catch repository-level errors in the service and translate them into domain-meaningful `ServiceError` types.
- Do not let database or network errors bubble up to the UI layer directly.
- Log errors at the service boundary with sufficient context for debugging (PII stripped).
- Use a consistent error hierarchy: `NotFoundError`, `ValidationError`, `NetworkError`, `UnauthorizedError`, `UnknownError`.

## Write Service Tests
- Write unit tests for every service method covering: valid input → success path, invalid input → validation error, repository failure → mapped service error, offline scenario, edge cases.
- Mock all repository dependencies; never hit real databases or APIs in service tests.
- Verify that the correct repository methods are called with the expected arguments.
- Test error translations: confirm that a `NetworkError` from the repo becomes the appropriate `ServiceError`.
- Test idempotent operations (e.g., updating a record with the same data twice yields the same result).
