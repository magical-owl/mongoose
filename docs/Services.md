# Services Layer

## Overview

Meadow's services layer encapsulates business logic between the UI and data access layers. Services are stateless, composable, and testable by design.

## Business Logic

Services contain all business rules, transformations, and orchestration. UI components never import API clients or database access directly.

```
services/
  auth/
    auth-service.ts       — Login, signup, token refresh, logout
    password-service.ts   — Password validation, reset flow
  posts/
    post-service.ts       — CRUD, feed generation, content moderation
    media-service.ts      — Image upload, processing, optimization
  notifications/
    notification-service.ts — Push notification dispatch, preferences
  analytics/
    analytics-service.ts  — Event tracking, user properties
  ...
```

A service method accepts a request DTO and returns a response DTO. All inputs are validated, all outputs are typed.

```ts
export class PostService {
  async createPost(input: CreatePostInput): Promise<PostResponse> {
    this.validate(input)
    const sanitized = this.sanitizeContent(input.content)
    const post = await this.postRepository.create(sanitized)
    await this.mediaService.attachMedia(post.id, input.mediaIds)
    await this.notificationService.notifyFollowers(post.authorId, post.id)
    return this.toResponse(post)
  }
}
```

## Lifecycle

Services are instantiated once at app startup and injected where needed.

- **Initialization** — Services that require setup (e.g., opening a database connection, subscribing to a stream) implement an `init()` method called during app bootstrap
- **Teardown** — Services with cleanup needs implement a `destroy()` method called during app shutdown
- **Scope** — All services are singletons within the app process. No per-request instantiation unless stateful (rare).

```ts
export interface ServiceLifecycle {
  init?(): Promise<void>
  destroy?(): Promise<void>
}
```

## Dependency Injection

Dependencies are passed explicitly via constructor arguments. A lightweight DI container manages instantiation.

```ts
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly mediaService: MediaService,
    private readonly notificationService: NotificationService,
  ) {}
}
```

The DI container is configured in a central `container.ts` file:

```ts
export const container = {
  get postService() {
    return new PostService(
      postRepository,
      mediaService,
      notificationService,
    )
  },
  // ...
}
```

This avoids decorator-based DI and keeps dependencies visible and mockable.

## Cross-Cutting Concerns

Cross-cutting behavior is applied via wrappers, not inheritance or decorators.

- **Logging** — Every service method invocation is logged at entry and exit with duration
- **Error mapping** — Repository-level errors are mapped to domain errors at the service boundary
- **Authorization** — Service methods accept a user context and enforce permissions internally
- **Validation** — Input validation runs at the start of each public method before any side effects

```ts
export function withLogging<T extends object>(service: T): T {
  return new Proxy(service, {
    get(target, prop) {
      const original = target[prop]
      if (typeof original !== "function") return original
      return (...args: unknown[]) => {
        console.log(`[${target.constructor.name}] ${String(prop)}`, args)
        const start = performance.now()
        const result = original.apply(target, args)
        const duration = performance.now() - start
        console.log(`[${target.constructor.name}] ${String(prop)} done in ${duration}ms`)
        return result
      }
    },
  })
}
```

## Testing

### Offline operations

`OfflineService` persists writes while offline. Each collection must register an
`OfflineOperationExecutor` at app bootstrap. Queue entries are removed only
after that executor resolves successfully; missing executors and failed requests
remain queued with retry metadata. Do not register an executor until its API
contract and idempotency behavior are defined.

`NetworkProvider` synchronizes device connectivity with that queue and marks
the app session expired when a token refresh cannot recover from a 401 response.

Services are designed for unit testing without integration setup.

- **Mock dependencies** — Repositories and external services are replaced with mocks or fakes
- **No module mocking** — Dependencies are injected, so no Jest module mocks are needed
- **Pure logic** — Business rules are tested independently of I/O by mocking the data access layer

```ts
describe("PostService", () => {
  it("sanitizes content before saving", async () => {
    const repo = new InMemoryPostRepository()
    const media = new MockMediaService()
    const notifications = new MockNotificationService()
    const service = new PostService(repo, media, notifications)

    const result = await service.createPost(mockInput)

    expect(result.content).not.toContain("<script>")
  })
})
```

Integration tests against real dependencies are written separately and run as part of CI, not as part of the unit test suite.
