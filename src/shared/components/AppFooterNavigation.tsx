import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import { InsetFloatingToolbar } from './InsetFloatingToolbar';

export type AppFooterNavigationItem = 'journal' | 'calendar' | 'rediscover' | 'insights';
export const APP_FOOTER_BOTTOM_OFFSET = 4;

interface AppFooterNavigationProps {
  readonly activeItem: AppFooterNavigationItem;
  readonly bottom: number;
}

const navItems: readonly {
  readonly key: AppFooterNavigationItem;
  readonly icon: React.ComponentProps<typeof Ionicons>['name'];
  readonly route: '/(tabs)' | '/(tabs)/calendar' | '/(tabs)/rediscover' | '/(tabs)/insights';
  readonly labelKey: 'tabsHome' | 'tabsCalendar' | 'tabsRediscover' | 'tabsInsights';
}[] = [
  { key: 'journal', icon: 'journal-outline', route: '/(tabs)', labelKey: 'tabsHome' },
  { key: 'calendar', icon: 'calendar-outline', route: '/(tabs)/calendar', labelKey: 'tabsCalendar' },
  { key: 'rediscover', icon: 'sparkles-outline', route: '/(tabs)/rediscover', labelKey: 'tabsRediscover' },
  { key: 'insights', icon: 'stats-chart-outline', route: '/(tabs)/insights', labelKey: 'tabsInsights' },
];

const NAV_ITEM_GAP = 6;
let lastActiveIndex = 0;

export function AppFooterNavigation({ activeItem, bottom }: AppFooterNavigationProps): React.JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const t = useTranslation();
  const activeIndex = Math.max(navItems.findIndex((item) => item.key === activeItem), 0);
  const slideAnim = useRef(new Animated.Value(lastActiveIndex)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (trackWidth <= 0) {
        return undefined;
      }

      let isFocused = true;
      slideAnim.setValue(lastActiveIndex);

      const animation = Animated.spring(slideAnim, {
        toValue: activeIndex,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      });

      const startDelay = setTimeout(() => {
        animation.start(() => {
          if (isFocused) {
            lastActiveIndex = activeIndex;
          }
        });
      }, 80);

      return () => {
        isFocused = false;
        clearTimeout(startDelay);
        animation.stop();
      };
    }, [activeIndex, slideAnim, trackWidth]),
  );

  const itemWidth = trackWidth > 0
    ? (trackWidth - NAV_ITEM_GAP * (navItems.length - 1)) / navItems.length
    : 0;
  const translateX = slideAnim.interpolate({
    inputRange: navItems.map((_, index) => index),
    outputRange: navItems.map((_, index) => index * (itemWidth + NAV_ITEM_GAP)),
  });

  return (
    <InsetFloatingToolbar bottom={bottom} style={styles.toolbar} testID="app-footer-navigation">
      <View onLayout={handleTrackLayout} style={styles.track} testID="app-footer-navigation-track">
        {trackWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            testID="app-footer-navigation-indicator"
            style={[
              styles.indicator,
              {
                backgroundColor: theme.colors.tint + '18',
                width: itemWidth,
                transform: [{ translateX }],
              },
            ]}
          />
        ) : null}
        {navItems.map((item) => {
          const active = item.key === activeItem;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => {
                if (!active) {
                  lastActiveIndex = activeIndex;
                  router.replace(item.route);
                }
              }}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t(item.labelKey)}
              testID={`app-footer-navigation-${item.key}`}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={active ? theme.colors.tint : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </InsetFloatingToolbar>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    gap: NAV_ITEM_GAP,
    position: 'relative',
  },
  indicator: {
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  item: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    zIndex: 1,
  },
});
