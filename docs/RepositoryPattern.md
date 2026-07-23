# Repository Pattern

## Overview

The Repository pattern abstracts data access behind a clean interface, decoupling business logic from data source implementation details. In Meadow, repositories manage the coordination between remote API calls and local persistence, providing a single source of truth for data operations.

---

## Repository Responsibilities

1. **Data Source Orchestration** — Coordinate between API and local storage sources, determining which to read from and write to based on connectivity, staleness, and business rules.
2. **Data Mapping** — Transform raw data from network or database layers into domain models consumed by the application layer.
3. **Caching & Offline Support** — Serve cached data when the network is unavailable and intelligently refresh stale data when connectivity returns.
4. **Error Handling** — Normalize errors from disparate sources (network failures, serialization errors, database constraints) into a consistent error model.
5. **Transaction Management** — Ensure data consistency across multiple writes, rolling back local changes if the remote write fails.

---

## Interface Contracts

Every repository conforms to a protocol/interface that defines its public contract:

```swift
protocol Repository {
    associatedtype Model: Identifiable
    associatedtype Query: RepositoryQuery

    func fetch(query: Query) async throws -> [Model]
    func fetchByID(_ id: Model.ID) async throws -> Model?
    func save(_ model: Model) async throws -> Model
    func delete(_ model: Model) async throws
    func deleteByID(_ id: Model.ID) async throws
}
```

### Query Protocol

Queries encapsulate filtering, sorting, and pagination parameters:

```swift
protocol RepositoryQuery {
    var sortDescriptors: [SortDescriptor] { get }
    var predicate: NSPredicate? { get }
    var limit: Int? { get }
    var offset: Int? { get }
}
```

### Return Types

- **Single model**: `async throws -> Model?` — returns `nil` when not found.
- **Collection**: `async throws -> [Model]` — returns empty array when no results.
- **Void operations**: `async throws -> Void` — throws on failure, succeeds silently.

---

## Data Source Composition

Repositories compose two data sources:

### 1. Remote Data Source (API)

- Handles all network requests via a networking layer (e.g., `URLSession`, Alamofire).
- Performs serialization/deserialization (JSON encoding/decoding).
- Manages authentication token injection.
- Returns raw DTOs (Data Transfer Objects) that differ from domain models.

### 2. Local Data Source (Storage)

- Persists data using Core Data, SwiftData, SQLite, or similar.
- Provides fast, offline-available reads.
- Stores the last-fetched timestamp for staleness checks.
- Returns local entities that are mapped to domain models.

### Composition Pattern

```swift
class DefaultRepository: Repository {
    private let remote: RemoteDataSource
    private let local: LocalDataSource

    func fetch(query: Query) async throws -> [Model] {
        // 1. Attempt remote fetch
        // 2. On success: persist to local, return mapped models
        // 3. On failure: fall back to local cache
    }
}
```

---

## Caching Strategies

| Strategy | Behavior | Use Case |
|---|---|---|
| **Cache-First** | Return cached data immediately, refresh in background | Dashboards, home feeds |
| **Network-First** | Attempt network, fall back to cache | Detail screens, user profiles |
| **Cache-Only** | Never hit the network | Offline-only features |
| **Network-Only** | Always fetch fresh data | Real-time data, forms |
| **Stale-While-Revalidate** | Return cache, refresh if stale | Lists, search results |

### Staleness Threshold

```swift
enum CachePolicy {
    case alwaysRefresh
    case useCacheIfFresh(TimeInterval) // e.g., 300 seconds
    case useCacheIfAvailable
}
```

---

## Offline Support

### Write-Ahead Queue

When offline, write operations are queued locally and replayed when connectivity is restored:

```swift
protocol OfflineQueue {
    func enqueue(_ operation: OfflineOperation) async throws
    func replayAll() async throws
    func clear() async throws
}
```

### Conflict Resolution

On replay, conflicts are resolved using one of:

- **Last-Write-Wins** — The queued write overwrites the server state.
- **Server-Authoritative** — The server state is kept; the queued write is discarded.
- **Merge** — Fields are merged at the attribute level.

### Connectivity Monitoring

```swift
protocol ConnectivityMonitor {
    var isConnected: Bool { get }
    var publisher: AnyPublisher<Bool, Never> { get }
}
```

---

## Error Handling

### Unified Error Type

