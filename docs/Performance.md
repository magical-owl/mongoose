# Performance Guidelines

## React Native Rendering Optimization

### useMemo

Memoize expensive computations to avoid recalculating on every render.

```tsx
// src/hooks/useFilteredItems.ts
import { useMemo } from 'react';

interface Item {
  id: string;
  title: string;
  category: string;
  timestamp: number;
}

export function useFilteredItems(
  items: Item[],
  searchQuery: string,
  selectedCategory: string | null
): Item[] {
  return useMemo(() => {
    let filtered = items;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [items, searchQuery, selectedCategory]);
}
```

### useCallback

Memoize callback functions to prevent unnecessary re-renders of child components.

```tsx
// src/components/ItemList.tsx
import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import { ItemCard } from './ItemCard';

interface ItemListProps {
  items: Item[];
  onItemPress: (id: string) => void;
  onItemFavorite: (id: string) => void;
}

export const ItemList: React.FC<ItemListProps> = ({ items, onItemPress, onItemFavorite }) => {
  const handlePress = useCallback((id: string) => {
    onItemPress(id);
  }, [onItemPress]);

  const handleFavorite = useCallback((id: string) => {
    onItemFavorite(id);
  }, [onItemFavorite]);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <ItemCard
        item={item}
        onPress={handlePress}
        onFavorite={handleFavorite}
      />
    ),
    [handlePress, handleFavorite]
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
  );
};
```

### React.memo

Prevent re-renders when props haven't changed.

```tsx
// src/components/ItemCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ItemCardProps {
  item: Item;
  onPress: (id: string) => void;
  onFavorite: (id: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = React.memo(
  ({ item, onPress, onFavorite }) => {
    return (
      <TouchableOpacity onPress={() => onPress(item.id)}>
        <View>
          <Text>{item.title}</Text>
          <TouchableOpacity onPress={() => onFavorite(item.id)}>
            <Text>Favorite</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.title === nextProps.item.title &&
      prevProps.item.timestamp === nextProps.item.timestamp
    );
  }
);
```

### When to Use Each Optimization

| Technique | Use Case | Example |
|-----------|----------|---------|
| `useMemo` | Expensive calculations, derived data | Filtering, sorting, formatting |
| `useCallback` | Callbacks passed to memoized children | Event handlers, render props |
| `React.memo` | Pure components that render often | List items, cards, cells |
| `useMemo` + `React.memo` | Combined for maximum benefit | Large lists with complex items |

### Anti-Patterns

- Do not wrap every value in `useMemo` — the overhead of memoization can exceed the cost of recalculation.
- Do not use `React.memo` on components that always receive different props (e.g., inline objects).
- Do not use `useCallback` for callbacks that are only used in the same component.
- Avoid creating new objects/arrays in render (inline styles, anonymous functions).

## FlatList Virtualization

### FlatList Configuration

```tsx
// src/components/OptimizedFlatList.tsx
import React from 'react';
import { FlatList, View, Text } from 'react-native';

interface OptimizedFlatListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T) => string;
}

export function OptimizedFlatList<T>({
  data,
  renderItem,
  keyExtractor,
}: OptimizedFlatListProps<T>) {
  return (
    <FlatList
      data={data}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={keyExtractor}
      
      // Performance props
      removeClippedSubviews={true}        // Remove off-screen views
      maxToRenderPerBatch={10}             // Max items rendered per batch
      windowSize={5}                       // Number of screens to render (1 = current, 5 = 2.5 each side)
      initialNumToRender={10}              // Initial render count
      updateCellsBatchingPeriod={50}       // ms between batch updates
      
      // Optimization
      getItemLayout={getItemLayout}        // Fixed height items
      legacyImplementation={false}         // Use JS implementation (slower)
      
      // Props to avoid
      // inverted={true}                   // Disables some optimizations
      // horizontal={true}                 // Disables some optimizations
    />
  );
}

// getItemLayout for fixed-height items
const ITEM_HEIGHT = 80;
function getItemLayout(_data: unknown[] | null, index: number) {
  return {
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  };
}
```

### When FlatList Is Not Enough

Start with `FlatList` because it is already part of React Native. If profiling shows `FlatList` cannot meet the required performance target, run `agents/dependency-review.md` before adding a replacement list library.

### Virtualization Best Practices

- Provide `keyExtractor` with stable, unique keys (never use index).
- Use `getItemLayout` for fixed-height items.
- Set `windowSize` based on list complexity (lower for complex items).
- Avoid `inline` functions in `renderItem` — memoize with `useCallback`.
- Keep `renderItem` components lightweight and memoized.
- Avoid state changes in items that are off-screen.
- Use `React.memo` on list item components.

