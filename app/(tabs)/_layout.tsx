import { Redirect, Tabs } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';

export default function TabLayout() {
  const isOnboarded = useAppStore((state) => state.isOnboarded);

  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{}}
      />

      <Tabs.Screen
        name="calendar"
        options={{}}
      />

      <Tabs.Screen
        name="rediscover"
        options={{}}
      />

      <Tabs.Screen
        name="create"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{}}
      />

      <Tabs.Screen
        name="archive"
        options={{
          // Shelved until the archive information architecture is planned.
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
