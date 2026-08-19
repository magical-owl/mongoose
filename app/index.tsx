import { Redirect } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';

export default function AppIndex(): React.JSX.Element {
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  return <Redirect href={isOnboarded ? '/(tabs)' : '/onboarding'} />;
}