```swift
enum RepositoryError: Error {
    case notFound
    case networkFailure(underlying: Error)
    case persistenceFailure(underlying: Error)
    case validationFailure(reason: String)
    case conflict(local: Model, remote: Model)
    case offline
}
```

### Error Mapping

Each data source maps its own errors into `RepositoryError`:

- **API errors** → `.networkFailure` or `.notFound`
- **Database errors** → `.persistenceFailure`
- **Validation errors** → `.validationFailure`

### Retry Logic

Repositories may implement retry with exponential backoff for transient network failures:

```swift
func fetchWithRetry(query: Query, retries: Int = 3) async throws -> [Model] {
    var attempt = 0
    while attempt < retries {
        do {
            return try await fetch(query: query)
        } catch RepositoryError.networkFailure {
            attempt += 1
            try await Task.sleep(nanoseconds: UInt64(pow(2.0, Double(attempt))) * 1_000_000_000)
        }
    }
    throw RepositoryError.networkFailure(underlying: ...)
}
```

---

## Testing Repositories

### Unit Testing Strategy

1. **Mock both data sources** — Use protocol-based dependencies to inject mock remote and local sources.
2. **Test each caching strategy** — Verify correct source selection for each `CachePolicy`.
3. **Test offline fallback** — Simulate network failures and assert local data is returned.
4. **Test write-ahead queue** — Enqueue operations offline, bring connectivity back, verify replay.
5. **Test error mapping** — Inject known errors from each source and assert the correct `RepositoryError`.

### Example Test

```swift
func test_fetch_networkFailure_fallsBackToLocal() async throws {
    let mockRemote = MockRemoteDataSource()
    let mockLocal = MockLocalDataSource()
    let repository = DefaultRepository(remote: mockRemote, local: mockLocal)

    mockRemote.shouldThrow = true
    mockLocal.stubbedModels = [.fixture()]

    let models = try await repository.fetch(query: .all)

    XCTAssertEqual(models.count, 1)
    XCTAssertEqual(mockLocal.fetchCallCount, 1)
}
```

---

## Example Implementations

### UserRepository

```swift
final class UserRepository: Repository {
    typealias Model = User
    typealias Query = UserQuery

    private let remote: UserRemoteDataSource
    private let local: UserLocalDataSource

    func fetch(query: UserQuery) async throws -> [User] {
        do {
            let dtos = try await remote.fetchUsers(query: query)
            let users = dtos.map { $0.toDomain() }
            try await local.persist(users)
            return users
        } catch {
            return try await local.fetch(query: query)
        }
    }

    func fetchByID(_ id: UUID) async throws -> User? {
        if let cached = try await local.fetchByID(id), !cached.isStale {
            return cached
        }
        guard let dto = try? await remote.fetchUser(id: id) else {
            return try await local.fetchByID(id)
        }
        let user = dto.toDomain()
        try await local.persist(user)
        return user
    }

    func save(_ user: User) async throws -> User {
        let dto = user.toDTO()
        let saved = try await remote.saveUser(dto)
        let domain = saved.toDomain()
        try await local.persist(domain)
        return domain
    }

    func delete(_ user: User) async throws {
        try await remote.deleteUser(user.id)
        try await local.delete(user.id)
    }

    func deleteByID(_ id: UUID) async throws {
        try await remote.deleteUser(id)
        try await local.delete(id)
    }
}
```

### PostRepository (with offline queue)

```swift
final class PostRepository: Repository {
    typealias Model = Post
    typealias Query = PostQuery

    private let remote: PostRemoteDataSource
    private let local: PostLocalDataSource
    private let offlineQueue: OfflineQueue
    private let connectivity: ConnectivityMonitor

    func save(_ post: Post) async throws -> Post {
        guard connectivity.isConnected else {
            let operation = SavePostOperation(post: post)
            try await offlineQueue.enqueue(operation)
            try await local.persist(post)
            return post
        }
        let dto = post.toDTO()
        let saved = try await remote.savePost(dto)
        let domain = saved.toDomain()
        try await local.persist(domain)
        return domain
    }
}
```

---

## Best Practices

- **Repositories should not know about each other.** Compose them at the use-case level.
- **Keep repositories focused on a single aggregate root.** Avoid "god" repositories.
- **Use value types for queries** to ensure thread safety.
- **Always map errors** — never let raw `URLError` or `NSManagedObject` errors propagate.
- **Write tests for every caching strategy** your repository supports.
- **Log data source selection** for debugging and observability.
