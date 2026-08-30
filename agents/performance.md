# AI Agent Performance Instructions

Start with [`agents/03-expo-engineer.md`](03-expo-engineer.md), the relevant workflow in [`agents/workflows/`](workflows/), and [`agents/compliance-gates.md`](compliance-gates.md). Use this file as the detailed performance reference.

## Use Reanimated for Animations
- Use `react-native-reanimated` for all animations, not the React Native `Animated` API.
- Prefer shared values (`useSharedValue`) over state-driven animations to avoid JS thread bottlenecks.
- Use `useAnimatedStyle` and `withTiming`/`withSpring` for performant, UI-thread animations.
- Avoid `setState` inside animation loops; use Reanimated's animation callbacks instead.

## Avoid Inline Styles
- Define all styles using `StyleSheet.create()` at the component level.
- Never define styles as plain objects inside JSX or inside the component function body.
- Use `StyleSheet.flatten()` only when absolutely necessary (e.g., merging dynamic styles).
- Extract repeated style patterns into shared style constants.

## Implement List Virtualization
- Use `FlatList` for large scrollable lists; never use `ScrollView` for large data sets.
- Provide `keyExtractor` with a unique, stable identifier for every item.
- Set `getItemLayout` when items have fixed dimensions to skip measurement.
- Use `windowSize`, `maxToRenderPerBatch`, and `initialNumToRender` to tune rendering windows.
- Avoid anonymous functions in `renderItem`; define the render function outside the component or wrap with `useCallback`.

## Optimize Images
- Use Expo-compatible image tooling for remote images, and prefer existing project dependencies before adding new packages.
- Specify explicit `width` and `height` on all image components to prevent layout shifts.
- Serve images at the appropriate resolution for the device (use responsive image URLs where possible).
- Use `placeholder` or blurhash for loading states instead of blank space.
- Prefetch critical images (e.g., first-visible content) using the image library's prefetch API.

## Lazy Load Components
- Use `React.lazy()` and `Suspense` for route-level code splitting in web builds.
- Use `expo-router`'s built-in lazy loading for screen-level splits.
- For heavy non-critical components (charts, maps, rich text editors), conditionally render or use dynamic imports.
- Avoid importing large libraries at the module level if they are only used in one screen.

## Minimize Re-Renders
- Memoize expensive computations with `useMemo`.
- Memoize callback functions with `useCallback` before passing them as props.
- Use `React.memo` on components that receive stable props and render frequently.
- Lift state up only when necessary; colocate state as close to the consuming component as possible.
- Use Zustand selectors or Redux `useSelector` with shallow equality to avoid unnecessary re-renders.
- Profile with React DevTools or Flipper to identify and fix render bottlenecks.

## Use Proper Key Props
- Provide stable, unique `key` props on all mapped elements and list items.
- Never use array index as a key unless the list is static and never reordered.
- Use a stable ID from the data model (e.g., `item.id`) as the key.
- Changing a key unmounts and remounts the component; use this intentionally to reset internal state.
