import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';
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

export function AppFooterNavigation({ activeItem, bottom }: AppFooterNavigationProps): React.JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const t = useTranslation();

  return (
    <InsetFloatingToolbar bottom={bottom} style={styles.toolbar} testID="app-footer-navigation">
      {navItems.map((item) => {
        const active = item.key === activeItem;
        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => {
              if (!active) router.replace(item.route);
            }}
            style={[
              styles.item,
              active && { backgroundColor: theme.colors.tint + '18' },
            ]}
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
    </InsetFloatingToolbar>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  item: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
});
