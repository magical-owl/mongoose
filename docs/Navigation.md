# Navigation (Expo Router)

## Overview

Meadow uses Expo Router for file-based routing. The navigation structure mirrors the app's feature hierarchy and enforces type safety across all routes.

## File-Based Routing

Routes are defined by the file system under `app/`. Each file or directory maps to a URL path.

```
app/
  _layout.tsx          — Root layout
  (tabs)/
    _layout.tsx        — Tab navigator layout
    index.tsx          — / (Home tab)
    explore.tsx        — /explore
    profile.tsx        — /profile
    notifications.tsx  — /notifications
  (auth)/
    _layout.tsx        — Auth stack layout
    login.tsx          — /login
    signup.tsx         — /signup
    forgot-password.tsx — /forgot-password
  modal/
    _layout.tsx        — Modal group layout
    create-post.tsx    — /modal/create-post
    settings.tsx       — /modal/settings
  post/
    [id].tsx           — /post/:id
  ...
```

Route groups (parentheses) organize screens without affecting the URL path.

## Root Layout

`app/_layout.tsx` is the root layout. It wraps the entire app and sets up:

- Providers (query client, auth, theme)
- Font loading
- Splash screen management
- Navigation guards

```tsx
export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }} />
    </Providers>
  )
}
```

## Tab Navigators

Tab navigators are defined in route groups with their own `_layout.tsx`.

```tsx
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: HomeIcon }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", tabBarIcon: ExploreIcon }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ProfileIcon }} />
    </Tabs>
  )
}
```

Each tab screen is a file inside the group directory. The `name` prop matches the file name (without extension).

## Stack Navigators

Stack navigators are used for linear flows (auth, onboarding, post creation).

```tsx
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: "Log In" }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Reset Password" }} />
    </Stack>
  )
}
```

Stacks can be nested inside tabs or presented as modals.

## Modals

Modal presentations use a separate route group with `presentation: "modal"`.

```tsx
export default function ModalLayout() {
  return (
    <Stack screenOptions={{ presentation: "modal" }}>
      <Stack.Screen name="create-post" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
```

Modals are navigated to with `router.push("/modal/create-post")` and dismissed with `router.back()`.

## Deep Linking

Deep linking is configured in `app.json` under the `scheme` field.

```json
{
  "expo": {
    "scheme": "meadow"
  }
}
```

Expo Router handles deep link resolution automatically. Custom link configuration is added in `app.config.ts` if needed:

```ts
linking: {
  prefixes: ["meadow://", "https://meadow.dev"],
  config: {
    screens: {
      post: "post/:id",
      profile: "profile/:username",
    },
  },
}
```

## Type-Safe Routes

All routes are fully typed. The `app/` directory structure generates TypeScript types automatically.

```ts
import { router } from "expo-router"

// Type-checked navigation
router.push("/post/123")
router.push({ pathname: "/post/[id]", params: { id: "123" } })
```

Invalid paths or missing params produce compile-time errors.

Route params are accessed via `useLocalSearchParams` with full typing:

```ts
const { id } = useLocalSearchParams<{ id: string }>()
```

## Navigation Guards

Guards are implemented in layouts using `useEffect` or middleware patterns.

```tsx
export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Redirect href="/login" />
  }

  return <Stack />
}
```

Common guard patterns:

- **Auth guard** — Redirects unauthenticated users to login
- **Onboarding guard** — Redirects new users to the onboarding flow
- **Role guard** — Restricts access based on user role
- **Feature flag guard** — Hides routes behind feature flags

Guards live in the layout file of the route group they protect.
