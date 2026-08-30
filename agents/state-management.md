# State Management — Agent Instructions (Zustand + TanStack Query)

Start with [`agents/03-expo-engineer.md`](03-expo-engineer.md), [`agents/04-data-architecture.md`](04-data-architecture.md) when persisted state is involved, the relevant workflow in [`agents/workflows/`](workflows/), and [`agents/compliance-gates.md`](compliance-gates.md). Use this file as the detailed state management reference.

## When to Use Each

- **Use TanStack Query (React Query) for all server state.** This includes data fetched from APIs, database queries, authentication sessions, and any other data that originates from or is persisted on a server.
- **Use Zustand for client-only state.** This includes UI state (modals open/closed, selected tab), form state that spans multiple screens, temporary draft data not yet submitted, and client-side caches that don't originate from a server.
- **Rule of thumb:** If the data would be lost on a page refresh and that's acceptable, it belongs in Zustand. If the data must survive a refresh or is owned by a backend, it belongs in TanStack Query.

## TanStack Query Patterns

- **Define all query keys in a single file** (`src/lib/queries/keys.ts`) as constants. Use a hierarchical key structure: `["entity", "detail", id]`, `["entity", "list", filters]`.
- **Create custom hooks per entity** in `src/lib/queries/`. Each hook wraps `useQuery` or `useMutation` and exposes a clean API. Example: `useUser(id)` returns `{ user, isLoading, error }`.
- **Use `queryClient.invalidateQueries()`** after mutations to refetch related data. Invalidate at the correct key level — e.g., invalidate `["users"]` to refetch all user queries, or `["users", id]` for a single user.
- **Set `staleTime` per query** based on how frequently the data changes:
  - User profile: 5 minutes
  - Feed/list data: 30 seconds
  - Real-time data: 0 (always refetch on mount)
  - Reference data (countries, config): Infinity
- **Use `gcTime` (formerly `cacheTime`)** to control how long inactive data stays in memory. Default: 5 minutes.
- **Use `placeholderData` with `keepPreviousData`** for paginated lists to avoid layout shifts when changing pages.
- **Use `enabled` option** to conditionally fetch — e.g., `enabled: !!userId` to skip the query when userId is undefined.
- **Handle mutations with `onMutate` for optimistic updates.** Roll back on error using `onError` with the saved context. Always invalidate related queries in `onSettled`.
- **Use `useInfiniteQuery`** for cursor-based or offset-based pagination. Implement `getNextPageParam` to extract the cursor from the response.

## Zustand Store Structure

- **Create one store per domain.** Do not put all state in a single monolithic store. Example stores: `useAuthStore`, `useUIStore`, `useDraftStore`.
- **Keep stores flat and minimal.** Each store should have no more than 5-7 state properties. If a store grows beyond that, split it.
- **Use slices pattern** for stores that naturally group related state. Each slice is a separate file that exports a partial store definition.
- **Define actions separately from state.** Actions are functions that modify the state. Export them as part of the store interface.
- **Use TypeScript strictly.** Define the store's state interface and action interface explicitly. Derive the store type with `StoreApi<StoreType>`.

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;
```

## Persistence Patterns

- **Use Zustand's `persist` middleware** only for non-sensitive state that must survive app restarts, such as onboarding completion and user preferences.
- **Use the existing approved storage adapter for persisted Zustand state.** Never persist auth tokens, journal text, profile details, notes, financial records, or other sensitive user content in AsyncStorage or plain MMKV.
- **Do not persist server state.** TanStack Query handles its own cache persistence via `gcTime`. If offline support is needed, use TanStack Query's `persistQueryClient` plugin instead.
- **Partial persistence:** Use the `partialize` option in the persist middleware to only persist specific fields. Never persist computed/derived state.
- **Version persisted state** using the `version` option. Provide a `migrate` function to handle schema changes between app versions.
- **Handle storage errors gracefully.** The persist middleware should silently fall back to default state if storage read/write fails.

## Cross-Store Communication

- **Do not import one Zustand store inside another.** If two stores need to share state, lift the shared state to a parent component or create a shared store slice.
- **Use TanStack Query as the source of truth** for server data. Zustand stores should not duplicate server data. If a Zustand store needs server data, read it from the TanStack Query cache using `queryClient.getQueryData()`.
- **Use `useQuery` in components** rather than syncing query results into Zustand. This keeps a single source of truth.

## Testing

- **Wrap components in `QueryClientProvider`** with a fresh `QueryClient` for each test. Use `QueryClientProvider` with `queries: { retry: false }` to avoid retries in tests.
- **Use `mockQueryClient.setQueryData()`** to pre-populate cache in tests.
- **Test Zustand stores directly** by calling store actions and asserting on the resulting state. Use `act()` from React Testing Library when actions trigger re-renders.