## Image Optimization

### Image Caching

```tsx
// src/components/CachedImage.tsx
import React, { useState } from 'react';
import { Image, View, ActivityIndicator, StyleSheet } from 'react-native';
import type { ImageStyle } from 'react-native';

// Use expo-image for built-in caching
import { Image as ExpoImage } from 'expo-image';

interface CachedImageProps {
  uri: string;
  style?: ImageStyle;
  placeholder?: string;
  priority?: 'low' | 'normal' | 'high';
}

export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  style,
  placeholder,
  priority = 'normal',
}) => {
  return (
    <ExpoImage
      source={{ uri }}
      style={style}
      placeholder={placeholder ? { uri: placeholder } : undefined}
      contentFit="cover"
      transition={200}
      priority={priority}
      cachePolicy="memory-disk"
      recyclingKey={uri}
    />
  );
};
```

### Image Sizing

```tsx
// src/hooks/useOptimizedImageSize.ts
import { useWindowDimensions } from 'react-native';

interface ImageDimensions {
  width: number;
  height: number;
}

export function useOptimizedImageSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number
): ImageDimensions {
  const { width: screenWidth } = useWindowDimensions();
  const targetWidth = maxWidth ?? screenWidth - 32; // 16px padding each side
  const aspectRatio = originalWidth / originalHeight;

  return {
    width: targetWidth,
    height: targetWidth / aspectRatio,
  };
}
```

### Image Formats

| Format | Use Case | Notes |
|--------|----------|-------|
| JPEG | Photographs, complex images | Good compression, no transparency |
| PNG | Icons, UI elements, transparency | Lossless, larger file size |
| WebP | Modern replacement for JPEG/PNG | 25-35% smaller than JPEG, supports transparency |
| AVIF | Next-gen format | 50% smaller than JPEG, limited device support |
| SVG | Icons, logos, illustrations | Scalable, small file size, no photos |

### Image Optimization Checklist

- [ ] Resize images to display dimensions (never load 4000px images for 200px containers).
- [ ] Use WebP format where supported (Expo handles fallback).
- [ ] Implement progressive loading with blurhash or thumbnail placeholders.
- [ ] Use Expo-compatible image tooling and existing project dependencies for disk caching.
- [ ] Set `priority` on images (high for hero images, low for off-screen).
- [ ] Preload critical images with `Image.prefetch()`.
- [ ] Lazy-load images below the fold.
- [ ] Use responsive image sizes for different screen densities.

```tsx
// Prefetch critical images
import { Image } from 'react-native';

const CRITICAL_IMAGES = [
  'https://api.meadowapp.com/images/hero.jpg',
  'https://api.meadowapp.com/images/logo.png',
];

export function preloadCriticalImages(): void {
  CRITICAL_IMAGES.forEach((uri) => {
    Image.prefetch(uri);
  });
}
```

## Bundle Size Analysis with Metro

### Analyzing Bundle Size

```bash
# Generate a bundle stats file
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output /tmp/bundle.js --assets-dest /tmp/assets

# Analyze with Metro
npx metro bundle --platform ios --dev false --entry-file index.js --bundle-output /tmp/bundle.js --assets-dest /tmp/assets --stats-output /tmp/stats.json

# Visualize with bundle analyzer
npx source-map-explorer /tmp/bundle.js

# Or use expo's built-in analyzer
npx expo-analyzer
```

### Bundle Size Budgets

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Initial JS bundle | < 2 MB | 2-4 MB | > 4 MB |
| Total app size (iOS) | < 100 MB | 100-200 MB | > 200 MB |
| Total app size (Android) | < 50 MB | 50-100 MB | > 100 MB |
| Asset size (images, fonts) | < 20 MB | 20-50 MB | > 50 MB |

### Bundle Size Reduction Strategies

```bash
# 1. Enable Hermes (smaller bytecode, faster startup)
# In app.json or app.config.ts:
{
  "expo": {
    "jsEngine": "hermes"
  }
}

# 2. Tree shaking (remove unused exports)
# Metro enables tree shaking by default in production

# 3. Lazy load screens with React.lazy
```

