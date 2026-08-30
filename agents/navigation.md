# Navigation — Agent Instructions (Expo Router)

Start with [`agents/03-expo-engineer.md`](03-expo-engineer.md), the relevant workflow in [`agents/workflows/`](workflows/), and [`agents/compliance-gates.md`](compliance-gates.md). Use this file as the detailed navigation reference.

## File-Based Routing

- **Use Expo Router's file-based routing.** Every file in `app/` automatically becomes a route. The file path maps to the URL path.
- **Directory structure conventions:**
  - `app/index.tsx` → `/` (root route)
  - `app/settings.tsx` → `/settings`
  - `app/(tabs)/index.tsx` → tab-based layout
  - `app/(auth)/login.tsx` → group routes under auth layout
  - `app/[id].tsx` → dynamic route segment
  - `app/[id]/edit.tsx` → nested dynamic route
- **Use route groups `(groupName)`** to organize screens without affecting the URL path. Groups allow different layouts for different sections.
- **Use `_layout.tsx`** files to define shared layouts for a directory. The layout wraps all screens in that directory and its subdirectories.
- **Always name files in kebab-case.** E.g., `user-profile.tsx`, not `UserProfile.tsx`.

## Type-Safe Routes

- **Use `href` objects** instead of string paths for type-safe navigation. Import `Href` from `expo-router` and use the typed object form: `{ pathname: "/[id]", params: { id: "123" } }`.
- **Define route parameter types** using TypeScript generics. Create a `src/types/routes.ts` file that exports parameter types for each route.
- **Use `useLocalSearchParams()`** to access typed route parameters within a screen. Wrap with a custom hook that validates and casts the params.
- **Use `useGlobalSearchParams()`** for parameters shared across the route tree (e.g., from a root layout).
- **Do not use string interpolation** to construct paths. Always use the typed `pathname` + `params` object form.

## Deep Linking

- **Configure deep linking in `app.json`** under the `expo.scheme` field. Use a unique scheme per environment (e.g., `meadow://`, `meadow-staging://`).
- **Register universal links** (iOS) and **Android App Links** for production. Place `apple-app-site-association` and `assetlinks.json` at the root of the web domain.
- **Test deep links** using `npx uri-scheme open meadow://path --ios` and the Android equivalent.
- **Handle incoming deep links** in the root `_layout.tsx` using `useEffect` with `Linking.addEventListener`.
- **Never hardcode URLs** that include the scheme. Read the scheme from `Constants.expoConfig?.scheme`.

## Navigation Guards

- **Implement route protection using layouts.** Create an `(auth)` group with its own `_layout.tsx` that checks authentication state and redirects unauthenticated users.
- **Use `Redirect` from `expo-router`** for server-side/static redirects: `if (!user) return <Redirect href="/login" />`.
- **Use `useRouter().replace()`** for imperative navigation after side effects (e.g., after login success).
- **Redirect to the intended destination** after login by storing the `returnUrl` in global search params or a store.
- **Do not use `useEffect` for navigation guards.** Prefer conditional rendering with `Redirect` in the layout file.

## Navigation State

- **Use `useFocusEffect`** (from `expo-router`) for screen-focus side effects (refetching data, analytics, resetting state). It cleans up when the screen loses focus.
- **Do not store navigation state in global state (Zustand).** Navigation state belongs to the router. Use `usePathname()`, `useSegments()`, and `useNavigationContainerRef()` to observe it.
- **Use `router.push()`** for forward navigation, `router.back()` for going back, and `router.replace()` to replace the current history entry (e.g., after login).
- **Use `router.setParams()`** to update search params of the current route without re-rendering the layout.
- **Prefer `<Link>` component** over imperative `router.push()` for static navigation links. Use imperative navigation only for side-effect-driven navigation.

## Performance

- **Lazy load route components** by keeping screen files focused and importing heavy dependencies only where needed.
- **Use `React.memo`** on screen components that receive frequently changing search params.
- **Preload likely-next routes** using `router.prefetch()` in `useFocusEffect` for anticipated navigations.
- **Avoid nesting layouts beyond 3 levels** — deep layout trees impact navigation performance.
