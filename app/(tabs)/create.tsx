import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

export default function CreateTabScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/entry/new');
  }, [router]);

  return <View />;
}