```tsx
// src/navigation/AppNavigator.tsx
import React, { lazy, Suspense } from 'react';
import { ActivityIndicator } from 'react-native';

const HomeScreen = lazy(() => import('../screens/HomeScreen'));
const ProfileScreen = lazy(() => import('../screens/ProfileScreen'));
const SettingsScreen = lazy(() => import('../screens/SettingsScreen'));

export const AppNavigator = () => (
  <Suspense fallback={<ActivityIndicator size="large" />}>
    {/* Navigation container with lazy screens */}
  </Suspense>
);
```

### Metro Configuration

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  transformer: {
    ...config.transformer,
    // Enable minification
    minifierConfig: {
      compress: {
        drop_console: true,       // Remove console.log in production
        drop_debugger: true,      // Remove debugger statements
        unused: true,             // Remove unused code
      },
      output: {
        comments: false,          // Remove comments
      },
    },
  },
  // Optimize for production
  maxWorkers: 4,
  resetCache: true,
};
```

## Startup Time Reduction

### Measuring Startup Time

```bash
# iOS: Use Xcode Organizer > Metrics > Launch Time
# Or use the command line:
xcrun xctrace record --template 'Launch' --device <device-id> --output /tmp/launch.trace

# Android: Use Android Studio > Profiler
# Or use the command line:
adb shell am start -W com.meadowapp/com.meadowapp.MainActivity
```

### Startup Optimization Techniques

```tsx
// src/App.tsx
import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Load critical data first
        await loadAuthState();
        
        // 2. Prefetch critical images
        await preloadCriticalImages();
        
        // 3. Initialize analytics (non-blocking)
        initializeAnalytics();
        
        // 4. Load fonts (if using custom fonts)
        // await loadFonts();
      } catch (e) {
        console.warn('Error during app preparation:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return null; // SplashScreen is visible
  }

  return <AppNavigator />;
}
```

### Startup Time Budgets

| Phase | Target | Notes |
|-------|--------|-------|
| Cold start (first launch) | < 2 seconds | From tap to interactive |
| Warm start | < 1 second | App in memory, relaunched |
| Hot start | < 500ms | App in foreground, screen transition |
| Time to first paint | < 1 second | First meaningful content visible |
| Time to interactive | < 2 seconds | User can interact with app |

### Lazy Initialization

```tsx
// src/services/lazyInit.ts
// Defer non-critical initialization

export function initializeNonCriticalServices(): void {
  // Run after app is interactive
  requestAnimationFrame(() => {
    initializeAnalytics();
    initializeCrashReporting();
    initializeFeatureFlags();
    prefetchNonCriticalData();
  });
}

// Use InteractionManager for heavy operations
import { InteractionManager } from 'react-native';

InteractionManager.runAfterInteractions(() => {
  // Heavy computation or rendering
  loadNonCriticalData();
});
```

## Memory Management

### Detecting Memory Issues

```bash
# iOS: Use Xcode Memory Graph Debugger
# Android: Use Android Studio Memory Profiler

# React Native memory warning listener
import { AppState } from 'react-native';

AppState.addEventListener('memoryWarning', () => {
  console.warn('Memory warning received');
  // Clear caches, release resources
  clearImageCache();
  clearDataCache();
});
```

### Memory Best Practices

```tsx
// 1. Clear subscriptions on unmount
useEffect(() => {
  const subscription = someEvent.addListener(handleEvent);
  return () => {
    subscription.remove();
  };
}, []);

// 2. Avoid retaining large objects in state
// Bad: Storing entire API response in state
const [allItems, setAllItems] = useState<Item[]>([]);

// Good: Store only what's needed
const [displayedItems, setDisplayedItems] = useState<Item[]>([]);

// 3. Use pagination for large datasets
const [page, setPage] = useState(1);
const PAGE_SIZE = 20;

async function loadMore() {
  const newItems = await fetchItems(page, PAGE_SIZE);
  setDisplayedItems((prev) => [...prev, ...newItems]);
  setPage((prev) => prev + 1);
}

// 4. Release image resources
// expo-image handles this automatically
// For manual management:
import { Image } from 'react-native';

