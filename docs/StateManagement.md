# State Management

## Overview

Meadow uses a dual-layer state management approach: Zustand for client state and TanStack Query for server state. This separation keeps concerns clean and avoids mixing cache logic with UI state.

## Zustand for Client State

Zustand manages all client-side state that is not directly tied to server data.

```ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UIState {
  sidebarOpen: boolean
  theme: "light" | "dark" | "system"
  toggleSidebar: () => void
  setTheme: (theme: "light" | "dark" | "system") => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      theme: "system",
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "ui-preferences" },
  ),
)
```

Stores are organized by domain:

```
stores/
  ui.ts          — Sidebar, modals, toasts
  auth.ts        — Auth tokens, current user session
  preferences.ts — User preferences (theme, notifications)
  draft.ts       — Unsaved form drafts
  ...
```

## TanStack Query for Server State

All server data fetching, caching, and mutation goes through TanStack Query.

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Fetch
export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: () => api.get("/posts"),
  })
}

// Mutate
export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePostInput) => api.post("/posts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
  })
}
```

Query keys follow a consistent naming convention:

```
["resource"]
["resource", id]
["resource", { filters }]
["resource", id, "nested-resource"]
```

## Store Patterns

### Slices Pattern

Larger stores use the slices pattern to split logic while keeping a single store instance.

```ts
const useBoundStore = create<BearSlice & FishSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
```

### Derived State

Derived values are computed with selectors, not stored redundantly.

```ts
const completedTodos = useTodoStore((s) => s.todos.filter((t) => t.completed))
```

### Actions

Actions are defined inside the store alongside the state they modify. Async actions use the store's `set` function directly.

```ts
fetchItems: async () => {
  set({ loading: true })
  const items = await api.get("/items")
  set({ items, loading: false })
}
```

## Persistence

Persistence is opt-in and configured per store via Zustand's `persist` middleware.

- **Persisted stores**: UI preferences, auth tokens, draft data
- **Non-persisted stores**: Ephemeral UI state, transient form state

Storage backend defaults to `AsyncStorage` on mobile and `localStorage` on web. Custom storage adapters can be passed for encryption or migration logic.

Partial persistence is supported by providing a `partialize` function:

```ts
persist(
  (set) => ({ ... }),
  {
    name: "auth",
    partialize: (state) => ({ token: state.token }),
  },
)
```

## Cross-Feature Communication

Features communicate through shared stores or query key invalidation, not through direct imports of each other's internals.

- **Shared stores** — Used when two features need to react to the same client state (e.g., auth store consumed by multiple features)
- **Query invalidation** — Used when one feature's mutation should trigger a refetch in another feature (e.g., creating a post invalidates the feed query)
- **Events** — Rare cross-cutting concerns use a lightweight event bus, but this is avoided in favor of the above patterns

No feature directly imports another feature's store or query hooks. Shared state lives in a common `stores/` directory.