function clearImageCache() {
  Image.queryCache?.().then((cache) => {
    const keys = Object.keys(cache);
    Image.removeCache?.(keys);
  });
}
```

### Memory Leak Prevention

| Pattern | Issue | Solution |
|---------|-------|----------|
| setState after unmount | Memory leak, warning | Use `useIsMounted` ref or AbortController |
| setInterval/setTimeout | Callback retains component | Clear in useEffect cleanup |
| Event listeners | Retain references | Remove in useEffect cleanup |
| Large arrays in state | High memory usage | Paginate, virtualize, or limit |
| Image references | Cache grows unbounded | Use cache limits, LRU eviction |
| WebSocket connections | Open connections | Close on unmount, reconnect logic |
| Navigation state | Screen stack grows | Limit stack depth, use modal sparingly |

```tsx
// Safe async pattern
function useSafeAsync() {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeSetState = useCallback(
    (setter: () => void) => {
      if (isMounted.current) {
        setter();
      }
    },
    []
  );

  return { safeSetState };
}
```

## Performance Budgets

### Core Web Vitals (Mobile)

| Metric | Target | Description |
|--------|--------|-------------|
| App Start Time | < 2s | Cold start to interactive |
| Time to Interactive | < 2s | User can tap/scroll |
| Scroll Jank | < 50ms | Frame drops per 1000 frames |
| Frame Rate | 60 FPS | Smooth animations and scrolling |
| Memory Usage | < 200 MB | Peak memory during normal use |
| Bundle Size | < 2 MB | Initial JS bundle size |
| Image Load Time | < 500ms | Time to display first image |
| API Response Time | < 200ms | P95 API response time |

### Performance Budget Enforcement

```yaml
# .github/workflows/performance-check.yml
name: Performance Check

on:
  pull_request:
    branches: [main]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - name: Check bundle size
        uses: preactjs/compressed-size-action@v2
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          build-script: "npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output /tmp/bundle.js"
          minimum-change-threshold: 100
          compression: "none"
          budget:
            - path: "**/*.js"
              maxSize: "2 MB"
            - path: "**/*.png"
              maxSize: "500 KB"
            - path: "**/*.jpg"
              maxSize: "300 KB"
```

## Profiling Tools

### React Native Profiling

```bash
# 1. React DevTools Profiler
npx react-devtools

# 2. Flipper (React Native debugger)
# Install Flipper and enable React DevTools plugin

# 3. Hermes Profiler (Android)
# Record a profile:
react-native profile-hermes --filename profile.cpuprofile

# 4. Systrace (Android)
# Record a trace:
react-native systrace --record

# 5. iOS Instruments
# Time Profiler, Allocations, Leaks templates
```

### Performance Monitoring in Production

```tsx
// src/services/performanceMonitor.ts
import { InteractionManager } from 'react-native';

// Track render times
export function trackRenderTime(componentName: string, startTime: number): void {
  const endTime = performance.now();
  const renderTime = endTime - startTime;

  if (renderTime > 16) { // > 16ms = frame drop risk
    console.warn(`[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
  }

  // Send to monitoring service
  // analytics.track('render_time', { component: componentName, time: renderTime });
}

// Track interaction times
export function trackInteraction(interactionName: string): void {
  const startTime = performance.now();

  InteractionManager.runAfterInteractions(() => {
    const endTime = performance.now();
    const delay = endTime - startTime;

    if (delay > 100) {
      console.warn(`[Performance] Interaction "${interactionName}" was delayed by ${delay.toFixed(2)}ms`);
    }
  });
}

// Usage in components
function MyComponent() {
  const startTime = useRef(performance.now());

  useEffect(() => {
    trackRenderTime('MyComponent', startTime.current);
  }, []);
}
```

### Profiling Checklist

- [ ] Profile on a physical device (not simulator/emulator).
- [ ] Profile on the lowest-tier device you support (e.g., iPhone SE, budget Android).
- [ ] Profile in release mode (`--configuration Release` / `--mode release`).
- [ ] Profile with Hermes enabled (production).
- [ ] Profile with slow network (throttle to 3G).
- [ ] Profile with low battery (iOS Low Power Mode, Android Battery Saver).
- [ ] Profile with background processes (notifications, sync).
- [ ] Profile with large datasets (1000+ items in lists).
- [ ] Profile with accessibility features enabled (VoiceOver, Dynamic Type).
- [ ] Profile after extended use (memory leaks, cache growth).

### Tools Reference

| Tool | Platform | Purpose |
|------|----------|---------|
| React DevTools | Both | Component tree, props, state, profiling |
| Flipper | Both | Network, layout, crash logs, plugins |
| Xcode Instruments | iOS | CPU, memory, disk, network, animations |
| Android Studio Profiler | Android | CPU, memory, network, energy |
| Hermes Profiler | Android | JS function-level profiling |
| Systrace | Android | System-level tracing |
| Perfetto | Android | Advanced system tracing |
| react-native-performance | Both | Custom performance markers |
| Sentry Performance | Both | Production performance monitoring |
| Datadog RUM | Both | Real user monitoring |
